'use client';

/**
 * Sync Metrics Dashboard Component
 * 
 * Real-time dashboard for monitoring sync performance.
 */

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TableMetrics {
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

interface SyncMetrics {
  jobId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
  status: 'running' | 'completed' | 'failed';
  tablesProcessed: number;
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errorCount: number;
  retryCount: number;
  rowsPerSecond: number;
  bytesPerSecond: number;
  avgBatchTimeMs: number;
  peakMemoryMB: number;
  connectionCount: number;
  tableMetrics: TableMetrics[];
  throttledTimeMs: number;
  avgThrottleFactor: number;
}

interface SyncMetricsDashboardProps {
  syncJobId: string;
  onClose?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

// Intentionally kept for future use
function _formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
void _formatBytes; // Prevent unused warning

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({ 
  title, 
  value, 
  subtitle,
  color = 'blue',
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs mt-1 opacity-60">{subtitle}</div>}
    </div>
  );
}

function ProgressBar({ 
  progress, 
  label,
  color = 'blue',
}: { 
  progress: number; 
  label: string;
  color?: 'blue' | 'green' | 'yellow';
}) {
  const bgColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{progress.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${bgColors[color]}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

function TableProgress({ 
  table, 
  isActive 
}: { 
  table: TableMetrics; 
  isActive: boolean;
}) {
  const total = table.rowsInserted + table.rowsUpdated + table.rowsSkipped;
  
  return (
    <div className={`p-3 rounded-lg border ${
      isActive ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-700 bg-gray-800/50'
    }`}>
      <div className="flex justify-between items-center">
        <div className="font-medium text-white flex items-center gap-2">
          {isActive && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
          {table.tableName}
        </div>
        <div className="text-sm text-gray-400">
          {formatNumber(total)} rows
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
        <div className="text-green-400">
          +{table.rowsInserted} inserted
        </div>
        <div className="text-blue-400">
          ~{table.rowsUpdated} updated
        </div>
        <div className="text-gray-400">
          {table.rowsSkipped} skipped
        </div>
      </div>
      
      {table.durationMs && (
        <div className="text-xs text-gray-500 mt-1">
          {formatDuration(table.durationMs)} • {table.rowsPerSecond.toFixed(0)} rows/s
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'running' | 'completed' | 'failed' }) {
  const styles = {
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const icons = {
    running: (
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
    completed: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${styles[status]}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SyncMetricsDashboard({ 
  syncJobId, 
  onClose 
}: SyncMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isActive = true;
    
    const connect = () => {
      if (!isActive) return;
      
      eventSource = new EventSource(`/api/sync/${syncJobId}/metrics`);
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
          } else {
            setMetrics(data);
          }
        } catch {
          setError('Failed to parse metrics');
        }
      };
      
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        
        // Try to reconnect after 3 seconds
        if (isActive) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
    };
    
    connect();
    
    return () => {
      isActive = false;
      eventSource?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [syncJobId]);

  if (error && !metrics) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="text-center text-red-400">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Connecting to metrics stream...</span>
        </div>
      </div>
    );
  }

  const totalTables = metrics.tableMetrics.length;
  const tableProgress = totalTables > 0 
    ? (metrics.tablesProcessed / totalTables) * 100 
    : 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Sync Metrics</h3>
          <StatusBadge status={metrics.status} />
          {!isConnected && (
            <span className="text-xs text-yellow-400">Reconnecting...</span>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard 
            title="Total Rows" 
            value={formatNumber(metrics.totalRows)}
            subtitle={`${formatNumber(metrics.rowsPerSecond)} rows/sec`}
            color="blue"
          />
          <MetricCard 
            title="Inserted" 
            value={formatNumber(metrics.insertedRows)}
            color="green"
          />
          <MetricCard 
            title="Updated" 
            value={formatNumber(metrics.updatedRows)}
            color="yellow"
          />
          <MetricCard 
            title="Errors" 
            value={metrics.errorCount}
            subtitle={metrics.retryCount > 0 ? `${metrics.retryCount} retries` : undefined}
            color={metrics.errorCount > 0 ? 'red' : 'blue'}
          />
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <ProgressBar 
            progress={tableProgress} 
            label={`Tables: ${metrics.tablesProcessed}/${totalTables}`}
            color="blue"
          />
          
          {metrics.avgThrottleFactor < 1 && (
            <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Rate limiting active ({(metrics.avgThrottleFactor * 100).toFixed(0)}% speed)</span>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Duration</div>
            <div className="text-white font-medium">{formatDuration(metrics.durationMs)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Avg Batch Time</div>
            <div className="text-white font-medium">{formatDuration(metrics.avgBatchTimeMs)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Peak Memory</div>
            <div className="text-white font-medium">{metrics.peakMemoryMB.toFixed(1)} MB</div>
          </div>
        </div>

        {/* Table Breakdown */}
        {metrics.tableMetrics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Table Progress</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {metrics.tableMetrics.map((table) => (
                <TableProgress 
                  key={table.tableName} 
                  table={table}
                  isActive={!table.endTime}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

