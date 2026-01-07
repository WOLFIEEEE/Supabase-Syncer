/**
 * Client-side CSRF Token Utility
 * 
 * Provides utilities for managing CSRF tokens in client-side code.
 * Works with the server-side csrf-protection.ts service.
 */

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_STORAGE_KEY = 'csrf_token';

// In-memory cache for the CSRF token
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

// Token validity period (23 hours to refresh before server expires at 24h)
const TOKEN_VALIDITY_MS = 23 * 60 * 60 * 1000;

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
    
    if (stored && storedExpiry && now < parseInt(storedExpiry, 10)) {
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
    
    if (!token) {
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
    console.error('Failed to refresh CSRF token:', error);
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
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Only add CSRF token for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfHeaders = await getCSRFHeaders();
    
    options.headers = {
      ...options.headers,
      ...csrfHeaders,
    };
  }
  
  // Always include credentials for cookies
  options.credentials = options.credentials || 'include';
  
  return fetch(url, options);
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
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
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
    console.warn('Failed to initialize CSRF token:', error);
  }
}

