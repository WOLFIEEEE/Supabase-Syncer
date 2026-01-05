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
  
  // Update job status to running
  await supabaseSyncJobStore.update(id, user.id, { 
    status: 'running',
    startedAt: new Date().toISOString(),
  });
  
  await supabaseSyncLogStore.add(id, 'info', 'Sync job started');
  
  // Decrypt database URLs
  const sourceUrl = decrypt(sourceConnection.encrypted_url);
  const targetUrl = decrypt(targetConnection.encrypted_url);
  
  // Parse tables config
  const tablesConfig = job.tables_config as { tableName: string; enabled: boolean; conflictStrategy?: string }[];
  
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
            const startTime = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
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
