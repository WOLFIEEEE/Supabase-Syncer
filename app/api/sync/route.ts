/**
 * Sync Routes
 * 
 * GET - List sync jobs (lightweight, stays in frontend)
 * POST - Create sync job (proxies to backend)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseSyncJobStore, getJobWithConnections } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';
import { SyncJobInputSchema, PaginationSchema, validateInput } from '@/lib/validations/schemas';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { sanitizeErrorMessage } from '@/lib/services/security-utils';
import { logger } from '@/lib/services/logger';

// GET - List all sync jobs for the authenticated user (lightweight, stays in frontend)
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
    logger.error('Error fetching sync jobs', { error });
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage(error) || 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}

// POST - Create a new sync job (proxies to backend)
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfValidation = await validateCSRFProtection(request);
    if (!csrfValidation.valid) {
      return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
    }
    
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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
    
    // Get connections (lightweight check, stays in frontend)
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
    
    // Forward to backend with encrypted URLs
    const proxyHandler = createProxyPOST('/api/sync');
    
    const modifiedRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        ...body,
        sourceEncryptedUrl: sourceConnection.encrypted_url,
        targetEncryptedUrl: targetConnection.encrypted_url,
      }),
    });
    
    return proxyHandler(modifiedRequest);
    
  } catch (error) {
    logger.error('Error creating sync job', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to create sync job' },
      { status: 500 }
    );
  }
}
