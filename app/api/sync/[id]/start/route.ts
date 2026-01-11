/**
 * POST /api/sync/[id]/start
 * 
 * Start/resume a sync job.
 * Proxies to backend, then returns SSE stream URL for progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore, supabaseSyncJobStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyPOST, createProxyStream } from '@/lib/utils/proxy-handler';
import { testConnection } from '@/lib/services/drizzle-factory';
import { decrypt } from '@/lib/services/encryption';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Allow longer execution time for sync operations
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// POST - Start/resume a sync job
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
  
  // Pre-flight connection checks (lightweight, can stay in frontend)
  try {
    const sourceUrl = decrypt(sourceConnection.encrypted_url);
    const targetUrl = decrypt(targetConnection.encrypted_url);
    
    const [sourceTest, targetTest] = await Promise.all([
      testConnection(sourceUrl),
      testConnection(targetUrl),
    ]);
    
    if (!sourceTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Source connection failed pre-flight check',
          details: sourceTest.error,
        },
        { status: 400 }
      );
    }
    
    if (!targetTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Target connection failed pre-flight check',
          details: targetTest.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Pre-flight check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
  
  // Forward to backend to start the job
  const proxyHandler = createProxyPOST((req) => `/api/sync/${id}/start`);
  
  const modifiedRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      sourceEncryptedUrl: sourceConnection.encrypted_url,
      targetEncryptedUrl: targetConnection.encrypted_url,
    }),
  });
  
  return proxyHandler(modifiedRequest);
}
