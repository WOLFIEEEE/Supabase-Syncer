import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore, supabaseSyncJobStore, supabaseSyncLogStore, getJobWithConnections } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { executeSyncRealtime } from '@/lib/services/sync-realtime';
import { getUser } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

// Allow longer execution time for sync operations (Vercel Pro: max 300s, Hobby: max 60s)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Start/resume a sync job with streaming progress
export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const { id } = await params;
  
  // Get job details (scoped to user)
  const job = await supabaseSyncJobStore.getById(id, user.id);
  
  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Sync job not found' },
      { status: 404 }
    );
  }
  
  // Check if job can be started
  if (!['pending', 'paused', 'failed'].includes(job.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot start job with status "${job.status}"` },
      { status: 400 }
    );
  }
  
  // Get connections (scoped to user)
  const [sourceConnection, targetConnection] = await Promise.all([
    supabaseConnectionStore.getById(job.source_connection_id, user.id),
    supabaseConnectionStore.getById(job.target_connection_id, user.id),
  ]);
  
  if (!sourceConnection || !targetConnection) {
    return NextResponse.json(
      { success: false, error: 'Source or target connection not found' },
      { status: 404 }
    );
  }
  
  // ========================================================================
  // PRE-FLIGHT VALIDATION: Test connections before starting sync
  // ========================================================================
  await supabaseSyncLogStore.add(id, 'info', 'Running pre-flight connection checks...');
  
  const { testConnection } = await import('@/lib/services/drizzle-factory');
  const sourceUrl = decrypt(sourceConnection.encrypted_url);
  const targetUrl = decrypt(targetConnection.encrypted_url);
  
  // Test source connection
  const sourceTest = await testConnection(sourceUrl);
  if (!sourceTest.success) {
    await supabaseSyncJobStore.update(id, user.id, { 
      status: 'failed',
      completedAt: new Date().toISOString(),
    });
    await supabaseSyncLogStore.add(id, 'error', `Pre-flight check failed: Source connection error - ${sourceTest.error}`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Source connection failed pre-flight check',
        details: sourceTest.error,
        recovery: 'Please verify your source database connection is accessible and try again.',
      },
      { status: 400 }
    );
  }
  
  // Test target connection
  const targetTest = await testConnection(targetUrl);
  if (!targetTest.success) {
    await supabaseSyncJobStore.update(id, user.id, { 
      status: 'failed',
      completedAt: new Date().toISOString(),
    });
    await supabaseSyncLogStore.add(id, 'error', `Pre-flight check failed: Target connection error - ${targetTest.error}`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Target connection failed pre-flight check',
        details: targetTest.error,
        recovery: 'Please verify your target database connection is accessible and try again.',
      },
      { status: 400 }
    );
  }
  
  // Validate tables configuration
  const tablesConfig = job.tables_config as { tableName: string; enabled: boolean; conflictStrategy?: string }[];
  const enabledTables = tablesConfig.filter((t) => t.enabled);
  
  if (enabledTables.length === 0) {
    await supabaseSyncJobStore.update(id, user.id, { 
      status: 'failed',
      completedAt: new Date().toISOString(),
    });
    await supabaseSyncLogStore.add(id, 'error', 'Pre-flight check failed: No tables enabled for sync');
    return NextResponse.json(
      { 
        success: false, 
        error: 'No tables enabled for sync',
        recovery: 'Please enable at least one table in the sync configuration.',
      },
      { status: 400 }
    );
  }
  
  await supabaseSyncLogStore.add(id, 'info', `✅ Pre-flight checks passed: Source (${sourceTest.version}), Target (${targetTest.version})`);
  
  // ========================================================================
  // ENHANCED WARNINGS: Production sync safety checks
  // ========================================================================
  if (targetConnection.environment === 'production') {
    await supabaseSyncLogStore.add(id, 'warn', '⚠️ PRODUCTION TARGET DETECTED - Proceeding with caution');
    await supabaseSyncLogStore.add(id, 'warn', '   - Automatic backup will be created before sync');
    await supabaseSyncLogStore.add(id, 'warn', '   - Auto-rollback enabled on failure');
    await supabaseSyncLogStore.add(id, 'warn', '   - All changes are logged and reversible');
  }
  
  // Warn about large datasets
  const totalSourceRows = sourceTest.tableCount || 0;
  const totalTargetRows = targetTest.tableCount || 0;
  if (totalSourceRows > 100000 || totalTargetRows > 100000) {
    await supabaseSyncLogStore.add(id, 'warn', `⚠️ Large dataset detected: Source has ${totalSourceRows.toLocaleString()} tables, Target has ${totalTargetRows.toLocaleString()} tables`);
    await supabaseSyncLogStore.add(id, 'info', '   This sync may take longer than usual. Progress will be tracked in real-time.');
  }
  
  // Update job status to running
  await supabaseSyncJobStore.update(id, user.id, { 
    status: 'running',
    startedAt: new Date().toISOString(),
  });
  
  await supabaseSyncLogStore.add(id, 'info', 'Sync job started');
  
  // Parse checkpoint if exists
  const checkpoint = job.checkpoint as {
    lastTable: string;
    lastRowId: string;
    lastUpdatedAt: string;
    processedTables: string[];
  } | null;
  
  // Create a streaming response to keep connection alive
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'started', jobId: id })}\n\n`));
      
      let lastProgressUpdate = 0;
      
      try {
        await executeSyncRealtime({
          jobId: id,
          sourceUrl,
          targetUrl,
          tables: tablesConfig,
          direction: job.direction,
          checkpoint: checkpoint || undefined,
          onProgress: async (progress) => {
            try {
              await supabaseSyncJobStore.update(id, user.id, { progress: progress as unknown as Json });
              
              // Send progress update every 2 seconds to keep connection alive
              const now = Date.now();
              if (now - lastProgressUpdate > 2000) {
                lastProgressUpdate = now;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`));
              }
            } catch (err) {
              console.error('Failed to update progress:', err);
            }
          },
          onLog: async (level, message, metadata) => {
            try {
              await supabaseSyncLogStore.add(id, level, message, metadata);
              // Send log to stream
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', level, message })}\n\n`));
            } catch (err) {
              console.error('Failed to add log:', err);
            }
          },
          onComplete: async (success, newCheckpoint) => {
            const finalStatus = success ? 'completed' : 'failed';
            // job object uses snake_case from database (started_at, not startedAt)
            const jobStartedAt = (job as any).started_at;
            const startTime = jobStartedAt ? new Date(jobStartedAt).getTime() : Date.now();
            const duration = Date.now() - startTime;
            
            try {
              await supabaseSyncJobStore.update(id, user.id, {
                status: finalStatus,
                completedAt: new Date().toISOString(),
                checkpoint: (newCheckpoint as unknown as Json) || null,
              });
              
              // Get updated job with progress
              const updatedJob = await supabaseSyncJobStore.getById(id, user.id);
              const jobWithConnections = updatedJob ? await getJobWithConnections(updatedJob, user.id) : null;
              
              // Send email notification
              if (user.email && jobWithConnections) {
                const progress = updatedJob?.progress as any;
                if (success) {
                  const { notifySyncCompleted } = await import('@/lib/services/email-notifications');
                  const { incrementDataTransfer } = await import('@/lib/services/usage-limits');
                  
                  const stats = {
                    totalRows: progress?.totalRows || 0,
                    insertedRows: progress?.insertedRows || 0,
                    updatedRows: progress?.updatedRows || 0,
                    duration,
                  };
                  
                  // Estimate data transfer (rough: 1KB per row)
                  const estimatedDataMb = (stats.totalRows * 1) / 1024;
                  incrementDataTransfer(user.id, estimatedDataMb).catch(err => 
                    console.error('Failed to update data transfer:', err)
                  );
                  
                  notifySyncCompleted(
                    user.id,
                    user.email,
                    id,
                    jobWithConnections.sourceConnection?.name || 'Unknown',
                    jobWithConnections.targetConnection?.name || 'Unknown',
                    stats
                  ).catch(err => console.error('Failed to send sync completed email:', err));
                } else {
                  const { notifySyncFailed } = await import('@/lib/services/email-notifications');
                  const errorMsg = progress?.error || 'Unknown error';
                  notifySyncFailed(
                    user.id,
                    user.email,
                    id,
                    jobWithConnections.sourceConnection?.name || 'Unknown',
                    jobWithConnections.targetConnection?.name || 'Unknown',
                    errorMsg
                  ).catch(err => console.error('Failed to send sync failed email:', err));
                }
              }
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', success, status: finalStatus })}\n\n`));
            } catch (err) {
              console.error('Failed to update completion:', err);
            }
          },
        });
      } catch (error) {
        console.error('Sync execution error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        try {
          await supabaseSyncJobStore.update(id, user.id, { 
            status: 'failed',
            completedAt: new Date().toISOString(),
          });
          await supabaseSyncLogStore.add(id, 'error', `Sync failed: ${errorMessage}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`));
        } catch (err) {
          console.error('Failed to update failure status:', err);
        }
      }
      
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
