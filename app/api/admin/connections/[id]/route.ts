/**
 * GET/PATCH/DELETE /api/admin/connections/[id]
 * 
 * Manage individual connection (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const connection = await supabaseConnectionStore.getByIdForService(id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        userId: connection.user_id,
        name: connection.name,
        environment: connection.environment,
        keepAlive: connection.keep_alive || false,
        lastPingedAt: connection.last_pinged_at,
        createdAt: connection.created_at,
        updatedAt: connection.updated_at,
      },
    });
  } catch (error) {
    logger.error('[ADMIN_CONNECTIONS] Error fetching connection', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const body = await request.json();
    const { name, environment } = body;

    const connection = await supabaseConnectionStore.getByIdForService(id);
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Update connection (admin can update any connection)
    const updateData: { name?: string; environment?: 'production' | 'development' } = {};
    if (name) updateData.name = name;
    if (environment && (environment === 'production' || environment === 'development')) {
      updateData.environment = environment;
    }

    const updated = await supabaseConnectionStore.update(
      id,
      connection.user_id,
      updateData
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update connection' },
        { status: 500 }
      );
    }

    // Log admin action
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'auth_success',
        severity: 'low',
        userId: user.id,
        endpoint: `/api/admin/connections/${id}`,
        method: 'PATCH',
        details: {
          action: 'update_connection',
          connectionId: id,
          targetUserId: connection.user_id,
          changes: updateData,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.user_id,
        name: updated.name,
        environment: updated.environment,
        keepAlive: updated.keep_alive || false,
        lastPingedAt: updated.last_pinged_at,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    logger.error('[ADMIN_CONNECTIONS] Error updating connection', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const connection = await supabaseConnectionStore.getByIdForService(id);
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete connection (admin can delete any connection)
    const deleted = await supabaseConnectionStore.delete(id, connection.user_id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    // Log admin action
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'auth_success',
        severity: 'medium',
        userId: user.id,
        endpoint: `/api/admin/connections/${id}`,
        method: 'DELETE',
        details: {
          action: 'delete_connection',
          connectionId: id,
          targetUserId: connection.user_id,
          connectionName: connection.name,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully',
    });
  } catch (error) {
    logger.error('[ADMIN_CONNECTIONS] Error deleting connection', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
