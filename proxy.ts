import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { validateBodySize, createBodySizeLimitResponse, getLimitTypeForPath } from '@/lib/middleware/body-size-limit';

// ============================================================================
// SECURITY HEADERS CONFIGURATION
// ============================================================================

const securityHeaders = {
  // Content Security Policy - Prevents XSS attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
  
  // Strict Transport Security - Forces HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy - Restrict browser features
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
  
  // XSS Protection (legacy, but still useful for older browsers)
  'X-XSS-Protection': '0',
  
  // Prevent DNS prefetching
  'X-DNS-Prefetch-Control': 'off',
  
  // Download options for IE
  'X-Download-Options': 'noopen',
  
  // Permitted cross-domain policies
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

export default async function proxy(request: NextRequest) {
  // SECURITY: Check body size for API requests with body
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    const limitType = getLimitTypeForPath(request.nextUrl.pathname);
    const bodyValidation = validateBodySize(request, limitType);
    
    if (!bodyValidation.valid) {
      const response = createBodySizeLimitResponse(
        bodyValidation.contentLength,
        bodyValidation.limit
      );
      return applySecurityHeaders(response);
    }
  }
  
  // Update Supabase session and get response
  const response = await updateSession(request);
  
  // Apply security headers to all responses
  return applySecurityHeaders(response);
}

// ============================================================================
// ROUTE MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
