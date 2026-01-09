/**
 * Documentation Layout
 * 
 * Provides consistent navigation and layout for all documentation pages
 */

import Link from 'next/link';

export const metadata = {
  title: 'Documentation - Supabase Syncer',
  description: 'Developer documentation for Supabase Syncer'
};

export default function DocsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/docs', label: 'Overview' },
    { href: '/docs/getting-started', label: 'Getting Started' },
    { href: '/docs/api', label: 'API Reference' },
    { href: '/docs/database', label: 'Database' },
    { href: '/docs/authentication', label: 'Authentication' },
    { href: '/docs/admin', label: 'Admin' },
    { href: '/docs/architecture', label: 'Architecture' },
    { href: '/docs/sync', label: 'Sync Operations' },
    { href: '/docs/security', label: 'Security' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 py-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-md p-4 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

