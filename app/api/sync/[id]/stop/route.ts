import { NextRequest, NextResponse } from 'next/server';
import { supabaseSyncJobStore, supabaseSyncLogStore } from '@/lib/db/supabase-store';
import { markSyncCancelled } from '@/lib/services/sync-realtime';
import { getUser } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Force stop a running sync job
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
    
    // Check if job can be stopped
    if (!['running', 'pending'].includes(job.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot stop job with status "${job.status}"` },
        { status: 400 }
      );
    }
    
    // Mark job for cancellation (sync engine will pick this up)
    markSyncCancelled(id);
    
    // Immediately update job status to failed/stopped
    await supabaseSyncJobStore.update(id, user.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
    });
    
    await supabaseSyncLogStore.add(id, 'error', 'Sync job force stopped by user');
    
    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: 'failed',
        message: 'Sync job has been force stopped.',
      },
    });
    
  } catch (error) {
    console.error('Error stopping sync job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to stop sync job' },
      { status: 500 }
    );
  }
}



