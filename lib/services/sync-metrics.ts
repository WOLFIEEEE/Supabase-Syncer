/**
 * Sync Metrics Service
 * 
 * Collects and stores metrics for sync operations.
 * Provides real-time and historical performance data.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface TableMetrics {
  tableName: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  rowsProcessed: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
  errors: number;
  avgBatchTimeMs: number;
  rowsPerSecond: number;
  bytesProcessed: number;
}

export interface SyncMetrics {
  jobId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
  status: 'running' | 'completed' | 'failed';
  
  // Overall stats
  tablesProcessed: number;
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errorCount: number;
  retryCount: number;
  
  // Performance metrics
  rowsPerSecond: number;
  bytesPerSecond: number;
  avgBatchTimeMs: number;
  peakMemoryMB: number;
  connectionCount: number;
  
  // Table-level breakdown
  tableMetrics: TableMetrics[];
  
  // Rate limiting stats
  throttledTimeMs: number;
  avgThrottleFactor: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  metrics: Partial<SyncMetrics>;
}

// ============================================================================
// METRICS COLLECTOR CLASS
// ============================================================================

export class MetricsCollector {
  private jobId: string;
  private userId: string;
  private metrics: SyncMetrics;
  private snapshots: MetricsSnapshot[] = [];
  private tableStartTimes: Map<string, number> = new Map();
  private batchTimes: number[] = [];
  private onUpdate?: (metrics: SyncMetrics) => void;
  
  constructor(jobId: string, userId: string) {
    this.jobId = jobId;
    this.userId = userId;
    this.metrics = this.initializeMetrics();
  }
  
  /**
   * Initialize metrics with default values
   */
  private initializeMetrics(): SyncMetrics {
    return {
      jobId: this.jobId,
      userId: this.userId,
      startTime: Date.now(),
      durationMs: 0,
      status: 'running',
      tablesProcessed: 0,
      totalRows: 0,
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: 0,
      errorCount: 0,
      retryCount: 0,
      rowsPerSecond: 0,
      bytesPerSecond: 0,
      avgBatchTimeMs: 0,
      peakMemoryMB: 0,
      connectionCount: 0,
      tableMetrics: [],
      throttledTimeMs: 0,
      avgThrottleFactor: 1.0,
    };
  }
  
  /**
   * Set update callback
   */
  setUpdateCallback(callback: (metrics: SyncMetrics) => void): void {
    this.onUpdate = callback;
  }
  
  /**
   * Start collection
   */
  startCollection(): void {
    this.metrics.startTime = Date.now();
    this.metrics.status = 'running';
    this.takeSnapshot();
  }
  
  /**
   * Start tracking a table
   */
  startTable(tableName: string): void {
    this.tableStartTimes.set(tableName, Date.now());
    
    // Add or update table metrics
    let tableMetrics = this.metrics.tableMetrics.find((t) => t.tableName === tableName);
    
    if (!tableMetrics) {
      tableMetrics = {
        tableName,
        startTime: Date.now(),
        rowsProcessed: 0,
        rowsInserted: 0,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: 0,
        avgBatchTimeMs: 0,
        rowsPerSecond: 0,
        bytesProcessed: 0,
      };
      this.metrics.tableMetrics.push(tableMetrics);
    } else {
      tableMetrics.startTime = Date.now();
    }
    
    this.notifyUpdate();
  }
  
  /**
   * Record batch completion
   */
  recordBatch(
    tableName: string,
    rowCount: number,
    durationMs: number,
    inserted: number = 0,
    updated: number = 0,
    skipped: number = 0,
    errors: number = 0,
    bytesProcessed: number = 0
  ): void {
    this.batchTimes.push(durationMs);
    
    // Update overall metrics
    this.metrics.totalRows += rowCount;
    this.metrics.insertedRows += inserted;
    this.metrics.updatedRows += updated;
    this.metrics.skippedRows += skipped;
    this.metrics.errorCount += errors;
    
    // Update table metrics
    const tableMetrics = this.metrics.tableMetrics.find((t) => t.tableName === tableName);
    
    if (tableMetrics) {
      tableMetrics.rowsProcessed += rowCount;
      tableMetrics.rowsInserted += inserted;
      tableMetrics.rowsUpdated += updated;
      tableMetrics.rowsSkipped += skipped;
      tableMetrics.errors += errors;
      tableMetrics.bytesProcessed += bytesProcessed;
      
      // Calculate running averages
      const elapsed = Date.now() - tableMetrics.startTime;
      if (elapsed > 0) {
        tableMetrics.rowsPerSecond = (tableMetrics.rowsProcessed / elapsed) * 1000;
      }
    }
    
    // Update overall performance metrics
    this.updatePerformanceMetrics();
    this.notifyUpdate();
  }
  
  /**
   * Complete table tracking
   */
  completeTable(tableName: string): void {
    const startTime = this.tableStartTimes.get(tableName);
    const tableMetrics = this.metrics.tableMetrics.find((t) => t.tableName === tableName);
    
    if (tableMetrics && startTime) {
      tableMetrics.endTime = Date.now();
      tableMetrics.durationMs = tableMetrics.endTime - startTime;
      
      if (tableMetrics.durationMs > 0) {
        tableMetrics.rowsPerSecond = (tableMetrics.rowsProcessed / tableMetrics.durationMs) * 1000;
      }
    }
    
    this.metrics.tablesProcessed++;
    this.tableStartTimes.delete(tableName);
    this.notifyUpdate();
  }
  
  /**
   * Record error
   */
  recordError(tableName?: string): void {
    this.metrics.errorCount++;
    
    if (tableName) {
      const tableMetrics = this.metrics.tableMetrics.find((t) => t.tableName === tableName);
      if (tableMetrics) {
        tableMetrics.errors++;
      }
    }
    
    this.notifyUpdate();
  }
  
  /**
   * Record retry
   */
  recordRetry(): void {
    this.metrics.retryCount++;
    this.notifyUpdate();
  }
  
  /**
   * Record throttling
   */
  recordThrottling(throttledMs: number, throttleFactor: number): void {
    this.metrics.throttledTimeMs += throttledMs;
    
    // Running average of throttle factor
    this.metrics.avgThrottleFactor = 
      (this.metrics.avgThrottleFactor + throttleFactor) / 2;
    
    this.notifyUpdate();
  }
  
  /**
   * Update memory usage
   */
  updateMemoryUsage(memoryMB: number): void {
    this.metrics.peakMemoryMB = Math.max(this.metrics.peakMemoryMB, memoryMB);
    this.notifyUpdate();
  }
  
  /**
   * Update connection count
   */
  updateConnectionCount(count: number): void {
    this.metrics.connectionCount = count;
    this.notifyUpdate();
  }
  
  /**
   * Complete collection
   */
  completeCollection(status: 'completed' | 'failed'): void {
    this.metrics.endTime = Date.now();
    this.metrics.durationMs = this.metrics.endTime - this.metrics.startTime;
    this.metrics.status = status;
    
    this.updatePerformanceMetrics();
    this.takeSnapshot();
    this.notifyUpdate();
    
    // Save to database
    this.saveMetrics();
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): SyncMetrics {
    // Update duration
    if (!this.metrics.endTime) {
      this.metrics.durationMs = Date.now() - this.metrics.startTime;
    }
    
    return { ...this.metrics };
  }
  
  /**
   * Get metrics snapshots
   */
  getSnapshots(): MetricsSnapshot[] {
    return [...this.snapshots];
  }
  
  /**
   * Take a snapshot of current metrics
   */
  takeSnapshot(): void {
    this.snapshots.push({
      timestamp: Date.now(),
      metrics: {
        durationMs: this.metrics.durationMs,
        totalRows: this.metrics.totalRows,
        insertedRows: this.metrics.insertedRows,
        updatedRows: this.metrics.updatedRows,
        rowsPerSecond: this.metrics.rowsPerSecond,
        errorCount: this.metrics.errorCount,
      },
    });
    
    // Keep last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }
  
  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const durationMs = Date.now() - this.metrics.startTime;
    
    if (durationMs > 0) {
      this.metrics.rowsPerSecond = (this.metrics.totalRows / durationMs) * 1000;
    }
    
    if (this.batchTimes.length > 0) {
      this.metrics.avgBatchTimeMs = 
        this.batchTimes.reduce((a, b) => a + b, 0) / this.batchTimes.length;
    }
  }
  
  /**
   * Notify update callback
   */
  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate(this.getMetrics());
    }
  }
  
  /**
   * Save metrics to database
   */
  private async saveMetrics(): Promise<void> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('sync_metrics').insert({
        sync_job_id: this.jobId,
        user_id: this.userId,
        duration_ms: this.metrics.durationMs,
        start_time: new Date(this.metrics.startTime).toISOString(),
        end_time: this.metrics.endTime ? new Date(this.metrics.endTime).toISOString() : null,
        rows_per_second: this.metrics.rowsPerSecond,
        avg_batch_time_ms: this.metrics.avgBatchTimeMs,
        tables_processed: this.metrics.tablesProcessed,
        total_rows: this.metrics.totalRows,
        inserted_rows: this.metrics.insertedRows,
        updated_rows: this.metrics.updatedRows,
        skipped_rows: this.metrics.skippedRows,
        error_count: this.metrics.errorCount,
        retry_count: this.metrics.retryCount,
        table_metrics: this.metrics.tableMetrics,
        peak_memory_mb: this.metrics.peakMemoryMB,
        connection_count: this.metrics.connectionCount,
        status: this.metrics.status,
      });
    } catch (error) {
      console.warn('Failed to save metrics to database:', error);
    }
  }
}

// ============================================================================
// METRICS STORE
// ============================================================================

// In-memory store for active metrics collectors
const activeCollectors = new Map<string, MetricsCollector>();

/**
 * Create a metrics collector for a sync job
 */
export function createMetricsCollector(jobId: string, userId: string): MetricsCollector {
  const collector = new MetricsCollector(jobId, userId);
  activeCollectors.set(jobId, collector);
  return collector;
}

/**
 * Get metrics collector for a sync job
 */
export function getMetricsCollector(jobId: string): MetricsCollector | null {
  return activeCollectors.get(jobId) || null;
}

/**
 * Remove metrics collector for a sync job
 */
export function removeMetricsCollector(jobId: string): void {
  activeCollectors.delete(jobId);
}

/**
 * Get all active metrics collectors
 */
export function getActiveCollectors(): Map<string, MetricsCollector> {
  return activeCollectors;
}

// ============================================================================
// HISTORICAL METRICS
// ============================================================================

/**
 * Get historical metrics for a user
 */
export async function getHistoricalMetrics(
  userId: string,
  days: number = 30
): Promise<SyncMetrics[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return [];
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('sync_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error || !data) {
      return [];
    }
    
    return data.map((row) => ({
      jobId: row.sync_job_id,
      userId: row.user_id,
      startTime: new Date(row.start_time).getTime(),
      endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
      durationMs: row.duration_ms,
      status: row.status,
      tablesProcessed: row.tables_processed,
      totalRows: row.total_rows,
      insertedRows: row.inserted_rows,
      updatedRows: row.updated_rows,
      skippedRows: row.skipped_rows,
      errorCount: row.error_count,
      retryCount: row.retry_count,
      rowsPerSecond: row.rows_per_second,
      bytesPerSecond: 0,
      avgBatchTimeMs: row.avg_batch_time_ms,
      peakMemoryMB: row.peak_memory_mb,
      connectionCount: row.connection_count,
      tableMetrics: row.table_metrics || [],
      throttledTimeMs: 0,
      avgThrottleFactor: 1.0,
    }));
  } catch (error) {
    console.warn('Failed to get historical metrics:', error);
    return [];
  }
}

/**
 * Get metrics summary for a user
 */
export async function getMetricsSummary(
  userId: string,
  days: number = 30
): Promise<{
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalRowsSynced: number;
  avgDurationMs: number;
  avgRowsPerSecond: number;
}> {
  const metrics = await getHistoricalMetrics(userId, days);
  
  if (metrics.length === 0) {
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalRowsSynced: 0,
      avgDurationMs: 0,
      avgRowsPerSecond: 0,
    };
  }
  
  const successful = metrics.filter((m) => m.status === 'completed');
  const failed = metrics.filter((m) => m.status === 'failed');
  
  return {
    totalSyncs: metrics.length,
    successfulSyncs: successful.length,
    failedSyncs: failed.length,
    totalRowsSynced: metrics.reduce((sum, m) => sum + m.totalRows, 0),
    avgDurationMs: metrics.reduce((sum, m) => sum + m.durationMs, 0) / metrics.length,
    avgRowsPerSecond: metrics.reduce((sum, m) => sum + m.rowsPerSecond, 0) / metrics.length,
  };
}

