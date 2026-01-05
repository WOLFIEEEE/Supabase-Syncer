import { NextResponse } from 'next/server';

export async function GET() {
  const version = {
    version: process.env.npm_package_version || '0.1.0',
    build: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
    releaseDate: '2024-01-01T00:00:00Z',
    changelog: [
      {
        version: '0.1.0',
        date: '2024-01-01',
        changes: [
          'Initial release',
          'Database synchronization between Supabase environments',
          'Schema validation and migration generation',
          'Keep-alive service for free tier databases',
          'Data explorer dashboard',
          'Real-time sync job monitoring',
        ],
      },
    ],
  };

  return NextResponse.json(version, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

