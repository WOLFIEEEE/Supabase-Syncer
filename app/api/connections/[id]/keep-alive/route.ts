/**
 * Keep Alive Toggle API
 * 
 * Allows users to enable/disable the keep-alive feature for a connection.
 * Also allows manual pinging of a database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { pingDatabase } from '@/lib/services/keep-alive';

/**
 * GET /api/connections/[id]/keep-alive
 * 
 * Get keep-alive status for a connection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const connection = await supabaseConnectionStore.getById(id, userId);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      keepAlive: connection.keep_alive === true,
      lastPingedAt: connection.last_pinged_at || null,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/connections/[id]/keep-alive
 * 
 * Toggle keep-alive setting for a connection
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { keepAlive } = body;
    
    if (typeof keepAlive !== 'boolean') {
      return NextResponse.json(
        { error: 'keepAlive must be a boolean' },
        { status: 400 }
      );
    }
    
    const connection = await supabaseConnectionStore.updateKeepAlive(id, userId, keepAlive);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      keepAlive: connection.keep_alive === true,
      message: keepAlive 
        ? 'Keep-alive enabled. Your database will be pinged every 6 hours.'
        : 'Keep-alive disabled.',
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connections/[id]/keep-alive
 * 
 * Manually ping the database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const connection = await supabaseConnectionStore.getById(id, userId);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Ping the database
    const result = await pingDatabase(
      connection.id,
      connection.name,
      connection.encrypted_url
    );
    
    if (result.success) {
      // Update last_pinged_at timestamp
      await supabaseConnectionStore.updateLastPinged(connection.id);
    }
    
    return NextResponse.json({
      success: result.success,
      duration: result.duration,
      error: result.error,
      message: result.success 
        ? `Database pinged successfully (${result.duration}ms)`
        : `Ping failed: ${result.error}`,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

