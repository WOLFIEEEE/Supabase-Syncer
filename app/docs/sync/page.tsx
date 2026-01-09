/**
 * Sync Operations Documentation
 */

export const metadata = {
  title: 'Sync Operations - Supabase Syncer Documentation',
  description: 'Database synchronization features and workflows'
};

export default function SyncDocsPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Sync Operations</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            Supabase Syncer enables bidirectional synchronization between PostgreSQL databases. 
            Supports one-way and two-way sync with conflict resolution strategies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sync Types</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">One-Way Sync</h3>
              <p className="text-gray-700 mb-2">
                Data flows from source to target only. Source database is the authoritative source.
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Source → Target (only)</li>
                <li>UPSERT operations (INSERT or UPDATE)</li>
                <li>No data loss from target</li>
                <li>Best for: Production → Staging, Master → Replica</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Two-Way Sync</h3>
              <p className="text-gray-700 mb-2">
                Data flows bidirectionally. Changes in either database are synced to the other.
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Source ↔ Target</li>
                <li>Requires conflict resolution strategy</li>
                <li>Best for: Multi-region deployments, Active-Active setups</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sync Workflow</h2>
          
          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
            <ol className="list-decimal list-inside text-gray-700 space-y-2 text-sm">
              <li><strong>Create Sync Job:</strong> Define source, target, tables, and direction</li>
              <li><strong>Validate Schema:</strong> Check compatibility between databases</li>
              <li><strong>Generate Migration (if needed):</strong> Auto-fix schema differences</li>
              <li><strong>Dry Run (optional):</strong> Preview changes without executing</li>
              <li><strong>Start Sync:</strong> Begin synchronization process</li>
              <li><strong>Monitor Progress:</strong> Track real-time metrics and logs</li>
              <li><strong>Review Results:</strong> Check completion status and any errors</li>
            </ol>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Conflict Resolution</h2>
          
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">source_wins</h3>
              <p className="text-gray-700 text-sm">Source database values take precedence</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">target_wins</h3>
              <p className="text-gray-700 text-sm">Target database values take precedence</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">merge</h3>
              <p className="text-gray-700 text-sm">Attempts to merge changes intelligently</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Schema Validation</h2>
          <p className="text-gray-700 mb-4">
            Before syncing, the system validates schema compatibility:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Table existence in both databases</li>
            <li>Column types and constraints</li>
            <li>Primary keys and indexes</li>
            <li>Foreign key relationships</li>
            <li>ENUM types</li>
          </ul>
          <p className="text-gray-700 mt-4">
            If differences are found, the system can generate migration scripts to fix them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sync Status</h2>
          <div className="space-y-2">
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">pending</code> - Created but not started</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">running</code> - Currently executing</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">completed</code> - Finished successfully</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">failed</code> - Encountered an error</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded text-sm">paused</code> - Temporarily stopped</div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Production Safeguards</h2>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800 mb-2">
              <strong>Important:</strong> When syncing to production databases:
            </p>
            <ul className="list-disc list-inside text-yellow-800 text-sm space-y-1">
              <li>Extra confirmation required</li>
              <li>Dry-run preview available</li>
              <li>Breaking change warnings displayed</li>
              <li>All operations logged for audit</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
          <div className="space-y-2 text-sm">
            <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/sync</code> - Create sync job</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/sync</code> - List sync jobs</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/sync/[id]</code> - Get sync details</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/sync/[id]/start</code> - Start sync</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/sync/[id]/pause</code> - Pause sync</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/sync/[id]/stop</code> - Stop sync</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/sync/[id]/metrics</code> - Get metrics</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/sync/validate</code> - Validate schema</div>
            <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/sync/generate-migration</code> - Generate migration</div>
          </div>
        </section>
      </div>
    </div>
  );
}

