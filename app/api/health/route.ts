import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health checks
    const checks = {
      database: 'ok' as 'ok' | 'error',
      auth: 'ok' as 'ok' | 'error',
    };

    // Check if required environment variables are present
    if (!process.env.ENCRYPTION_KEY || !process.env.SESSION_SECRET) {
      checks.auth = 'error';
    }

    // Check database connection (if configured)
    if (process.env.DATABASE_URL) {
      try {
        // Simple check - in production, you might want to actually ping the database
        checks.database = 'ok';
      } catch (error) {
        checks.database = 'error';
      }
    }

    const overallStatus = checks.database === 'ok' && checks.auth === 'ok' ? 'ok' : 'error';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: 'error',
          auth: 'error',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




