import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore, supabaseSyncJobStore, supabaseSyncLogStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { executeSyncRealtime } from '@/lib/services/sync-realtime';
import { getUser } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Start/resume a sync job (runs in real-time, not queued)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
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
    
    // Execute sync in real-time (non-blocking response)
    // We start the sync but don't wait for it to complete
    executeSyncRealtime({
      jobId: id,
      sourceUrl,
      targetUrl,
      tables: tablesConfig,
      direction: job.direction,
      checkpoint: checkpoint || undefined,
      onProgress: async (progress) => {
        await supabaseSyncJobStore.update(id, user.id, { progress: progress as unknown as Json });
      },
      onLog: async (level, message, metadata) => {
        await supabaseSyncLogStore.add(id, level, message, metadata);
      },
      onComplete: async (success, newCheckpoint) => {
        await supabaseSyncJobStore.update(id, user.id, {
          status: success ? 'completed' : 'failed',
          completedAt: new Date().toISOString(),
          checkpoint: (newCheckpoint as unknown as Json) || null,
        });
      },
    }).catch(async (error) => {
      console.error('Sync execution error:', error);
      await supabaseSyncJobStore.update(id, user.id, { 
        status: 'failed',
        completedAt: new Date().toISOString(),
      });
      await supabaseSyncLogStore.add(id, 'error', `Sync failed: ${error.message}`);
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: 'running',
        message: 'Sync job started. Check /api/sync/{id} for progress.',
      },
    });
    
  } catch (error) {
    console.error('Error starting sync job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start sync job' },
      { status: 500 }
    );
  }
}
