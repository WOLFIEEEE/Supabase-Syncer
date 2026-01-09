/**
 * Security Documentation
 */

export const metadata = {
  title: 'Security - Supabase Syncer Documentation',
  description: 'Security features, encryption, and best practices'
};

export default function SecurityDocsPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Security</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            Security is a top priority. Supabase Syncer implements multiple layers of 
            security to protect user data and prevent unauthorized access.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Encryption</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection String Encryption</h3>
              <p className="text-gray-700 mb-2">
                All database connection strings are encrypted using AES-256-GCM before storage.
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Encryption key stored in environment variable</li>
                <li>Automatic encryption on save</li>
                <li>Automatic decryption on use</li>
                <li>Never stored in plain text</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Encryption Algorithm</h3>
              <p className="text-gray-700 text-sm">
                <strong>AES-256-GCM:</strong> Advanced Encryption Standard with 256-bit keys 
                and Galois/Counter Mode for authenticated encryption.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication & Authorization</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Supabase Auth</h3>
              <p className="text-gray-700 text-sm">
                All authentication handled by Supabase Auth with secure session management.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Row Level Security (RLS)</h3>
              <p className="text-gray-700 text-sm">
                PostgreSQL RLS ensures users can only access their own data. Policies enforced 
                at the database level.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access</h3>
              <p className="text-gray-700 text-sm">
                Admin features require exact email match. All access attempts logged with 
                detailed security events.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">CSRF Protection</h2>
          <p className="text-gray-700 mb-4">
            All state-changing operations (POST, PUT, DELETE) require CSRF tokens:
          </p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 text-sm">
            <li>Get CSRF token: <code>GET /api/csrf</code></li>
            <li>Include in request header: <code>X-CSRF-Token: &lt;token&gt;</code></li>
            <li>Token validated server-side before processing</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rate Limiting</h2>
          <p className="text-gray-700 mb-4">
            API requests are rate-limited to prevent abuse:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
            <li>Per-user rate limits</li>
            <li>Different limits for different operation types</li>
            <li>Rate limit headers in responses</li>
            <li>429 status code when exceeded</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Input Validation</h2>
          <p className="text-gray-700 mb-4">
            All user inputs are validated using Zod schemas:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
            <li>Type checking</li>
            <li>Format validation</li>
            <li>Length constraints</li>
            <li>SQL injection prevention via parameterized queries</li>
            <li>XSS prevention via output sanitization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Headers</h2>
          <p className="text-gray-700 mb-4">
            All responses include security headers via proxy.ts:
          </p>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <pre className="text-sm overflow-x-auto"><code>{`Content-Security-Policy
Strict-Transport-Security
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy`}</code></pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Logging</h2>
          <p className="text-gray-700 mb-4">
            All security events are logged to the <code>security_events</code> table:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
            <li>Failed authentication attempts</li>
            <li>Permission denied events</li>
            <li>Rate limit violations</li>
            <li>CSRF validation failures</li>
            <li>Suspicious activity patterns</li>
            <li>Admin access attempts</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Best Practices</h2>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <ul className="list-disc list-inside text-blue-900 space-y-2 text-sm">
              <li>Never commit environment variables or secrets</li>
              <li>Use strong, unique passwords</li>
              <li>Enable two-factor authentication on Supabase</li>
              <li>Regularly review security events</li>
              <li>Keep dependencies updated</li>
              <li>Use HTTPS in production</li>
              <li>Regular security audits</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

