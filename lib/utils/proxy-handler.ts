/**
 * Proxy Handler Utility
 * 
 * Helper functions for converting Next.js API routes to proxies
 * that forward requests to the backend server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendRequest, backendStream, BackendError } from './backend-client';

/**
 * Get the user token from Supabase session
 */
async function getUserToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Get user from Supabase
 */
async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Create a proxy handler for GET requests
 */
export function createProxyGET(backendPath: string | ((req: NextRequest) => string)) {
  return async function handler(request: NextRequest) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    try {
      const path = typeof backendPath === 'function' ? backendPath(request) : backendPath;
      
      // Forward query parameters
      const url = new URL(request.url);
      const queryString = url.search;
      const fullPath = queryString ? `${path}${queryString}` : path;
      
      const result = await backendRequest({
        method: 'GET',
        path: fullPath,
        userToken: token,
      });
      
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof BackendError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Backend request failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a proxy handler for POST requests
 */
export function createProxyPOST(backendPath: string | ((req: NextRequest) => string)) {
  return async function handler(request: NextRequest) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    try {
      const path = typeof backendPath === 'function' ? backendPath(request) : backendPath;
      
      let body: unknown = undefined;
      try {
        body = await request.json();
      } catch {
        // No body or invalid JSON
      }
      
      const result = await backendRequest({
        method: 'POST',
        path,
        body,
        userToken: token,
      });
      
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof BackendError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Backend request failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a proxy handler for PUT requests
 */
export function createProxyPUT(backendPath: string | ((req: NextRequest) => string)) {
  return async function handler(request: NextRequest) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    try {
      const path = typeof backendPath === 'function' ? backendPath(request) : backendPath;
      
      let body: unknown = undefined;
      try {
        body = await request.json();
      } catch {
        // No body or invalid JSON
      }
      
      const result = await backendRequest({
        method: 'PUT',
        path,
        body,
        userToken: token,
      });
      
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof BackendError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Backend request failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a proxy handler for DELETE requests
 */
export function createProxyDELETE(backendPath: string | ((req: NextRequest) => string)) {
  return async function handler(request: NextRequest) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    try {
      const path = typeof backendPath === 'function' ? backendPath(request) : backendPath;
      
      const result = await backendRequest({
        method: 'DELETE',
        path,
        userToken: token,
      });
      
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof BackendError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Backend request failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a proxy handler for streaming responses (SSE)
 */
export function createProxyStream(backendPath: string | ((req: NextRequest) => string)) {
  return async function handler(request: NextRequest) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    try {
      const path = typeof backendPath === 'function' ? backendPath(request) : backendPath;
      
      let body: unknown = undefined;
      if (request.method === 'POST') {
        try {
          body = await request.json();
        } catch {
          // No body or invalid JSON
        }
      }
      
      const stream = await backendStream({
        method: request.method === 'POST' ? 'POST' : 'GET',
        path,
        body,
        userToken: token,
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      if (error instanceof BackendError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Backend stream failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to extract dynamic route parameters
 */
export function getRouteParams(request: NextRequest, pattern: string): Record<string, string> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  
  const params: Record<string, string> = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = pathParts[i] || '';
    }
  }
  
  return params;
}

