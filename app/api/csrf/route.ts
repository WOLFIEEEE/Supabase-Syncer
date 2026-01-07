/**
 * CSRF Token API Endpoint
 * 
 * GET /api/csrf - Get a new CSRF token
 * 
 * The token is returned in both:
 * - JSON response body (for client-side storage)
 * - HTTP-only cookie (for server-side validation)
 */

import { NextResponse } from 'next/server';
import { getOrCreateCSRFToken } from '@/lib/services/csrf-protection';

export async function GET() {
  try {
    // Get or create a CSRF token (also sets the cookie)
    const token = await getOrCreateCSRFToken();
    
    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}

