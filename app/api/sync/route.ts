import { NextRequest, NextResponse } from 'next/server';
import { connectionStore, syncJobStore, getJobWithConnections } from '@/lib/db/memory-store';
import { decrypt } from '@/lib/services/encryption';
import { calculateDiff } from '@/lib/services/diff-engine';
import { getUser } from '@/lib/supabase/server';
import type { SyncDirection, TableConfig } from '@/types';

// GET - List all sync jobs for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    const jobs = syncJobStore.getAll(user.id, limit, offset);
    const jobsWithConnections = jobs.map(job => getJobWithConnections(job, user.id));
    
    return NextResponse.json({
      success: true,
      data: jobsWithConnections,
    });
    
  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}

// POST - Create a new sync job (with optional dry run)
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
      direction,
      tables,
      dryRun = false,
    } = body as {
      sourceConnectionId: string;
      targetConnectionId: string;
      direction: SyncDirection;
      tables: TableConfig[];
      dryRun?: boolean;
    };
    
    // Validate input
    if (!sourceConnectionId || !targetConnectionId) {
      return NextResponse.json(
        { success: false, error: 'Source and target connections are required' },
        { status: 400 }
      );
    }
    
    if (sourceConnectionId === targetConnectionId) {
      return NextResponse.json(
        { success: false, error: 'Source and target connections must be different' },
        { status: 400 }
      );
    }
    
    if (!direction || !['one_way', 'two_way'].includes(direction)) {
      return NextResponse.json(
        { success: false, error: 'Direction must be "one_way" or "two_way"' },
        { status: 400 }
      );
    }
    
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one table must be selected' },
        { status: 400 }
      );
    }
    
    // Get connections (scoped to user)
    const sourceConnection = connectionStore.getById(sourceConnectionId, user.id);
    const targetConnection = connectionStore.getById(targetConnectionId, user.id);
    
    if (!sourceConnection || !targetConnection) {
      return NextResponse.json(
        { success: false, error: 'Source or target connection not found' },
        { status: 404 }
      );
    }
    
    // Safety check: Warn if syncing to production
    if (targetConnection.environment === 'production') {
      const confirmHeader = request.headers.get('X-Confirm-Production');
      if (confirmHeader !== 'true') {
        return NextResponse.json(
          {
            success: false,
            error: 'Syncing to production requires confirmation',
            requiresConfirmation: true,
            message: 'You are about to sync data TO a production database. This is a potentially destructive operation. Set X-Confirm-Production header to "true" to proceed.',
          },
          { status: 400 }
        );
      }
    }
    
    // Decrypt URLs
    const sourceUrl = decrypt(sourceConnection.encryptedUrl);
    const targetUrl = decrypt(targetConnection.encryptedUrl);
    
    // Get enabled tables
    const enabledTables = tables.filter((t) => t.enabled).map((t) => t.tableName);
    
    if (dryRun) {
      // Perform dry run - calculate differences
      const diff = await calculateDiff({
        sourceUrl,
        targetUrl,
        tables: enabledTables,
      });
      
      // Estimate duration (rough: 1 second per 1000 rows)
      const totalRows = diff.totalInserts + diff.totalUpdates;
      const estimatedDuration = Math.ceil(totalRows / 1000);
      
      // Generate warnings
      const warnings: string[] = [];
      
      if (targetConnection.environment === 'production') {
        warnings.push('Target is a PRODUCTION database - proceed with caution');
      }
      
      if (diff.schemaIssues.length > 0) {
        warnings.push(`${diff.schemaIssues.length} table(s) have schema differences`);
      }
      
      if (direction === 'two_way') {
        warnings.push('Two-way sync may result in conflicts that require resolution');
      }
      
      return NextResponse.json({
        success: true,
        data: {
          dryRun: true,
          tables: diff.tables,
          schemaIssues: diff.schemaIssues,
          totalInserts: diff.totalInserts,
          totalUpdates: diff.totalUpdates,
          estimatedDuration,
          warnings,
        },
      });
    }
    
    // Create sync job (with user ID)
    const job = syncJobStore.create(user.id, {
      sourceConnectionId,
      targetConnectionId,
      direction,
      tablesConfig: tables,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: 'pending',
        message: 'Sync job created. Use /api/sync/{id}/start to begin.',
      },
    });
    
  } catch (error) {
    console.error('Error creating sync job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sync job' },
      { status: 500 }
    );
  }
}
