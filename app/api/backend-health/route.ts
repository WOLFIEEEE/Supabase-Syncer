/**
 * Backend Health Check Proxy
 * 
 * Proxies backend health check requests to avoid CORS issues
 * This route runs server-side, so no CORS restrictions apply
 */

import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/utils/backend-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    // Direct fetch from server-side (no CORS)
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    const latency = Date.now() - start;
    const data = await response.json();
    
    return NextResponse.json({
      healthy: response.ok && data.status === 'healthy',
      status: data.status || 'unknown',
      latency,
      backend: {
        url: backendUrl,
        version: data.version,
      },
    });
  } catch (error) {
    const latency = Date.now() - start;
    
    return NextResponse.json({
      healthy: false,
      status: 'unreachable',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}
