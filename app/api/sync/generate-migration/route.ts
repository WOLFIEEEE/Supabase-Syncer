import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { validateSchemas } from '@/lib/services/schema-validator';
import { inspectDatabaseSchema } from '@/lib/services/schema-inspector';
import { generateMigrationPlan, generateQuickFixSQL } from '@/lib/services/schema-migration-generator';
import { getUser } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';
import { MigrationInputSchema, validateInput } from '@/lib/validations/schemas';

/**
 * POST /api/sync/generate-migration
 * 
 * Generates SQL migration scripts to fix schema differences.
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
    
    // Rate limit check
    const rateLimitResult = checkRateLimit(user.id, 'write');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult, 'write') }
      );
    }
    
    const body = await request.json();
    
    // Validate input with Zod
    const validation = validateInput(MigrationInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    const {
      sourceConnectionId,
      targetConnectionId,
      tables,
      direction,
      issueId,
    } = validation.data;
    
    // Get connections (scoped to user)
    const [sourceConnection, targetConnection] = await Promise.all([
      supabaseConnectionStore.getById(sourceConnectionId, user.id),
      supabaseConnectionStore.getById(targetConnectionId, user.id),
    ]);
    
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
    const sourceUrl = decrypt(sourceConnection.encrypted_url);
    const targetUrl = decrypt(targetConnection.encrypted_url);
    
    // Auto-discover tables if not specified
    let tableNames = tables;
    
    if (!tables || tables.length === 0) {
      // Auto-discover tables from both databases
      const [sourceSchema, targetSchema] = await Promise.all([
        inspectDatabaseSchema(sourceUrl),
        inspectDatabaseSchema(targetUrl),
      ]);
      
      // Get union of all table names from both databases
      const allTables = new Set([
        ...sourceSchema.tables.map((t) => t.tableName),
        ...targetSchema.tables.map((t) => t.tableName),
      ]);
      
      tableNames = Array.from(allTables);
      
      // If both databases are empty, return empty migration
      if (tableNames.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            type: 'full_migration',
            migrationPlan: {
              scripts: [],
              summary: {
                totalScripts: 0,
                safeScripts: 0,
                cautionScripts: 0,
                dangerousScripts: 0,
              },
              fullScript: '-- No tables found in either database\n-- Nothing to migrate',
              rollbackScript: '-- No rollback needed',
            },
            validation: {
              summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
              canProceed: true,
            },
          },
        });
      }
    }
    
    // Run validation to get schema differences
    const validationResult = await validateSchemas(sourceUrl, targetUrl, tableNames);
    
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
