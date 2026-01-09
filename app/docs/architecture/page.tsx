/**
 * Architecture Documentation
 */

export const metadata = {
  title: 'Architecture - Supabase Syncer Documentation',
  description: 'System architecture and design patterns'
};

export default function ArchitectureDocsPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Architecture</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            Supabase Syncer is built with Next.js 16 (App Router), React 19, TypeScript, 
            and Supabase. It follows modern best practices for security, scalability, and maintainability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2">Frontend</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Next.js 16.1.1 (App Router)</li>
                <li>React 19.2.3</li>
                <li>TypeScript 5.1.0+</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2">Backend</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Next.js API Routes</li>
                <li>Supabase (PostgreSQL)</li>
                <li>Drizzle ORM</li>
                <li>Node.js 20.9.0+</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2">Security</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Supabase Auth</li>
                <li>AES-256-GCM Encryption</li>
                <li>CSRF Protection</li>
                <li>Rate Limiting</li>
                <li>Row Level Security (RLS)</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2">Infrastructure</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Vercel (Hosting)</li>
                <li>Supabase (Database & Auth)</li>
                <li>Vercel Cron (Scheduled Jobs)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Project Structure</h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <pre className="text-sm overflow-x-auto"><code>{`app/
  (auth)/              # Authentication routes
  (public)/            # Public pages
  admin/               # Admin dashboard
  api/                 # API routes
  connections/         # Connection management
  dashboard/           # User dashboard
  docs/                # Documentation
  explorer/            # Data explorer
  sync/                # Sync operations

components/            # React components
  ui/                  # Reusable UI components
  explorer/            # Explorer components
  sync/                # Sync components

lib/
  services/            # Business logic services
  db/                  # Database code
  supabase/            # Supabase utilities
  middleware/          # Middleware utilities
  validations/         # Validation schemas
  utils/               # Utility functions

supabase/
  migrations/          # Database migrations

types/                 # TypeScript types`}</code></pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Design Patterns</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Server Components</h3>
              <p className="text-gray-700 text-sm">
                Default to Server Components for data fetching. Only use Client Components 
                when needed for interactivity (hooks, event handlers, browser APIs).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Routes</h3>
              <p className="text-gray-700 text-sm">
                All API routes follow RESTful conventions and return consistent JSON responses 
                with success/error structure.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Middleware (Proxy)</h3>
              <p className="text-gray-700 text-sm">
                Uses <code>proxy.ts</code> (not middleware.ts) for request interception, 
                session management, and security headers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Handling</h3>
              <p className="text-gray-700 text-sm">
                Comprehensive error handling with sanitization for client responses and 
                detailed server-side logging.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security First</h3>
              <p className="text-gray-700 text-sm">
                All operations include authentication checks, CSRF protection, rate limiting, 
                input validation, and encryption.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Flow</h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <ol className="list-decimal list-inside text-gray-700 space-y-2 text-sm">
              <li>User makes request → Proxy checks authentication</li>
              <li>Request routed to API route or page component</li>
              <li>API route validates input, checks rate limits, CSRF</li>
              <li>Service layer handles business logic</li>
              <li>Database operations via Supabase client (with RLS)</li>
              <li>Response formatted and returned</li>
              <li>Security events logged for monitoring</li>
            </ol>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Architecture</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-700 text-sm">
                Supabase Auth handles user authentication. Sessions managed via secure cookies.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authorization</h3>
              <p className="text-gray-700 text-sm">
                Row Level Security (RLS) ensures users can only access their own data. 
                Admin access requires exact email match.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Encryption</h3>
              <p className="text-gray-700 text-sm">
                Database connection strings encrypted with AES-256-GCM before storage.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Input Validation</h3>
              <p className="text-gray-700 text-sm">
                All inputs validated using Zod schemas. SQL injection prevention via parameterized queries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

