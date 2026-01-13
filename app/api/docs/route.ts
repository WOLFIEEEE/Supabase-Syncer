/**
 * API Documentation Endpoint
 * 
 * Returns API documentation in JSON or OpenAPI format.
 * 
 * Query params:
 * - format=openapi - Returns full OpenAPI spec
 * - format=json (default) - Returns simplified JSON docs
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export const dynamic = 'force-dynamic';

// Simplified API documentation
const apiDocs = {
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://suparbase.com',
  documentation: '/api/docs?format=openapi',
  endpoints: {
    health: {
      '/health': {
        method: 'GET',
        description: 'Health check with detailed system metrics',
        authentication: false,
      },
      '/backend-health': {
        method: 'GET',
        description: 'Backend server health check',
        authentication: false,
      },
      '/status': {
        method: 'GET',
        description: 'System status and statistics',
        authentication: false,
      },
    },
    connections: {
      '/connections': {
        methods: ['GET', 'POST'],
        description: 'List or create database connections',
        authentication: true,
      },
      '/connections/{id}': {
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage a specific connection',
        authentication: true,
      },
      '/connections/{id}/test': {
        method: 'POST',
        description: 'Test connection connectivity',
        authentication: true,
      },
      '/connections/{id}/schema': {
        method: 'GET',
        description: 'Get database schema',
        authentication: true,
      },
      '/connections/{id}/execute': {
        method: 'POST',
        description: 'Execute SQL query',
        authentication: true,
      },
    },
    sync: {
      '/sync': {
        methods: ['GET', 'POST'],
        description: 'List or create sync jobs',
        authentication: true,
      },
      '/sync/{id}': {
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Manage a specific sync job',
        authentication: true,
      },
      '/sync/{id}/start': {
        method: 'POST',
        description: 'Start sync job',
        authentication: true,
      },
      '/sync/{id}/stop': {
        method: 'POST',
        description: 'Stop sync job',
        authentication: true,
      },
      '/sync/{id}/pause': {
        method: 'POST',
        description: 'Pause sync job',
        authentication: true,
      },
      '/sync/{id}/stream': {
        method: 'GET',
        description: 'Stream sync progress (SSE)',
        authentication: true,
      },
      '/sync/validate': {
        method: 'POST',
        description: 'Validate sync configuration',
        authentication: true,
      },
      '/sync/generate-migration': {
        method: 'POST',
        description: 'Generate migration SQL',
        authentication: true,
      },
    },
    explorer: {
      '/explorer/{connectionId}/tables': {
        method: 'GET',
        description: 'List database tables',
        authentication: true,
      },
      '/explorer/{connectionId}/{table}/rows': {
        method: 'GET',
        description: 'Get table rows (paginated)',
        authentication: true,
      },
      '/explorer/{connectionId}/{table}/row': {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Manage individual rows',
        authentication: true,
      },
    },
    admin: {
      '/admin/users': {
        method: 'GET',
        description: 'List all users (admin only)',
        authentication: true,
        adminOnly: true,
      },
      '/admin/sync-jobs': {
        method: 'GET',
        description: 'List all sync jobs (admin only)',
        authentication: true,
        adminOnly: true,
      },
      '/admin/analytics': {
        method: 'GET',
        description: 'System analytics (admin only)',
        authentication: true,
        adminOnly: true,
      },
      '/admin/security-events': {
        method: 'GET',
        description: 'Security events (admin only)',
        authentication: true,
        adminOnly: true,
      },
    },
    other: {
      '/features': {
        method: 'GET',
        description: 'Feature flags and capabilities',
        authentication: false,
      },
      '/version': {
        method: 'GET',
        description: 'Version information',
        authentication: false,
      },
      '/usage': {
        method: 'GET',
        description: 'Usage statistics',
        authentication: true,
      },
      '/csrf': {
        method: 'GET',
        description: 'Get CSRF token',
        authentication: true,
      },
    },
  },
  authentication: {
    type: 'Bearer Token',
    description: 'Most endpoints require authentication via Supabase Auth. Include the access token in the Authorization header.',
    header: 'Authorization: Bearer <token>',
  },
  rateLimit: {
    description: 'API requests are rate limited per user.',
    limits: {
      read: '100 requests/minute',
      write: '20 requests/minute',
      sync: '10 requests/minute',
    },
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');

  // Return OpenAPI spec if requested
  if (format === 'openapi') {
    try {
      const openApiPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
      const openApiContent = fs.readFileSync(openApiPath, 'utf-8');
      const openApiSpec = yaml.parse(openApiContent);
      
      return NextResponse.json(openApiSpec, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'OpenAPI spec not available' },
        { status: 500 }
      );
    }
  }

  // Return simplified JSON docs
  return NextResponse.json(apiDocs, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
