import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore, supabaseSyncJobStore, getJobWithConnections } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { calculateDiff } from '@/lib/services/diff-engine';
import { getUser } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';
import { SyncJobInputSchema, PaginationSchema, validateInput } from '@/lib/validations/schemas';

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
    
    // Rate limit check
    const rateLimitResult = checkRateLimit(user.id, 'read');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult, 'read') }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Validate pagination
    const paginationValidation = validateInput(PaginationSchema, {
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });
    
    const { limit, offset } = paginationValidation.success 
      ? paginationValidation.data 
      : { limit: 50, offset: 0 };
    
    const jobs = await supabaseSyncJobStore.getAll(user.id, limit, offset);
    const jobsWithConnections = await Promise.all(
      jobs.map(job => getJobWithConnections(job, user.id))
    );
    
    return NextResponse.json({
      success: true,
      data: jobsWithConnections,
      pagination: { limit, offset },
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
    
    // Rate limit check for sync operations (more restrictive)
    const rateLimitResult = checkRateLimit(user.id, 'sync');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult, 'sync') }
      );
    }
    
    const body = await request.json();
    
    // Validate input with Zod
    const validation = validateInput(SyncJobInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    const {
      sourceConnectionId,
      targetConnectionId,
      direction,
      tables,
      dryRun,
    } = validation.data;
    
    // Get connections (scoped to user)
    const [sourceConnection, targetConnection] = await Promise.all([
      supabaseConnectionStore.getById(sourceConnectionId, user.id),
      supabaseConnectionStore.getById(targetConnectionId, user.id),
    ]);
    
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
    const sourceUrl = decrypt(sourceConnection.encrypted_url);
    const targetUrl = decrypt(targetConnection.encrypted_url);
    
    // Get enabled tables
    const enabledTables = tables.filter((t) => t.enabled).map((t) => t.tableName);
    
    if (enabledTables.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one table must be enabled for sync' },
        { status: 400 }
      );
    }
    
    // Check sync limits (max 50 tables per sync)
    if (enabledTables.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Too many tables selected. Maximum 50 tables per sync job.' },
        { status: 400 }
      );
    }
    
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
      
      if (totalRows > 100000) {
        warnings.push(`Large sync: ${totalRows.toLocaleString()} rows will be processed`);
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
          estimatedSpeed: '~1000 rows/sec',
          warnings,
        },
      });
    }
    
    // Check concurrent job limit (max 3 running jobs per user)
    const allJobs = await supabaseSyncJobStore.getAll(user.id, 100, 0);
    const runningJobs = allJobs.filter(
      job => job.status === 'running' || job.status === 'pending'
    );
    if (runningJobs.length >= 3) {
      return NextResponse.json(
        { success: false, error: 'Maximum concurrent jobs reached (3). Wait for existing jobs to complete.' },
        { status: 400 }
      );
    }
    
    // Create sync job (with user ID)
    const job = await supabaseSyncJobStore.create(user.id, {
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
