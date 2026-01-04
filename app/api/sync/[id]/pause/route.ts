import { NextRequest, NextResponse } from 'next/server';
import { supabaseSyncJobStore, supabaseSyncLogStore } from '@/lib/db/supabase-store';
import { markSyncCancelled } from '@/lib/services/sync-realtime';
import { getUser } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Pause a running sync job
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
    
    // Check if job can be paused
    if (job.status !== 'running') {
      return NextResponse.json(
        { success: false, error: `Cannot pause job with status "${job.status}"` },
        { status: 400 }
      );
    }
    
    // Mark job for cancellation
    markSyncCancelled(id);
    
    await supabaseSyncLogStore.add(id, 'warn', 'Pause requested - job will pause after current batch');
    
    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        message: 'Pause requested. Job will pause after current batch.',
      },
    });
    
  } catch (error) {
    console.error('Error pausing sync job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to pause sync job' },
      { status: 500 }
    );
  }
}
