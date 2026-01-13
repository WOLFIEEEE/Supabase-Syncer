import { NextResponse } from 'next/server';

export async function GET() {
  const apiDocs = {
    version: '1.0.0',
    baseUrl: 'https://suparbase.com/api',
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        description: 'Health check endpoint for uptime monitoring services',
        authentication: false,
        response: {
          status: 'ok | error',
          timestamp: 'ISO string',
          version: 'string',
          checks: {
            database: 'ok | error',
            auth: 'ok | error',
          },
        },
      },
      {
        path: '/status',
        method: 'GET',
        description: 'Get system status and component health information',
        authentication: false,
        response: {
          success: true,
          data: {
            application: {
              status: 'ok | error',
              version: 'string',
              uptime: 'string',
            },
            database: {
              status: 'connected | not_configured | error',
              message: 'string',
              type: 'string',
            },
            connections: {
              total: 'number',
              production: 'number',
              development: 'number',
            },
          },
        },
      },
      {
        path: '/features',
        method: 'GET',
        description: 'Get a machine-readable list of all features',
        authentication: false,
        response: {
          features: [
            {
              id: 'string',
              name: 'string',
              description: 'string',
              category: 'string',
            },
          ],
          categories: ['string'],
        },
      },
      {
        path: '/version',
        method: 'GET',
        description: 'Get version information and changelog',
        authentication: false,
        response: {
          version: 'string',
          build: 'string',
          releaseDate: 'ISO string',
          changelog: ['string'],
        },
      },
      {
        path: '/connections',
        method: 'GET',
        description: 'List all database connections (requires authentication)',
        authentication: true,
      },
      {
        path: '/connections',
        method: 'POST',
        description: 'Create a new database connection (requires authentication)',
        authentication: true,
      },
      {
        path: '/connections/[id]/schema',
        method: 'GET',
        description: 'Get full schema for a connection (requires authentication)',
        authentication: true,
      },
      {
        path: '/sync/validate',
        method: 'POST',
        description: 'Validate schema compatibility between two connections (requires authentication)',
        authentication: true,
      },
      {
        path: '/sync/generate-migration',
        method: 'POST',
        description: 'Generate SQL migration script (requires authentication)',
        authentication: true,
      },
      {
        path: '/connections/[id]/execute',
        method: 'POST',
        description: 'Execute SQL on a connection (requires authentication, production confirmation)',
        authentication: true,
      },
    ],
    authentication: {
      type: 'Supabase Auth',
      description: 'Most endpoints require authentication via Supabase. Use session cookies or Bearer token.',
    },
  };

  return NextResponse.json(apiDocs, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}




