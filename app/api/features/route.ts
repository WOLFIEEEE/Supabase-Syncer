import { NextResponse } from 'next/server';

export async function GET() {
  const features = {
    features: [
      {
        id: 'database-sync',
        name: 'Database Synchronization',
        description: 'Synchronize data between Supabase databases with one-click sync. Supports one-way sync with UPSERT operations.',
        category: 'core',
      },
      {
        id: 'schema-validation',
        name: 'Schema Validation',
        description: 'Automatic schema comparison with critical issue detection before any sync operation.',
        category: 'core',
      },
      {
        id: 'migration-generator',
        name: 'Migration Generator',
        description: 'Auto-generate idempotent SQL scripts to fix schema differences automatically.',
        category: 'core',
      },
      {
        id: 'real-time-execution',
        name: 'Real-time Execution',
        description: 'Execute migrations directly from the UI with production safety confirmations.',
        category: 'core',
      },
      {
        id: 'keep-alive',
        name: 'Keep-Alive Service',
        description: 'Prevent Supabase free tier databases from pausing due to inactivity with automated health checks.',
        category: 'monitoring',
      },
      {
        id: 'encrypted-storage',
        name: 'Encrypted Connection Storage',
        description: 'Database URLs encrypted with AES-256-GCM before storage for maximum security.',
        category: 'security',
      },
      {
        id: 'production-safeguards',
        name: 'Production Safeguards',
        description: 'Extra confirmation required when modifying production databases. Dry-run previews and breaking change warnings.',
        category: 'security',
      },
      {
        id: 'schema-comparison',
        name: 'Schema Comparison',
        description: 'Compare table structures, columns, indexes, constraints, and ENUM types between databases.',
        category: 'core',
      },
      {
        id: 'data-explorer',
        name: 'Data Explorer',
        description: 'Browse and manage database tables with read/write operations. Clean admin dashboard interface.',
        category: 'core',
      },
      {
        id: 'sync-monitoring',
        name: 'Sync Job Monitoring',
        description: 'Real-time progress tracking, detailed logging, and status updates for ongoing synchronization tasks.',
        category: 'monitoring',
      },
    ],
    categories: ['core', 'security', 'monitoring'],
  };

  return NextResponse.json(features, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}




