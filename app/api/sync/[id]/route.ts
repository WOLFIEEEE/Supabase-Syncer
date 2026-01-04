import { NextRequest, NextResponse } from 'next/server';
import { syncJobStore, syncLogStore, getJobWithConnections } from '@/lib/db/memory-store';
import { getUser } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get sync job details with logs
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeLogs = searchParams.get('logs') !== 'false';
    const logLimit = parseInt(searchParams.get('logLimit') || '100', 10);
    
    // Get job details (scoped to user)
    const job = syncJobStore.getById(id, user.id);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Sync job not found' },
        { status: 404 }
      );
    }
    
    const jobWithConnections = getJobWithConnections(job, user.id);
    
    // Get logs if requested
    let logs: ReturnType<typeof syncLogStore.getByJobId> = [];
    if (includeLogs) {
      logs = syncLogStore.getByJobId(id, logLimit);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...jobWithConnections,
        logs,
      },
    });
    
  } catch (error) {
    console.error('Error fetching sync job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync job' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending/paused sync job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const job = syncJobStore.getById(id, user.id);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Sync job not found' },
        { status: 404 }
      );
    }
    
    if (!['pending', 'paused', 'failed', 'completed'].includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only delete pending, paused, failed, or completed jobs' },
        { status: 400 }
      );
    }
    
    // Delete job and logs
    syncJobStore.delete(id, user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Sync job deleted',
    });
    
  } catch (error) {
    console.error('Error deleting sync job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sync job' },
      { status: 500 }
    );
  }
}
