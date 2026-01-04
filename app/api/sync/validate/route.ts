import { NextRequest, NextResponse } from 'next/server';
import { connectionStore } from '@/lib/db/memory-store';
import { decrypt } from '@/lib/services/encryption';
import { validateSchemas, getValidationSummary } from '@/lib/services/schema-validator';
import { getUser } from '@/lib/supabase/server';
import type { SyncDirection, TableConfig } from '@/types';

/**
 * POST /api/sync/validate
 * 
 * Comprehensive pre-sync validation between source and target databases.
 * Returns categorized validation issues with severity levels.
 * 
 * Request body:
 * {
 *   sourceConnectionId: string;
 *   targetConnectionId: string;
 *   tables: string[];  // List of table names to validate
 *   direction?: SyncDirection;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      sourceConnectionId,
      targetConnectionId,
      tables,
      direction = 'one_way',
    } = body as {
      sourceConnectionId: string;
      targetConnectionId: string;
      tables: string[] | TableConfig[];
      direction?: SyncDirection;
    };
    
    // Validate input
    if (!sourceConnectionId || !targetConnectionId) {
      return NextResponse.json(
        { success: false, error: 'Source and target connection IDs are required' },
        { status: 400 }
      );
    }
    
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one table must be specified' },
        { status: 400 }
      );
    }
    
    // Get connections (scoped to user)
    const sourceConnection = connectionStore.getById(sourceConnectionId, user.id);
    const targetConnection = connectionStore.getById(targetConnectionId, user.id);
    
    if (!sourceConnection) {
      return NextResponse.json(
        { success: false, error: 'Source connection not found' },
        { status: 404 }
      );
    }
    
    if (!targetConnection) {
      return NextResponse.json(
        { success: false, error: 'Target connection not found' },
        { status: 404 }
      );
    }
    
    // Decrypt URLs
    const sourceUrl = decrypt(sourceConnection.encryptedUrl);
    const targetUrl = decrypt(targetConnection.encryptedUrl);
    
    // Normalize table list (handle both string[] and TableConfig[])
    const tableNames = tables.map((t) => 
      typeof t === 'string' ? t : t.tableName
    );
    
    // Run validation
    const validationResult = await validateSchemas(sourceUrl, targetUrl, tableNames);
    
    // Generate additional warnings
    const warnings: string[] = [];
    
    // Production target warning
    if (targetConnection.environment === 'production') {
      warnings.push('Target is a PRODUCTION database - proceed with extreme caution');
    }
    
    // Two-way sync warning
    if (direction === 'two_way') {
      warnings.push('Two-way sync may result in conflicts that require resolution');
    }
    
    // Large data warning
    const totalSourceRows = validationResult.sourceSchema.tables
      .filter((t) => tableNames.includes(t.tableName))
      .reduce((sum, t) => sum + t.rowCount, 0);
    
    if (totalSourceRows > 100000) {
      warnings.push(`Large dataset: ${totalSourceRows.toLocaleString()} rows to potentially sync`);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        validation: validationResult,
        summary: getValidationSummary(validationResult),
        warnings,
        canProceed: validationResult.canProceed,
        requiresConfirmation: validationResult.requiresConfirmation || 
          targetConnection.environment === 'production',
        targetEnvironment: targetConnection.environment,
        targetName: targetConnection.name,
      },
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      },
      { status: 500 }
    );
  }
}
