/**
 * Admin Layout
 * 
 * Layout for admin dashboard with navigation sidebar
 * 
 * SECURITY: This layout requires admin authentication with exact email match:
 * - kgpkhushwant1@gmail.com
 */

import { requireAdminAccess, ADMIN_EMAIL } from '@/lib/middleware/admin-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logSecurityEvent } from '@/lib/services/security-logger';

export const metadata = {
  title: 'Admin Dashboard - Supabase Syncer',
  description: 'Admin monitoring and management dashboard'
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const layoutLoadStart = Date.now();
  const requestId = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_LAYOUT] Admin layout load started:', {
    requestId,
    timestamp: new Date().toISOString(),
    path: '/admin'
  });
  
  // Check admin access with detailed logging
  let adminUser;
  try {
    console.log('[ADMIN_LAYOUT] Verifying admin access...', {
      requestId,
      requiredEmail: ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    adminUser = await requireAdminAccess();
    
    console.log('[ADMIN_LAYOUT] Admin access verified:', {
      requestId,
      userId: adminUser.id,
      userEmail: adminUser.email,
      emailMatch: adminUser.email === ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    // Double-check email match (extra security layer)
    if (adminUser.email !== ADMIN_EMAIL) {
      console.error('[ADMIN_LAYOUT] CRITICAL: Email mismatch detected:', {
        requestId,
        providedEmail: adminUser.email,
        requiredEmail: ADMIN_EMAIL,
        timestamp: new Date().toISOString()
      });
      
      await logSecurityEvent({
        eventType: 'permission_denied',
        severity: 'critical',
        userId: adminUser.id,
        endpoint: '/admin',
        method: 'GET',
        details: {
          reason: 'Email mismatch in admin layout - security violation',
          providedEmail: adminUser.email,
          requiredEmail: ADMIN_EMAIL,
          requestId
        },
        requestId
      });
      
      redirect('/login?error=admin_required');
    }
    
    const layoutLoadDuration = Date.now() - layoutLoadStart;
    console.log('[ADMIN_LAYOUT] Admin layout access granted:', {
      requestId,
      userId: adminUser.id,
      userEmail: adminUser.email,
      duration: `${layoutLoadDuration}ms`,
      timestamp: new Date().toISOString()
    });
    
    await logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin layout accessed',
        email: adminUser.email,
        requiredEmail: ADMIN_EMAIL,
        emailMatch: adminUser.email === ADMIN_EMAIL,
        requestId,
        duration: layoutLoadDuration
      },
      requestId
    });
    
  } catch (error) {
    const layoutLoadDuration = Date.now() - layoutLoadStart;
    console.error('[ADMIN_LAYOUT] Admin access check failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${layoutLoadDuration}ms`,
      timestamp: new Date().toISOString()
    });
    
    await logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'high',
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin layout access denied',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        duration: layoutLoadDuration
      },
      requestId
    });
    
    redirect('/login?error=admin_required');
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="mt-2 px-2 py-1 bg-red-600 text-xs rounded">
            ADMIN ACCESS
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/admin" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📊 Dashboard
          </Link>
          
          <Link 
            href="/admin/users" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            👥 Users
          </Link>
          
          <Link 
            href="/admin/sync-jobs" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🔄 Sync Jobs
          </Link>
          
          <Link 
            href="/admin/security" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🔒 Security
          </Link>
          
          <Link 
            href="/admin/analytics" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📈 Analytics
          </Link>
          
          <Link 
            href="/admin/system-health" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🏥 System Health
          </Link>
          
          <Link 
            href="/admin/audit-log" 
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📝 Audit Log
          </Link>
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <Link 
              href="/dashboard" 
              className="block px-4 py-2 rounded hover:bg-gray-800 transition text-gray-400"
            >
              ← Back to App
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
          <p>Supabase Syncer Admin</p>
          <p>v1.0.0</p>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

