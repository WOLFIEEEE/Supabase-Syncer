/**
 * Admin Features Documentation
 */

export const metadata = {
  title: 'Admin Features - Supabase Syncer Documentation',
  description: 'Admin dashboard and monitoring documentation'
};

export default function AdminDocsPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Admin Features</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            The admin dashboard provides comprehensive monitoring, analytics, and management 
            capabilities for Supabase Syncer. Access is restricted to the configured admin email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Access Control</h2>
          <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
            <p className="text-red-800">
              <strong>Security:</strong> Admin access requires exact email match. 
              Configured via <code>ADMIN_EMAIL</code> environment variable.
            </p>
          </div>
          <p className="text-gray-700 mb-4">
            The system performs strict email verification:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>User must be authenticated (logged in)</li>
            <li>User email must exactly match <code>ADMIN_EMAIL</code></li>
            <li>Email comparison is case-insensitive but trimmed</li>
            <li>All access attempts are logged with detailed information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-gray-700 mb-4">Access at <code>/admin</code></p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Metrics</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Active users count</li>
                <li>Active syncs count</li>
                <li>API requests per minute</li>
                <li>Error rate percentage</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Statistics</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Total users</li>
                <li>New users (24h, 7d, 30d)</li>
                <li>Active users now and in last 24h</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Job Statistics</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Total, completed, failed, and running syncs</li>
                <li>Success rate percentage</li>
                <li>Syncs in last 24 hours</li>
                <li>Average duration</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Overview</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Events by severity (critical, high, medium, low)</li>
                <li>Failed authentication attempts</li>
                <li>Unique threat IPs</li>
                <li>Recent security events</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Status</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>API status</li>
                <li>Database status</li>
                <li>Queue status</li>
                <li>Cache status</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Logging</h2>
          <p className="text-gray-700 mb-4">
            All admin operations are logged with detailed information:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Request IDs:</strong> Unique identifier for each request</li>
            <li><strong>Timestamps:</strong> ISO 8601 formatted timestamps</li>
            <li><strong>User Information:</strong> User ID and email</li>
            <li><strong>Email Verification:</strong> Logs whether email matches admin requirements</li>
            <li><strong>Duration Metrics:</strong> Time taken for operations</li>
            <li><strong>Error Details:</strong> Full error information with stack traces</li>
            <li><strong>IP Addresses:</strong> Client IP addresses (from headers)</li>
            <li><strong>User Agents:</strong> Browser/client information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Events</h2>
          <p className="text-gray-700 mb-4">
            All security events are logged to the <code>security_events</code> table:
          </p>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <pre className="text-sm overflow-x-auto"><code>{`{
  "event_type": "auth_failed | auth_success | permission_denied | ...",
  "severity": "low | medium | high | critical",
  "user_id": "uuid",
  "ip_address": "string",
  "user_agent": "string",
  "endpoint": "string",
  "method": "GET | POST | ...",
  "details": { ... },
  "request_id": "string",
  "created_at": "timestamp"
}`}</code></pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin Routes</h2>
          <div className="space-y-2">
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin</code> - Main dashboard</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin/users</code> - User management</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin/sync-jobs</code> - Sync job management</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin/security</code> - Security monitoring</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin/analytics</code> - Analytics dashboard</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin/system-health</code> - System health</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin/audit-log</code> - Audit logs</div>
          </div>
        </section>
      </div>
    </div>
  );
}

