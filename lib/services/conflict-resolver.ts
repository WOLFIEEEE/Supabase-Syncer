import type { Conflict, ConflictStrategy } from '@/types';

/**
 * Conflict resolution service for two-way sync
 */

export interface ConflictResolutionResult {
  resolved: boolean;
  winner: 'source' | 'target' | 'manual';
  mergedData?: Record<string, unknown>;
}

/**
 * Resolve a conflict based on the specified strategy
 */
export function resolveConflict(
  conflict: Conflict,
  strategy: ConflictStrategy
): ConflictResolutionResult {
  switch (strategy) {
    case 'last_write_wins':
      return resolveLastWriteWins(conflict);
    
    case 'source_wins':
      return {
        resolved: true,
        winner: 'source',
        mergedData: conflict.sourceData,
      };
    
    case 'target_wins':
      return {
        resolved: true,
        winner: 'target',
        mergedData: conflict.targetData,
      };
    
    case 'manual':
      return {
        resolved: false,
        winner: 'manual',
      };
    
    default:
      return {
        resolved: false,
        winner: 'manual',
      };
  }
}

/**
 * Resolve conflict using last write wins strategy
 */
function resolveLastWriteWins(conflict: Conflict): ConflictResolutionResult {
  const sourceTime = new Date(conflict.sourceUpdatedAt).getTime();
  const targetTime = new Date(conflict.targetUpdatedAt).getTime();
  
  if (sourceTime >= targetTime) {
    return {
      resolved: true,
      winner: 'source',
      mergedData: conflict.sourceData,
    };
  } else {
    return {
      resolved: true,
      winner: 'target',
      mergedData: conflict.targetData,
    };
  }
}

/**
 * Generate a diff between source and target data
 */
export function generateDiff(
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown>
): {
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
  changed: boolean;
}[] {
  const allKeys = new Set([
    ...Object.keys(sourceData),
    ...Object.keys(targetData),
  ]);
  
  const diff: {
    field: string;
    sourceValue: unknown;
    targetValue: unknown;
    changed: boolean;
  }[] = [];
  
  for (const key of allKeys) {
    const sourceValue = sourceData[key];
    const targetValue = targetData[key];
    const changed = JSON.stringify(sourceValue) !== JSON.stringify(targetValue);
    
    diff.push({
      field: key,
      sourceValue,
      targetValue,
      changed,
    });
  }
  
  return diff;
}

/**
 * Merge two records by taking the most recent value for each field
 * Based on field-level updated_at if available, otherwise uses row-level
 */
export function mergeRecords(
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown>,
  sourceUpdatedAt: Date,
  targetUpdatedAt: Date
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  
  const allKeys = new Set([
    ...Object.keys(sourceData),
    ...Object.keys(targetData),
  ]);
  
  for (const key of allKeys) {
    // Always use source for id
    if (key === 'id') {
      merged[key] = sourceData[key] ?? targetData[key];
      continue;
    }
    
    // For updated_at, use the most recent
    if (key === 'updated_at') {
      merged[key] = sourceUpdatedAt > targetUpdatedAt 
        ? sourceData[key] 
        : targetData[key];
      continue;
    }
    
    // For other fields, check which record is newer
    if (sourceUpdatedAt > targetUpdatedAt) {
      merged[key] = sourceData[key] ?? targetData[key];
    } else {
      merged[key] = targetData[key] ?? sourceData[key];
    }
  }
  
  return merged;
}

/**
 * Check if two records are in conflict
 * A conflict occurs when both records have been modified since the last sync
 */
export function detectConflict(
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown>,
  lastSyncTime?: Date
): boolean {
  const sourceUpdatedAt = new Date(sourceData.updated_at as string);
  const targetUpdatedAt = new Date(targetData.updated_at as string);
  
  if (!lastSyncTime) {
    // Without a reference point, consider it a conflict if both have been modified
    return sourceUpdatedAt.getTime() !== targetUpdatedAt.getTime();
  }
  
  // Conflict if both were modified after the last sync
  const sourceModified = sourceUpdatedAt > lastSyncTime;
  const targetModified = targetUpdatedAt > lastSyncTime;
  
  return sourceModified && targetModified;
}

/**
 * Create a conflict record
 */
export function createConflict(
  tableName: string,
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown>
): Conflict {
  return {
    id: `${tableName}-${sourceData.id}`,
    tableName,
    rowId: sourceData.id as string,
    sourceData,
    targetData,
    sourceUpdatedAt: new Date(sourceData.updated_at as string),
    targetUpdatedAt: new Date(targetData.updated_at as string),
    resolution: 'pending',
  };
}




