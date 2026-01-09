/**
 * Authentication Documentation
 */

export const metadata = {
  title: 'Authentication - Supabase Syncer Documentation',
  description: 'Authentication and security documentation'
};

export default function AuthenticationDocsPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Authentication</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            Supabase Syncer uses Supabase Auth for authentication. All API endpoints 
            (except public health/status endpoints) require authentication.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication Methods</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Session Cookies (Browser)</h3>
              <p className="text-gray-700 mb-2">
                When using the web interface, authentication is handled automatically via session cookies.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Bearer Token (API)</h3>
              <p className="text-gray-700 mb-2">
                For API requests, include the access token in the Authorization header:
              </p>
              <pre className="bg-gray-50 p-4 rounded border border-gray-200"><code>Authorization: Bearer &lt;access_token&gt;</code></pre>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting an Access Token</h2>
          
          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
            <h3 className="font-semibold mb-2">Using Supabase Client</h3>
            <pre className="bg-white p-3 rounded overflow-x-auto"><code>{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const accessToken = session?.access_token;`}</code></pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Session Management</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Active Sessions</h3>
              <code className="block bg-gray-50 p-2 rounded text-sm mb-2">GET /api/sessions</code>
              <p className="text-gray-700 text-sm">Returns all active sessions for the authenticated user.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out from All Devices</h3>
              <code className="block bg-gray-50 p-2 rounded text-sm mb-2">DELETE /api/sessions</code>
              <p className="text-gray-700 text-sm">Invalidates all sessions for the user.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out from Specific Session</h3>
              <code className="block bg-gray-50 p-2 rounded text-sm mb-2">DELETE /api/sessions/[id]</code>
              <p className="text-gray-700 text-sm">Invalidates a specific session.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">CSRF Protection</h2>
          <p className="text-gray-700 mb-4">
            All state-changing operations (POST, PUT, DELETE) require CSRF protection.
          </p>
          
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-2">Getting a CSRF Token</h3>
            <pre className="bg-white p-3 rounded mb-2"><code>GET /api/csrf</code></pre>
            <p className="text-gray-700 text-sm mb-2">Returns a CSRF token that must be included in subsequent requests.</p>
            <pre className="bg-white p-3 rounded overflow-x-auto"><code>{`{
  "csrfToken": "token_value"
}`}</code></pre>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-4">
            <h3 className="font-semibold mb-2">Including CSRF Token</h3>
            <pre className="bg-white p-3 rounded overflow-x-auto"><code>{`X-CSRF-Token: &lt;csrf_token&gt;`}</code></pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin Authentication</h2>
          <p className="text-gray-700 mb-4">
            Admin endpoints require additional authentication. Only users with the exact 
            admin email address can access admin features.
          </p>
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-red-800">
              <strong>Security:</strong> Admin email is configured via <code>ADMIN_EMAIL</code> 
              environment variable. Default: <code>kgpkhushwant1@gmail.com</code>
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Responses</h2>
          <div className="space-y-2">
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">401 Unauthorized</code>
              <span className="ml-2 text-gray-700">Authentication required or invalid token</span>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">403 Forbidden</code>
              <span className="ml-2 text-gray-700">Valid authentication but insufficient permissions</span>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">429 Too Many Requests</code>
              <span className="ml-2 text-gray-700">Rate limit exceeded</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

