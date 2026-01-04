import { NextRequest, NextResponse } from 'next/server';
import { connectionStore } from '@/lib/db/memory-store';
import { decrypt } from '@/lib/services/encryption';
import { validateSchemas } from '@/lib/services/schema-validator';
import { generateMigrationPlan, generateQuickFixSQL } from '@/lib/services/schema-migration-generator';
import { getUser } from '@/lib/supabase/server';

/**
 * POST /api/sync/generate-migration
 * 
 * Generates SQL migration scripts to fix schema differences.
 * 
 * Request body:
 * {
 *   sourceConnectionId: string;
 *   targetConnectionId: string;
 *   tables: string[];
 *   direction?: 'source_to_target' | 'target_to_source';
 *   issueId?: string;  // Generate fix for specific issue only
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
      direction = 'source_to_target',
      issueId,
    } = body as {
      sourceConnectionId: string;
      targetConnectionId: string;
      tables: string[];
      direction?: 'source_to_target' | 'target_to_source';
      issueId?: string;
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
    
    // Run validation to get schema differences
    const validationResult = await validateSchemas(sourceUrl, targetUrl, tables);
    
    // If specific issue requested, generate quick fix
    if (issueId) {
      const issue = validationResult.issues.find((i) => i.id === issueId);
      if (!issue) {
        return NextResponse.json(
          { success: false, error: 'Issue not found' },
          { status: 404 }
        );
      }
      
      const sourceTable = validationResult.sourceSchema.tables.find(
        (t) => t.tableName === issue.tableName
      );
      const targetTable = validationResult.targetSchema.tables.find(
        (t) => t.tableName === issue.tableName
      );
      
      const quickFixSQL = generateQuickFixSQL(issue, sourceTable, targetTable);
      
      if (!quickFixSQL) {
        return NextResponse.json(
          { success: false, error: 'Could not generate fix for this issue' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'quick_fix',
          issue,
          sql: quickFixSQL,
        },
      });
    }
    
    // Generate full migration plan
    const migrationPlan = generateMigrationPlan(validationResult, direction);
    
    return NextResponse.json({
      success: true,
      data: {
        type: 'full_migration',
        migrationPlan,
        validation: {
          summary: validationResult.summary,
          canProceed: validationResult.canProceed,
        },
      },
    });
    
  } catch (error) {
    console.error('Migration generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration generation failed' 
      },
      { status: 500 }
    );
  }
}
