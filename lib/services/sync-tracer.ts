/**
 * Sync Tracer Service
 * 
 * Provides distributed tracing for sync operations.
 * Enables detailed debugging and performance analysis.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'running' | 'completed' | 'error';
  tags: Record<string, string | number | boolean>;
  logs: TraceLog[];
  errorMessage?: string;
}

export interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// SYNC TRACER CLASS
// ============================================================================

export class SyncTracer {
  private traceId: string;
  private syncJobId: string;
  private userId: string;
  private spans: Map<string, TraceSpan> = new Map();
  private rootSpanId: string | null = null;
  private onSpanEnd?: (span: TraceSpan) => void;
  
  constructor(syncJobId: string, userId: string) {
    this.traceId = generateId();
    this.syncJobId = syncJobId;
    this.userId = userId;
  }
  
  /**
   * Get trace ID
   */
  getTraceId(): string {
    return this.traceId;
  }
  
  /**
   * Set span end callback
   */
  setSpanEndCallback(callback: (span: TraceSpan) => void): void {
    this.onSpanEnd = callback;
  }
  
  /**
   * Start a new span
   */
  startSpan(operationName: string, parentSpanId?: string): TraceSpan {
    const spanId = generateId();
    
    const span: TraceSpan = {
      spanId,
      traceId: this.traceId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      status: 'running',
      tags: {},
      logs: [],
    };
    
    this.spans.set(spanId, span);
    
    // Set root span if this is the first
    if (!this.rootSpanId) {
      this.rootSpanId = spanId;
    }
    
    return span;
  }
  
  /**
   * Get span by ID
   */
  getSpan(spanId: string): TraceSpan | null {
    return this.spans.get(spanId) || null;
  }
  
  /**
   * Add tag to span
   */
  setTag(spanId: string, key: string, value: string | number | boolean): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }
  
  /**
   * Add multiple tags to span
   */
  setTags(spanId: string, tags: Record<string, string | number | boolean>): void {
    const span = this.spans.get(spanId);
    if (span) {
      Object.assign(span.tags, tags);
    }
  }
  
  /**
   * Add log to span
   */
  addLog(
    spanId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        level,
        message,
        metadata,
      });
    }
  }
  
  /**
   * End a span
   */
  endSpan(spanId: string, status: 'completed' | 'error' = 'completed', errorMessage?: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.durationMs = span.endTime - span.startTime;
      span.status = status;
      span.errorMessage = errorMessage;
      
      this.onSpanEnd?.(span);
      
      // Save to database
      this.saveSpan(span);
    }
  }
  
  /**
   * Get trace context for propagation
   */
  getContext(spanId: string): TraceContext {
    return {
      traceId: this.traceId,
      spanId,
    };
  }
  
  /**
   * Start child span from context
   */
  startChildSpan(context: TraceContext, operationName: string): TraceSpan {
    return this.startSpan(operationName, context.spanId);
  }
  
  /**
   * Get all spans for the trace
   */
  getTrace(): TraceSpan[] {
    return Array.from(this.spans.values());
  }
  
  /**
   * Get span tree (hierarchical structure)
   */
  getSpanTree(): TraceSpan & { children: TraceSpan[] } | null {
    if (!this.rootSpanId) {
      return null;
    }
    
    const rootSpan = this.spans.get(this.rootSpanId);
    if (!rootSpan) {
      return null;
    }
    
    const buildTree = (span: TraceSpan): TraceSpan & { children: TraceSpan[] } => {
      const children = Array.from(this.spans.values())
        .filter((s) => s.parentSpanId === span.spanId)
        .map(buildTree);
      
      return { ...span, children };
    };
    
    return buildTree(rootSpan);
  }
  
  /**
   * Get critical path (longest execution path)
   */
  getCriticalPath(): TraceSpan[] {
    const tree = this.getSpanTree();
    if (!tree) {
      return [];
    }
    
    const findLongestPath = (
      span: TraceSpan & { children?: TraceSpan[] }
    ): TraceSpan[] => {
      if (!span.children || span.children.length === 0) {
        return [span];
      }
      
      const childPaths = span.children.map((child) => 
        findLongestPath(child as TraceSpan & { children?: TraceSpan[] })
      );
      
      const longestChildPath = childPaths.reduce((a, b) => {
        const aTime = a.reduce((sum, s) => sum + (s.durationMs || 0), 0);
        const bTime = b.reduce((sum, s) => sum + (s.durationMs || 0), 0);
        return aTime > bTime ? a : b;
      });
      
      return [span, ...longestChildPath];
    };
    
    return findLongestPath(tree);
  }
  
  /**
   * Get slow operations (operations exceeding threshold)
   */
  getSlowOperations(thresholdMs: number): TraceSpan[] {
    return Array.from(this.spans.values())
      .filter((span) => span.durationMs && span.durationMs > thresholdMs)
      .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0));
  }
  
  /**
   * Get error spans
   */
  getErrorSpans(): TraceSpan[] {
    return Array.from(this.spans.values())
      .filter((span) => span.status === 'error');
  }
  
  /**
   * Complete the trace
   */
  completeTrace(): void {
    // End all running spans
    for (const span of this.spans.values()) {
      if (span.status === 'running') {
        this.endSpan(span.spanId, 'completed');
      }
    }
  }
  
  /**
   * Save span to database
   */
  private async saveSpan(span: TraceSpan): Promise<void> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('sync_traces').insert({
        trace_id: span.traceId,
        span_id: span.spanId,
        parent_span_id: span.parentSpanId,
        sync_job_id: this.syncJobId,
        user_id: this.userId,
        operation_name: span.operationName,
        start_time: new Date(span.startTime).toISOString(),
        end_time: span.endTime ? new Date(span.endTime).toISOString() : null,
        duration_ms: span.durationMs,
        tags: span.tags,
        logs: span.logs,
        status: span.status,
        error_message: span.errorMessage,
      });
    } catch (error) {
      console.warn('Failed to save trace span to database:', error);
    }
  }
}

// ============================================================================
// TRACER STORE
// ============================================================================

// In-memory store for active tracers
const activeTracers = new Map<string, SyncTracer>();

/**
 * Create a tracer for a sync job
 */
export function createTracer(syncJobId: string, userId: string): SyncTracer {
  const tracer = new SyncTracer(syncJobId, userId);
  activeTracers.set(syncJobId, tracer);
  return tracer;
}

/**
 * Get tracer for a sync job
 */
export function getTracer(syncJobId: string): SyncTracer | null {
  return activeTracers.get(syncJobId) || null;
}

/**
 * Remove tracer for a sync job
 */
export function removeTracer(syncJobId: string): void {
  activeTracers.delete(syncJobId);
}

// ============================================================================
// TRACE RETRIEVAL
// ============================================================================

/**
 * Get trace from database
 */
export async function getTrace(traceId: string): Promise<TraceSpan[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return [];
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('sync_traces')
      .select('*')
      .eq('trace_id', traceId)
      .order('start_time', { ascending: true });
    
    if (error || !data) {
      return [];
    }
    
    return data.map((row) => ({
      spanId: row.span_id,
      traceId: row.trace_id,
      parentSpanId: row.parent_span_id,
      operationName: row.operation_name,
      startTime: new Date(row.start_time).getTime(),
      endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
      durationMs: row.duration_ms,
      status: row.status,
      tags: row.tags || {},
      logs: row.logs || [],
      errorMessage: row.error_message,
    }));
  } catch (error) {
    console.warn('Failed to get trace from database:', error);
    return [];
  }
}

/**
 * Get traces for a sync job
 */
export async function getTracesForJob(syncJobId: string): Promise<string[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return [];
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('sync_traces')
      .select('trace_id')
      .eq('sync_job_id', syncJobId)
      .order('created_at', { ascending: false });
    
    if (error || !data) {
      return [];
    }
    
    // Get unique trace IDs
    return [...new Set(data.map((row) => row.trace_id))];
  } catch (error) {
    console.warn('Failed to get traces for job:', error);
    return [];
  }
}

