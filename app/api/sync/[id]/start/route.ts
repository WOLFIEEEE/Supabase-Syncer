import { NextRequest, NextResponse } from 'next/server';
import { connectionStore, syncJobStore, syncLogStore } from '@/lib/db/memory-store';
import { decrypt } from '@/lib/services/encryption';
import { executeSyncRealtime } from '@/lib/services/sync-realtime';
import { getUser } from '@/lib/supabase/server';

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
    const job = syncJobStore.getById(id, user.id);
    
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
    const sourceConnection = connectionStore.getById(job.sourceConnectionId, user.id);
    const targetConnection = connectionStore.getById(job.targetConnectionId, user.id);
    
    if (!sourceConnection || !targetConnection) {
      return NextResponse.json(
        { success: false, error: 'Source or target connection not found' },
        { status: 404 }
      );
    }
    
    // Update job status to running
    syncJobStore.update(id, user.id, { 
      status: 'running',
      startedAt: new Date(),
    });
    
    syncLogStore.add(id, 'info', 'Sync job started');
    
    // Decrypt database URLs
    const sourceUrl = decrypt(sourceConnection.encryptedUrl);
    const targetUrl = decrypt(targetConnection.encryptedUrl);
    
    // Execute sync in real-time (non-blocking response)
    // We start the sync but don't wait for it to complete
    executeSyncRealtime({
      jobId: id,
      sourceUrl,
      targetUrl,
      tables: job.tablesConfig,
      direction: job.direction,
      checkpoint: job.checkpoint || undefined,
      onProgress: (progress) => {
        syncJobStore.updateInternal(id, { progress });
      },
      onLog: (level, message, metadata) => {
        syncLogStore.add(id, level, message, metadata);
      },
      onComplete: (success, checkpoint) => {
        syncJobStore.updateInternal(id, {
          status: success ? 'completed' : 'failed',
          completedAt: new Date(),
          checkpoint: checkpoint || null,
        });
      },
    }).catch((error) => {
      console.error('Sync execution error:', error);
      syncJobStore.updateInternal(id, { 
        status: 'failed',
        completedAt: new Date(),
      });
      syncLogStore.add(id, 'error', `Sync failed: ${error.message}`);
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
