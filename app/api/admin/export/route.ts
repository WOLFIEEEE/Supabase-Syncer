/**
 * Admin Export API
 * 
 * POST /api/admin/export - Export data in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    });
    csvRows.push(values.map(v => `"${v}"`).join(','));
  }
  
  return csvRows.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    await requireAdminAccess();
    
    const body = await request.json();
    const { type, format = 'csv', filters = {} } = body;
    
    const supabase = await createClient();
    let data: any[] = [];
    
    if (type === 'users') {
      const { data: users } = await supabase
        .from('connections')
        .select('user_id, created_at');
      
      if (users) {
        const userMap = new Map<string, any>();
        users.forEach((u: { user_id: string; created_at: string }) => {
          if (!userMap.has(u.user_id)) {
            userMap.set(u.user_id, {
              userId: u.user_id,
              firstSeen: u.created_at,
            });
          }
        });
        data = Array.from(userMap.values());
      }
    } else if (type === 'sync-jobs') {
      let query = supabase.from('sync_jobs').select('*');
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);
      const { data: jobs } = await query;
      data = jobs || [];
    } else if (type === 'security-events') {
      let query = supabase.from('security_events').select('*');
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.eventType) query = query.eq('event_type', filters.eventType);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);
      const { data: events } = await query;
      data = events || [];
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid export type' },
        { status: 400 }
      );
    }
    
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString()}.csv"`,
        },
      });
    } else if (format === 'json') {
      return NextResponse.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use csv or json' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[ADMIN_API] Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to export data' },
      { status: 500 }
    );
  }
}

