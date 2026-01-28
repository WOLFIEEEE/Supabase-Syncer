import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { encrypt, validateDatabaseUrl, maskDatabaseUrl } from '@/lib/services/encryption';
import { testConnection, getSyncableTables } from '@/lib/services/drizzle-factory';
import { getUser } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';
import { ConnectionInputSchema, validateInput } from '@/lib/validations/schemas';
import { checkConnectionLimit, updateConnectionCount } from '@/lib/services/usage-limits';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { sanitizeErrorMessage } from '@/lib/services/security-utils';
import { logger } from '@/lib/services/logger';

// GET - List all connections for the authenticated user
export async function GET() {
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
    
    const connections = await supabaseConnectionStore.getAll(user.id);
    
    // Map to API response format
    const allConnections = connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
      environment: conn.environment,
      keepAlive: conn.keep_alive,
      lastPingedAt: conn.last_pinged_at,
      createdAt: conn.created_at,
      updatedAt: conn.updated_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: allConnections,
    });
    
  } catch (error) {
    // SECURITY: Log full error server-side, sanitize for client
    logger.error('Error fetching connections', { error });
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage(error) || 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST - Create a new connection for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // SECURITY: CSRF Protection
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
    
    // Rate limit check for write operations
    const rateLimitResult = checkRateLimit(user.id, 'write');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult, 'write') }
      );
    }
    
    const body = await request.json();
    
    // Validate input with Zod
    const validation = validateInput(ConnectionInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    const { name, databaseUrl, environment } = validation.data;
    
    // Validate database URL format (additional check)
    if (!validateDatabaseUrl(databaseUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid PostgreSQL connection URL format' },
        { status: 400 }
      );
    }
    
    // Check connection limit using usage limits service
    const connectionLimitCheck = await checkConnectionLimit(user.id);
    if (!connectionLimitCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: connectionLimitCheck.reason || 'Connection limit reached',
          usage: connectionLimitCheck.currentUsage,
          limits: connectionLimitCheck.limits,
        },
        { status: 403 }
      );
    }
    
    // Test the connection
    const connectionTest = await testConnection(databaseUrl);
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, error: `Connection failed: ${connectionTest.error}` },
        { status: 400 }
      );
    }
    
    // Get syncable tables
    const tables = await getSyncableTables(databaseUrl);
    
    // Encrypt the database URL
    const encryptedUrl = encrypt(databaseUrl);
    
    // Create the connection with user ID
    const connection = await supabaseConnectionStore.create(user.id, {
      name,
      encryptedUrl,
      environment,
    });
    
    // Update connection count (non-blocking - don't fail if this errors)
    try {
      const allConnections = await supabaseConnectionStore.getAll(user.id);
      await updateConnectionCount(user.id, allConnections.length);
    } catch (updateError) {
      logger.error('Error updating connection count (non-critical)', { error: updateError });
      // Continue - connection was created successfully
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        environment: connection.environment,
        maskedUrl: maskDatabaseUrl(databaseUrl),
        version: connectionTest.version,
        tableCount: connectionTest.tableCount,
        syncableTables: tables,
      },
    });
    
  } catch (error) {
    logger.error('Error creating connection', { error });
    const message = error instanceof Error ? error.message : 'Failed to create connection';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a connection for the authenticated user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Rate limit check for write operations
    const rateLimitResult = checkRateLimit(user.id, 'write');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult, 'write') }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    // Validate UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection ID format' },
        { status: 400 }
      );
    }
    
    const deleted = await supabaseConnectionStore.delete(id, user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Connection not found or access denied' },
        { status: 404 }
      );
    }
    
    // Update connection count after deletion (non-blocking)
    try {
      const allConnections = await supabaseConnectionStore.getAll(user.id);
      await updateConnectionCount(user.id, allConnections.length);
    } catch (updateError) {
      logger.error('Error updating connection count after deletion (non-critical)', { error: updateError });
      // Continue - connection was deleted successfully
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection deleted',
    });
    
  } catch (error) {
    logger.error('Error deleting connection', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
