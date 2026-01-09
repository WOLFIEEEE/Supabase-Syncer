/**
 * API Reference Documentation
 * 
 * Complete API endpoint documentation with examples
 */

import Link from 'next/link';

export const metadata = {
  title: 'API Reference - Supabase Syncer Documentation',
  description: 'Complete API endpoint documentation for Supabase Syncer'
};

export default function ApiDocsPage() {
  const apiGroups = [
    {
      title: 'Health & Status',
      endpoints: [
        {
          method: 'GET',
          path: '/api/health',
          description: 'Health check endpoint for uptime monitoring',
          auth: false,
          example: '/api/health'
        },
        {
          method: 'GET',
          path: '/api/status',
          description: 'Get system status and component health',
          auth: false,
          example: '/api/status'
        },
        {
          method: 'GET',
          path: '/api/version',
          description: 'Get version information and changelog',
          auth: false,
          example: '/api/version'
        },
        {
          method: 'GET',
          path: '/api/features',
          description: 'Get machine-readable list of all features',
          auth: false,
          example: '/api/features'
        }
      ]
    },
    {
      title: 'Connections',
      endpoints: [
        {
          method: 'GET',
          path: '/api/connections',
          description: 'List all database connections for authenticated user',
          auth: true,
          example: '/api/connections'
        },
        {
          method: 'POST',
          path: '/api/connections',
          description: 'Create a new database connection',
          auth: true,
          body: {
            name: 'string',
            databaseUrl: 'string',
            environment: 'production | development'
          },
          example: '/api/connections'
        },
        {
          method: 'GET',
          path: '/api/connections/[id]',
          description: 'Get connection details by ID',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000'
        },
        {
          method: 'POST',
          path: '/api/connections/[id]',
          description: 'Update connection details',
          auth: true,
          body: {
            name: 'string (optional)',
            databaseUrl: 'string (optional)',
            environment: 'production | development (optional)'
          },
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000'
        },
        {
          method: 'DELETE',
          path: '/api/connections/[id]',
          description: 'Delete a connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000'
        },
        {
          method: 'GET',
          path: '/api/connections/[id]/schema',
          description: 'Get full database schema for a connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/schema'
        },
        {
          method: 'POST',
          path: '/api/connections/[id]/test',
          description: 'Test database connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/test'
        },
        {
          method: 'POST',
          path: '/api/connections/[id]/execute',
          description: 'Execute SQL on a connection (requires production confirmation)',
          auth: true,
          body: {
            sql: 'string',
            confirmProduction: 'boolean (if production)'
          },
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/execute'
        },
        {
          method: 'GET',
          path: '/api/connections/[id]/keep-alive',
          description: 'Get keep-alive status for a connection',
          auth: true,
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/keep-alive'
        },
        {
          method: 'POST',
          path: '/api/connections/[id]/keep-alive',
          description: 'Enable/disable keep-alive for a connection',
          auth: true,
          body: {
            keepAlive: 'boolean'
          },
          example: '/api/connections/123e4567-e89b-12d3-a456-426614174000/keep-alive'
        }
      ]
    },
    {
      title: 'Sync Operations',
      endpoints: [
        {
          method: 'GET',
          path: '/api/sync',
          description: 'List all sync jobs for authenticated user',
          auth: true,
          queryParams: {
            status: 'pending | running | completed | failed | paused (optional)',
            limit: 'number (optional, default: 50)',
            offset: 'number (optional, default: 0)'
          },
          example: '/api/sync?status=completed&limit=10'
        },
        {
          method: 'POST',
          path: '/api/sync',
          description: 'Create a new sync job',
          auth: true,
          body: {
            sourceConnectionId: 'string (UUID)',
            targetConnectionId: 'string (UUID)',
            direction: 'one_way | two_way',
            tables: [
              {
                tableName: 'string',
                enabled: 'boolean',
                conflictStrategy: 'source_wins | target_wins | merge (optional)'
              }
            ],
            dryRun: 'boolean (optional, default: false)'
          },
          example: '/api/sync'
        },
        {
          method: 'GET',
          path: '/api/sync/[id]',
          description: 'Get sync job details by ID',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000'
        },
        {
          method: 'POST',
          path: '/api/sync/[id]/start',
          description: 'Start a paused or pending sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/start'
        },
        {
          method: 'POST',
          path: '/api/sync/[id]/pause',
          description: 'Pause a running sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/pause'
        },
        {
          method: 'POST',
          path: '/api/sync/[id]/stop',
          description: 'Stop a running sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/stop'
        },
        {
          method: 'GET',
          path: '/api/sync/[id]/metrics',
          description: 'Get real-time metrics for a sync job',
          auth: true,
          example: '/api/sync/123e4567-e89b-12d3-a456-426614174000/metrics'
        },
        {
          method: 'POST',
          path: '/api/sync/validate',
          description: 'Validate schema compatibility between two connections',
          auth: true,
          body: {
            sourceConnectionId: 'string (UUID)',
            targetConnectionId: 'string (UUID)',
            tables: ['string (optional)']
          },
          example: '/api/sync/validate'
        },
        {
          method: 'POST',
          path: '/api/sync/generate-migration',
          description: 'Generate SQL migration script to fix schema differences',
          auth: true,
          body: {
            sourceConnectionId: 'string (UUID)',
            targetConnectionId: 'string (UUID)',
            tables: ['string (optional)']
          },
          example: '/api/sync/generate-migration'
        }
      ]
    },
    {
      title: 'Data Explorer',
      endpoints: [
        {
          method: 'GET',
          path: '/api/explorer/[connectionId]/tables',
          description: 'List all tables in a connection',
          auth: true,
          example: '/api/explorer/123e4567-e89b-12d3-a456-426614174000/tables'
        },
        {
          method: 'GET',
          path: '/api/explorer/[connectionId]/[table]/rows',
          description: 'Get paginated rows from a table',
          auth: true,
          queryParams: {
            limit: 'number (optional, default: 100)',
            offset: 'number (optional, default: 0)',
            orderBy: 'string (optional)',
            orderDirection: 'asc | desc (optional)'
          },
          example: '/api/explorer/123e4567-e89b-12d3-a456-426614174000/users/rows?limit=50'
        },
        {
          method: 'GET',
          path: '/api/explorer/[connectionId]/[table]/row',
          description: 'Get a single row by primary key',
          auth: true,
          queryParams: {
            id: 'string (primary key value)'
          },
          example: '/api/explorer/123e4567-e89b-12d3-a456-426614174000/users/row?id=123'
        }
      ]
    },
    {
      title: 'Sessions',
      endpoints: [
        {
          method: 'GET',
          path: '/api/sessions',
          description: 'Get all active sessions for authenticated user',
          auth: true,
          example: '/api/sessions'
        },
        {
          method: 'DELETE',
          path: '/api/sessions',
          description: 'Sign out from all devices',
          auth: true,
          example: '/api/sessions'
        },
        {
          method: 'DELETE',
          path: '/api/sessions/[id]',
          description: 'Sign out from a specific session',
          auth: true,
          example: '/api/sessions/123e4567-e89b-12d3-a456-426614174000'
        }
      ]
    },
    {
      title: 'Usage & Limits',
      endpoints: [
        {
          method: 'GET',
          path: '/api/usage',
          description: 'Get usage statistics and limits for authenticated user',
          auth: true,
          example: '/api/usage'
        }
      ]
    },
    {
      title: 'CSRF Protection',
      endpoints: [
        {
          method: 'GET',
          path: '/api/csrf',
          description: 'Get CSRF token for protected operations',
          auth: true,
          example: '/api/csrf'
        }
      ]
    },
    {
      title: 'Cron Jobs',
      endpoints: [
        {
          method: 'GET',
          path: '/api/cron/keep-alive',
          description: 'Cron endpoint to ping databases with keep-alive enabled',
          auth: false,
          note: 'Protected by Vercel Cron secret',
          example: '/api/cron/keep-alive'
        }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
        <p className="text-lg text-gray-600">
          Complete documentation for all API endpoints. All endpoints return JSON responses.
        </p>
      </div>

      {/* Authentication Section */}
      <div className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication</h2>
        <p className="text-gray-700 mb-4">
          Most endpoints require authentication via Supabase. Include your session cookie or Bearer token in requests.
        </p>
        <div className="bg-white rounded p-4 font-mono text-sm">
          <div className="mb-2"><strong>Header:</strong> Authorization: Bearer {'<token>'}</div>
          <div><strong>Or:</strong> Session cookie (automatically included in browser requests)</div>
        </div>
      </div>

      {/* API Groups */}
      {apiGroups.map((group, groupIndex) => (
        <div key={groupIndex} id={group.title.toLowerCase().replace(/\s+/g, '-')} className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-b-2 border-gray-200 pb-2">
            {group.title}
          </h2>
          
          <div className="space-y-8">
            {group.endpoints.map((endpoint, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                  {endpoint.auth && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Auth Required</span>
                  )}
                  {!endpoint.auth && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Public</span>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4">{endpoint.description}</p>
                
                {'body' in endpoint && endpoint.body && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Request Body:</h4>
                    <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                      <code>{JSON.stringify(endpoint.body, null, 2)}</code>
                    </pre>
                  </div>
                )}
                
                {'queryParams' in endpoint && endpoint.queryParams && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Query Parameters:</h4>
                    <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                      <code>{JSON.stringify(endpoint.queryParams, null, 2)}</code>
                    </pre>
                  </div>
                )}
                
                {'note' in endpoint && endpoint.note && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <strong>Note:</strong> {endpoint.note}
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Example:</h4>
                  <code className="block bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                    {endpoint.example}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Response Format */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Response Format</h2>
        <p className="text-gray-700 mb-4">All API responses follow this structure:</p>
        <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
          <code>{`{
  "success": true | false,
  "data": { ... } | null,
  "error": "string" | null,
  "message": "string" | null
}`}</code>
        </pre>
        <p className="text-gray-700 mt-4">
          <strong>Status Codes:</strong> 200 (Success), 400 (Bad Request), 401 (Unauthorized), 
          403 (Forbidden), 404 (Not Found), 429 (Rate Limited), 500 (Server Error)
        </p>
      </div>

      {/* Rate Limiting */}
      <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rate Limiting</h2>
        <p className="text-gray-700 mb-2">
          API requests are rate-limited to prevent abuse. Rate limit headers are included in responses:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li><code>X-RateLimit-Limit</code> - Maximum requests allowed</li>
          <li><code>X-RateLimit-Remaining</code> - Remaining requests in current window</li>
          <li><code>X-RateLimit-Reset</code> - Time when rate limit resets (Unix timestamp)</li>
        </ul>
        <p className="text-gray-700 mt-4">
          When rate limited, you'll receive a 429 status code with a retry-after header.
        </p>
      </div>
    </div>
  );
}

