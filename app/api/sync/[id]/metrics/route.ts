/**
 * Real-time Metrics API Endpoint
 * 
 * Provides Server-Sent Events (SSE) for real-time sync metrics streaming.
 */

import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getMetricsCollector, getHistoricalMetrics } from '@/lib/services/sync-metrics';
import { getTracer, getTrace } from '@/lib/services/sync-tracer';

// ============================================================================
// SSE STREAM - GET /api/sync/[id]/metrics (EventStream)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: syncJobId } = await params;
  
  // Check for SSE request
  const accept = request.headers.get('accept');
  const isSSE = accept?.includes('text/event-stream');
  
  if (isSSE) {
    return handleSSERequest(syncJobId);
  }
  
  // Return current metrics as JSON
  return handleJSONRequest(syncJobId);
}

/**
 * Handle SSE streaming request
 */
async function handleSSERequest(syncJobId: string) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      let isActive = true;
      const intervalId: { current: NodeJS.Timeout | undefined } = { current: undefined };
      
      // Send initial data
      const sendMetrics = () => {
        if (!isActive) return;
        
        const collector = getMetricsCollector(syncJobId);
        
        if (collector) {
          const metrics = collector.getMetrics();
          const data = `data: ${JSON.stringify(metrics)}\n\n`;
          controller.enqueue(encoder.encode(data));
          
          // If sync is complete, close stream
          if (metrics.status !== 'running') {
            isActive = false;
            if (intervalId.current) clearInterval(intervalId.current);
            controller.close();
          }
        } else {
          // No active collector, send empty update
          const data = `data: ${JSON.stringify({ error: 'No active sync' })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      };
      
      // Send initial metrics
      sendMetrics();
      
      // Set up interval for updates
      intervalId.current = setInterval(sendMetrics, 1000);
      
      // Clean up on close
      return () => {
        isActive = false;
        if (intervalId.current) clearInterval(intervalId.current);
      };
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

/**
 * Handle JSON request
 */
async function handleJSONRequest(syncJobId: string) {
  // Try to get active collector
  const collector = getMetricsCollector(syncJobId);
  
  if (collector) {
    return Response.json({
      success: true,
      data: {
        metrics: collector.getMetrics(),
        snapshots: collector.getSnapshots(),
      },
    });
  }
  
  // Check for authentication to get historical data
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Try to get historical metrics
  const historicalMetrics = await getHistoricalMetrics(user.id, 30);
  const jobMetrics = historicalMetrics.find((m) => m.jobId === syncJobId);
  
  if (jobMetrics) {
    return Response.json({
      success: true,
      data: {
        metrics: jobMetrics,
        historical: true,
      },
    });
  }
  
  return Response.json(
    { success: false, error: 'Metrics not found' },
    { status: 404 }
  );
}

// ============================================================================
// POST /api/sync/[id]/metrics/trace - Get trace data
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: syncJobId } = await params;
  
  try {
    const body = await request.json();
    const { traceId } = body;
    
    // Get active tracer
    const tracer = getTracer(syncJobId);
    
    if (tracer) {
      return Response.json({
        success: true,
        data: {
          traceId: tracer.getTraceId(),
          spans: tracer.getTrace(),
          criticalPath: tracer.getCriticalPath(),
          slowOperations: tracer.getSlowOperations(1000),
          errorSpans: tracer.getErrorSpans(),
        },
      });
    }
    
    // Get historical trace if traceId provided
    if (traceId) {
      const spans = await getTrace(traceId);
      
      if (spans.length > 0) {
        return Response.json({
          success: true,
          data: {
            traceId,
            spans,
            historical: true,
          },
        });
      }
    }
    
    return Response.json(
      { success: false, error: 'Trace not found' },
      { status: 404 }
    );
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

