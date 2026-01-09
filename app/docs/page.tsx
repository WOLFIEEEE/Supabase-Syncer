/**
 * Developer Documentation Hub
 * 
 * Main documentation page with navigation to all documentation sections
 */

'use client';

import Link from 'next/link';
import { Box, Container, Heading, Text, SimpleGrid, VStack, HStack, UnorderedList, ListItem } from '@chakra-ui/react';

export default function DocsPage() {
  const docSections = [
    {
      title: 'Getting Started',
      description: 'Quick start guide and installation instructions',
      href: '/docs/getting-started',
      icon: '🚀',
      color: 'bg-blue-500'
    },
    {
      title: 'API Reference',
      description: 'Complete API endpoint documentation with examples',
      href: '/docs/api',
      icon: '📡',
      color: 'bg-green-500'
    },
    {
      title: 'Database Schema',
      description: 'Database tables, relationships, and migrations',
      href: '/docs/database',
      icon: '🗄️',
      color: 'bg-purple-500'
    },
    {
      title: 'Authentication',
      description: 'Auth flow, sessions, and security features',
      href: '/docs/authentication',
      icon: '🔐',
      color: 'bg-red-500'
    },
    {
      title: 'Admin Features',
      description: 'Admin dashboard, logging, and monitoring',
      href: '/docs/admin',
      icon: '👨‍💼',
      color: 'bg-orange-500'
    },
    {
      title: 'Architecture',
      description: 'System architecture and design patterns',
      href: '/docs/architecture',
      icon: '🏗️',
      color: 'bg-indigo-500'
    },
    {
      title: 'Sync Operations',
      description: 'Database synchronization features and workflows',
      href: '/docs/sync',
      icon: '🔄',
      color: 'bg-teal-500'
    },
    {
      title: 'Security',
      description: 'Security features, encryption, and best practices',
      href: '/docs/security',
      icon: '🛡️',
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Developer Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guide to Supabase Syncer API, features, and architecture.
            Everything you need to integrate and extend the platform.
          </p>
        </div>

        {/* Documentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {docSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 p-6 border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`${section.color} text-white rounded-lg p-3 text-2xl flex-shrink-0`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">API Endpoints</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><Link href="/docs/api#health" className="hover:text-blue-600">Health Check</Link></li>
                <li><Link href="/docs/api#connections" className="hover:text-blue-600">Connections API</Link></li>
                <li><Link href="/docs/api#sync" className="hover:text-blue-600">Sync Operations</Link></li>
                <li><Link href="/docs/api#explorer" className="hover:text-blue-600">Data Explorer</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Resources</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><a href="/api/docs" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">API JSON Schema</a></li>
                <li><a href="https://github.com/WOLFIEEEE/Supabase-Syncer" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">GitHub Repository</a></li>
                <li><Link href="/docs/database#migrations" className="hover:text-blue-600">Database Migrations</Link></li>
                <li><Link href="/docs/security#encryption" className="hover:text-blue-600">Encryption Guide</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

