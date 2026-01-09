/**
 * Admin Dashboard Main Page
 * 
 * Overview dashboard showing key metrics and recent activity
 * 
 * SECURITY: This page requires admin authentication with exact email match:
 * - kgpkhushwant1@gmail.com
 */

import { getUserStats, getSyncStats, getSecurityStats } from '@/lib/services/admin-analytics';
import { getLiveMetrics, getSystemStatus } from '@/lib/services/real-time-monitor';
import { requireAdminAccess, ADMIN_EMAIL } from '@/lib/middleware/admin-auth';
import { logSecurityEvent } from '@/lib/services/security-logger';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const pageLoadStart = Date.now();
  const requestId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_PAGE] Admin dashboard page load started:', {
    requestId,
    timestamp: new Date().toISOString(),
    path: '/admin'
  });
  
  // Strict admin authentication check with detailed logging
  let adminUser;
  try {
    console.log('[ADMIN_PAGE] Verifying admin access...', {
      requestId,
      requiredEmail: ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    adminUser = await requireAdminAccess();
    
    console.log('[ADMIN_PAGE] Admin access verified:', {
      requestId,
      userId: adminUser.id,
      userEmail: adminUser.email,
      emailMatch: adminUser.email === ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    // Log successful admin page access
    await logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin dashboard page accessed',
        email: adminUser.email,
        requiredEmail: ADMIN_EMAIL,
        emailMatch: adminUser.email === ADMIN_EMAIL,
        requestId
      },
      requestId
    });
    
    // Double-check email match (extra security layer)
    if (adminUser.email !== ADMIN_EMAIL) {
      console.error('[ADMIN_PAGE] CRITICAL: Email mismatch detected:', {
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
          reason: 'Email mismatch in admin page - security violation',
          providedEmail: adminUser.email,
          requiredEmail: ADMIN_EMAIL,
          requestId
        },
        requestId
      });
      
      throw new Error('Access denied: Email does not match admin requirements');
    }
    
  } catch (error) {
    console.error('[ADMIN_PAGE] Admin access check failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    await logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'high',
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin page access denied',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      requestId
    });
    
    throw error;
  }
  
  console.log('[ADMIN_PAGE] Fetching dashboard data...', {
    requestId,
    userId: adminUser.id,
    timestamp: new Date().toISOString()
  });
  
  // Fetch all dashboard data
  const dataFetchStart = Date.now();
  const [userStats, syncStats, securityStats, liveMetrics, systemStatus] = await Promise.all([
    getUserStats(),
    getSyncStats(),
    getSecurityStats(24),
    getLiveMetrics(),
    getSystemStatus()
  ]);
  
  const dataFetchDuration = Date.now() - dataFetchStart;
  const totalPageLoadDuration = Date.now() - pageLoadStart;
  
  console.log('[ADMIN_PAGE] Dashboard data fetched successfully:', {
    requestId,
    userId: adminUser.id,
    userEmail: adminUser.email,
    dataFetchDuration: `${dataFetchDuration}ms`,
    totalPageLoadDuration: `${totalPageLoadDuration}ms`,
    timestamp: new Date().toISOString()
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive monitoring and analytics for Supabase Syncer
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Logged in as:</strong> {adminUser.email}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Admin access verified • Request ID: {requestId}
          </p>
        </div>
      </div>
      
      {/* Real-Time Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Real-Time Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Active Users"
            value={liveMetrics.activeUsersCount}
            status={systemStatus.api}
          />
          <StatCard 
            title="Active Syncs"
            value={liveMetrics.activeSyncsCount}
            status={systemStatus.database}
          />
          <StatCard 
            title="Requests/Min"
            value={liveMetrics.apiRequestsPerMinute.toFixed(1)}
            status="operational"
          />
          <StatCard 
            title="Error Rate"
            value={`${liveMetrics.errorRate.toFixed(1)}%`}
            status={liveMetrics.errorRate > 10 ? 'degraded' : 'operational'}
          />
        </div>
      </div>
      
      {/* User Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard title="Total Users" value={userStats.totalUsers} />
          <InfoCard title="New Users (24h)" value={userStats.newUsers24h} />
          <InfoCard title="Active Now" value={userStats.activeUsersNow} />
          <InfoCard title="New Users (7d)" value={userStats.newUsers7d} />
          <InfoCard title="New Users (30d)" value={userStats.newUsers30d} />
          <InfoCard title="Active (24h)" value={userStats.activeUsers24h} />
        </div>
      </div>
      
      {/* Sync Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sync Job Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard title="Total Syncs" value={syncStats.totalSyncs} />
          <InfoCard title="Completed" value={syncStats.completedSyncs} color="green" />
          <InfoCard title="Failed" value={syncStats.failedSyncs} color="red" />
          <InfoCard title="Running" value={syncStats.runningSyncs} color="blue" />
          <InfoCard 
            title="Success Rate" 
            value={`${syncStats.successRate.toFixed(1)}%`} 
            color={syncStats.successRate >= 90 ? 'green' : syncStats.successRate >= 70 ? 'yellow' : 'red'}
          />
          <InfoCard title="Syncs (24h)" value={syncStats.syncs24h} />
          <InfoCard title="Avg Duration" value={`${syncStats.avgDurationSeconds.toFixed(1)}s`} />
        </div>
      </div>
      
      {/* Security Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Security Overview (24h)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard 
            title="Critical Events" 
            value={securityStats.eventsBySeverity.critical}
            color={securityStats.eventsBySeverity.critical > 0 ? 'red' : 'gray'}
          />
          <InfoCard 
            title="High Severity" 
            value={securityStats.eventsBySeverity.high}
            color={securityStats.eventsBySeverity.high > 0 ? 'orange' : 'gray'}
          />
          <InfoCard title="Medium Severity" value={securityStats.eventsBySeverity.medium} />
          <InfoCard title="Low Severity" value={securityStats.eventsBySeverity.low} />
          <InfoCard title="Failed Auth" value={securityStats.failedAuthAttempts} />
          <InfoCard title="Threat IPs" value={securityStats.uniqueThreatIPs} />
        </div>
      </div>
      
      {/* Recent Security Events */}
      {securityStats.recentEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Security Events</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Occurrence</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {securityStats.recentEvents.slice(0, 10).map((event, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.eventType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.lastOccurrence).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* System Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <StatusRow label="API" status={systemStatus.api} />
          <StatusRow label="Database" status={systemStatus.database} />
          <StatusRow label="Queue" status={systemStatus.queue} />
          <StatusRow label="Cache" status={systemStatus.cache} />
        </div>
      </div>
    </div>
  );
}

// Component: Stat Card
function StatCard({ 
  title, 
  value, 
  status 
}: { 
  title: string; 
  value: string | number; 
  status?: 'operational' | 'degraded' | 'down';
}) {
  const statusColors = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-sm">{title}</p>
        {status && (
          <span className={`px-2 py-1 rounded text-xs ${statusColors[status]}`}>
            {status}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

// Component: Info Card
function InfoCard({ 
  title, 
  value,
  color = 'gray'
}: { 
  title: string; 
  value: string | number;
  color?: 'gray' | 'green' | 'red' | 'blue' | 'yellow' | 'orange';
}) {
  const colors = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${colors[color]}`}>{value}</p>
    </div>
  );
}

// Component: Severity Badge
function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[severity as keyof typeof colors] || colors.low}`}>
      {severity}
    </span>
  );
}

// Component: Status Row
function StatusRow({ 
  label, 
  status 
}: { 
  label: string; 
  status: 'operational' | 'degraded' | 'down';
}) {
  const statusConfig = {
    operational: { color: 'bg-green-500', text: 'Operational' },
    degraded: { color: 'bg-yellow-500', text: 'Degraded' },
    down: { color: 'bg-red-500', text: 'Down' }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${config.color} mr-2`}></div>
        <span className="text-sm">{config.text}</span>
      </div>
    </div>
  );
}

