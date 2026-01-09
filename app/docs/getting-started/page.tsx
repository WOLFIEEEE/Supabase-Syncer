/**
 * Getting Started Documentation
 */

export const metadata = {
  title: 'Getting Started - Supabase Syncer Documentation',
  description: 'Quick start guide for Supabase Syncer'
};

export default function GettingStartedPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Getting Started</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Node.js 20.9.0 or higher</li>
            <li>npm or yarn package manager</li>
            <li>A Supabase account and project</li>
            <li>PostgreSQL databases to sync (Supabase or standard PostgreSQL)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Installation</h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
            <h3 className="font-semibold mb-2">1. Clone the Repository</h3>
            <pre className="bg-white p-3 rounded"><code>git clone https://github.com/WOLFIEEEE/Supabase-Syncer.git
cd Supabase-Syncer</code></pre>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
            <h3 className="font-semibold mb-2">2. Install Dependencies</h3>
            <pre className="bg-white p-3 rounded"><code>npm install</code></pre>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
            <h3 className="font-semibold mb-2">3. Set Up Environment Variables</h3>
            <p className="text-gray-700 mb-2">Create a <code>.env.local</code> file:</p>
            <pre className="bg-white p-3 rounded overflow-x-auto"><code>{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string
ADMIN_EMAIL=your_admin_email@example.com`}</code></pre>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
            <h3 className="font-semibold mb-2">4. Run Database Migrations</h3>
            <p className="text-gray-700 mb-2">Run the migration script in your Supabase SQL Editor:</p>
            <pre className="bg-white p-3 rounded"><code># Copy contents of supabase/migrations/009_ensure_all_tables_and_columns.sql
# and run in Supabase SQL Editor</code></pre>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-2">5. Start Development Server</h3>
            <pre className="bg-white p-3 rounded"><code>npm run dev</code></pre>
            <p className="text-gray-700 mt-2">Open <a href="http://localhost:3000" className="text-blue-600">http://localhost:3000</a></p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Start Guide</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Create Your First Connection</h3>
              <p className="text-gray-700 mb-2">
                Navigate to <code>/connections</code> and add a database connection. 
                Your connection string will be encrypted before storage.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Test the Connection</h3>
              <p className="text-gray-700 mb-2">
                Use the test connection feature to verify your database is accessible.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Create a Sync Job</h3>
              <p className="text-gray-700 mb-2">
                Go to <code>/sync/create</code> and set up a sync between two databases.
                You can choose which tables to sync and configure conflict resolution.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Validate Schema</h3>
              <p className="text-gray-700 mb-2">
                Before syncing, validate that schemas are compatible. The system will 
                detect any issues and suggest fixes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Start Syncing</h3>
              <p className="text-gray-700 mb-2">
                Once validated, start your sync job. Monitor progress in real-time 
                and view detailed logs.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Next Steps</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Read the <a href="/docs/api" className="text-blue-600">API Reference</a> for programmatic access</li>
            <li>Explore <a href="/docs/database" className="text-blue-600">Database Schema</a> documentation</li>
            <li>Learn about <a href="/docs/authentication" className="text-blue-600">Authentication</a> and security</li>
            <li>Check out <a href="/docs/architecture" className="text-blue-600">Architecture</a> overview</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

