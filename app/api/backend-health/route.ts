/**
 * Backend Health Check Proxy
 * 
 * Server-side proxy to check backend health status
 * This avoids CORS issues when checking from the browser
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return NextResponse.json({
        healthy: false,
        status: 'degraded',
        latency,
        error: `HTTP ${response.status}`,
      }, { status: 200 }); // Return 200 so frontend can handle the status
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      healthy: data.status === 'healthy' || data.status === 'running',
      status: data.status === 'healthy' || data.status === 'running' ? 'online' : 'degraded',
      latency,
      version: data.version,
      name: data.name,
    });
    
  } catch (error) {
    const latency = Date.now() - start;
    
    return NextResponse.json({
      healthy: false,
      status: 'offline',
      latency,
      error: error instanceof Error ? error.message : 'Connection failed',
    }, { status: 200 }); // Return 200 so frontend can handle the status
  }
}
