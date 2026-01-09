/**
 * Database Schema Documentation
 */

export const metadata = {
  title: 'Database Schema - Supabase Syncer Documentation',
  description: 'Database schema documentation for Supabase Syncer'
};

export default function DatabaseDocsPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Database Schema</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            Supabase Syncer uses PostgreSQL (via Supabase) to store all application data. 
            All tables use Row Level Security (RLS) to ensure users can only access their own data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Core Tables</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">connections</h3>
              <p className="text-gray-700 mb-3">Stores encrypted database connection strings.</p>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-x-auto"><code>{`CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  encrypted_url TEXT NOT NULL,
  environment VARCHAR(20) NOT NULL,
  keep_alive BOOLEAN DEFAULT false NOT NULL,
  last_pinged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}</code></pre>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">sync_jobs</h3>
              <p className="text-gray-700 mb-3">Tracks synchronization jobs and their status.</p>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-x-auto"><code>{`CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_connection_id UUID NOT NULL REFERENCES connections(id),
  target_connection_id UUID NOT NULL REFERENCES connections(id),
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tables_config JSONB NOT NULL DEFAULT '[]',
  progress JSONB,
  checkpoint JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</code></pre>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">sync_logs</h3>
              <p className="text-gray-700 mb-3">Stores detailed logs for each sync job.</p>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-x-auto"><code>{`CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_job_id UUID NOT NULL REFERENCES sync_jobs(id),
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</code></pre>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Logging Tables</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">security_events</h3>
              <p className="text-gray-700 text-sm">Stores security-related events (auth failures, permission denials, etc.)</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">security_alerts</h3>
              <p className="text-gray-700 text-sm">Stores security alerts that need attention</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ping_logs</h3>
              <p className="text-gray-700 text-sm">Stores keep-alive ping history</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">user_sessions</h3>
              <p className="text-gray-700 text-sm">Tracks user sessions for security</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Usage Tracking</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">usage_limits</h3>
              <p className="text-gray-700 text-sm">Stores user usage limits and current usage</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">usage_history</h3>
              <p className="text-gray-700 text-sm">Historical usage data for analytics</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Migrations</h2>
          <p className="text-gray-700 mb-4">
            Database migrations are located in <code>supabase/migrations/</code>. 
            Run them in order using the Supabase SQL Editor.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">
              <strong>Important:</strong> Always run migrations in a test environment first 
              and backup your database before applying to production.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Row Level Security (RLS)</h2>
          <p className="text-gray-700 mb-4">
            All tables have RLS enabled. Users can only access their own data based on 
            <code>user_id</code> matching <code>auth.uid()</code>.
          </p>
          <p className="text-gray-700">
            Admin operations use the service role key which bypasses RLS for system operations.
          </p>
        </section>
      </div>
    </div>
  );
}

