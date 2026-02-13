/**
 * Client-side CSRF Token Utility
 *
 * Provides utilities for managing CSRF tokens in client-side code.
 * Works with the server-side csrf-protection.ts service.
 */

import { logger } from '@/lib/services/logger';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_STORAGE_KEY = 'csrf_token';
const CSRF_ERROR_HEADER = 'x-csrf-error';

// In-memory cache for the CSRF token
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

// Token validity period (23 hours to refresh before server expires at 24h)
const TOKEN_VALIDITY_MS = 23 * 60 * 60 * 1000;

function isMutatingMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function isValidTokenFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Get the current CSRF token from cache or fetch a new one
 */
export async function getCSRFToken(): Promise<string> {
  // Check if we have a valid cached token
  const now = Date.now();
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    return cachedToken;
  }
  
  // Try to get from session storage first
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
    const storedExpiry = sessionStorage.getItem(`${CSRF_STORAGE_KEY}_expiry`);
    
    if (
      stored &&
      isValidTokenFormat(stored) &&
      storedExpiry &&
      now < parseInt(storedExpiry, 10)
    ) {
      cachedToken = stored;
      tokenExpiresAt = parseInt(storedExpiry, 10);
      return stored;
    }
  }
  
  // Fetch a new token from the server
  return refreshCSRFToken();
}

/**
 * Refresh the CSRF token from the server
 */
export async function refreshCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    const data = await response.json();
    const token = data.token;
    
    if (!token || !isValidTokenFormat(token)) {
      throw new Error('No token in response');
    }
    
    // Cache the token
    cachedToken = token;
    tokenExpiresAt = Date.now() + TOKEN_VALIDITY_MS;
    
    // Store in session storage for persistence across page reloads
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
      sessionStorage.setItem(`${CSRF_STORAGE_KEY}_expiry`, tokenExpiresAt.toString());
    }
    
    return token;
  } catch (error) {
    logger.error('Failed to refresh CSRF token', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Clear the cached CSRF token (call on logout)
 */
export function clearCSRFToken(): void {
  cachedToken = null;
  tokenExpiresAt = null;
  
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
    sessionStorage.removeItem(`${CSRF_STORAGE_KEY}_expiry`);
  }
}

/**
 * Get headers with CSRF token for fetch requests
 */
export async function getCSRFHeaders(): Promise<Record<string, string>> {
  const token = await getCSRFToken();
  return {
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Create a fetch wrapper that automatically includes CSRF token
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  const fetchOptions: RequestInit = { ...options };
  
  // Only add CSRF token for state-changing methods
  if (isMutatingMethod(method)) {
    const csrfHeaders = await getCSRFHeaders();
    
    fetchOptions.headers = {
      ...fetchOptions.headers,
      ...csrfHeaders,
    };
  }
  
  // Always include credentials for cookies
  fetchOptions.credentials = fetchOptions.credentials || 'include';
  
  const response = await fetch(url, fetchOptions);

  // Retry once with a fresh token if server reports CSRF validation failure.
  if (
    !isRetry &&
    isMutatingMethod(method) &&
    response.status === 403 &&
    response.headers.get(CSRF_ERROR_HEADER)
  ) {
    clearCSRFToken();
    await refreshCSRFToken();
    return csrfFetch(url, options, true);
  }

  return response;
}

/**
 * Enhanced fetch that includes both CSRF token and JSON content type
 */
export async function apiRequest<T>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  
  const fetchOptions: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  };
  
  // Add CSRF token for state-changing methods
  if (isMutatingMethod(method)) {
    const csrfHeaders = await getCSRFHeaders();
    fetchOptions.headers = {
      ...fetchOptions.headers,
      ...csrfHeaders,
    };
  }
  
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * Hook to initialize CSRF token on app load
 * Call this early in your app initialization
 */
export async function initializeCSRF(): Promise<void> {
  try {
    await getCSRFToken();
  } catch (error) {
    logger.warn('Failed to initialize CSRF token', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
