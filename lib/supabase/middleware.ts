import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Timeout for Supabase auth calls (5 seconds)
const AUTH_TIMEOUT_MS = 5000;

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise<T>(ms: number): Promise<T> {
  return new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

export async function updateSession(request: NextRequest) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If Supabase is not configured, allow access to all routes
  // This enables the app to work in development without Supabase setup
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured. Authentication is disabled.');
    return NextResponse.next({ request });
  }
  
  // Early return for static files to avoid unnecessary Supabase calls
  const isStaticFile =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/public') ||
    request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/i);
  
  if (isStaticFile) {
    return NextResponse.next({ request });
  }
  
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Add timeout protection to prevent gateway timeouts
  let user = null;
  try {
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = createTimeoutPromise<never>(AUTH_TIMEOUT_MS);
    
    const result = await Promise.race([getUserPromise, timeoutPromise]);
    user = result?.data?.user || null;
  } catch (error) {
    // If Supabase is slow or unreachable, log but don't block the request
    // Allow public routes to continue, but require auth for protected routes
    console.error('[Middleware] Supabase auth check failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // For public routes, allow access even if auth check fails
    const publicRoutes = [
      '/login',
      '/signup',
      '/auth/callback',
      '/auth/confirm',
      '/forgot-password',
      '/reset-password',
      '/',
      '/guide',
      '/status',
      '/docs',
    ];
    
    const isPublicRoute = publicRoutes.some(
      (route) => request.nextUrl.pathname.startsWith(route)
    );
    
    const isPublicApiRoute = 
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname === '/api/status' ||
      request.nextUrl.pathname === '/api/health' ||
      request.nextUrl.pathname === '/api/version' ||
      request.nextUrl.pathname === '/api/features' ||
      request.nextUrl.pathname === '/api/docs';
    
    // If it's a public route, allow access
    if (isPublicRoute || isPublicApiRoute) {
      return supabaseResponse;
    }
    
    // For protected routes, if auth check fails, redirect to login
    // This prevents unauthorized access when Supabase is down
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      url.searchParams.set('error', 'auth_timeout');
      return NextResponse.redirect(url);
    }
    
    // For API routes, return 503 (Service Unavailable) instead of timing out
    return NextResponse.json(
      { success: false, error: 'Authentication service temporarily unavailable' },
      { status: 503 }
    );
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth/callback',
    '/auth/confirm',
    '/forgot-password',
    '/reset-password',
    '/',
    '/guide',
    '/status',
    '/docs', // Documentation is public
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname.startsWith(route)
  );

  // Allow public API routes
  const isPublicApiRoute = 
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/api/status' ||
    request.nextUrl.pathname === '/api/health' ||
    request.nextUrl.pathname === '/api/version' ||
    request.nextUrl.pathname === '/api/features' ||
    request.nextUrl.pathname === '/api/docs';

  // Static files already handled above

  if (!user && !isPublicRoute && !isPublicApiRoute) {
    // Redirect to login for page requests
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    // Return 401 for API requests
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

