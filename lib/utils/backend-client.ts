/**
 * Backend Client
 * 
 * HTTP client for making authenticated requests to the backend server.
 * Features:
 * - Shared secret authentication
 * - User token forwarding
 * - Request timeout handling
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 */

// Configuration
// Use NEXT_PUBLIC_BACKEND_URL for client-side (browser) requests
// Use BACKEND_URL for server-side (API routes) requests
const BACKEND_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001')
  : (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
const SHARED_SECRET = process.env.BACKEND_SHARED_SECRET;
const DEFAULT_TIMEOUT = 300000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  state: 'closed',
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

/**
 * Custom error class for backend errors
 */
export class BackendError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

/**
 * Request options for backend calls
 */
export interface BackendRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  userToken: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Check and update circuit breaker state
 */
function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  if (circuitBreaker.state === 'open') {
    // Check if timeout has passed
    if (now - circuitBreaker.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreaker.state = 'half-open';
      return true; // Allow one request to test
    }
    return false; // Circuit is open, reject request
  }
  
  return true; // Circuit is closed or half-open
}

/**
 * Record success for circuit breaker
 */
function recordSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.state = 'closed';
}

/**
 * Record failure for circuit breaker
 */
function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.state = 'open';
    console.warn('[BackendClient] Circuit breaker opened due to repeated failures');
  }
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an authenticated request to the backend
 */
export async function backendRequest<T = unknown>(
  options: BackendRequestOptions
): Promise<T> {
  const {
    method,
    path,
    body,
    userToken,
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    headers = {},
  } = options;
  
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    throw new BackendError(
      'Backend service unavailable (circuit breaker open)',
      503,
      'CIRCUIT_BREAKER_OPEN'
    );
  }
  
  // Validate shared secret
  if (!SHARED_SECRET) {
    throw new BackendError(
      'Backend shared secret not configured',
      500,
      'MISSING_SECRET'
    );
  }
  
  const requestId = crypto.randomUUID();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const url = `${BACKEND_URL}${path}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Backend-Secret': SHARED_SECRET,
          'Authorization': `Bearer ${userToken}`,
          'X-Request-ID': requestId,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        throw new BackendError(
          `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
          429,
          'RATE_LIMITED',
          { retryAfter }
        );
      }
      
      // Parse response
      const data = await response.json().catch(() => ({}));
      
      // Check for errors
      if (!response.ok) {
        throw new BackendError(
          data.error || `Backend request failed with status ${response.status}`,
          response.status,
          data.code,
          data.details
        );
      }
      
      // Record success for circuit breaker
      recordSuccess();
      
      return data as T;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new BackendError(
          `Backend request timed out after ${timeout}ms`,
          504,
          'TIMEOUT'
        );
      } else if (error instanceof BackendError) {
        lastError = error;
        
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      } else if (error instanceof Error) {
        lastError = new BackendError(
          error.message || 'Backend request failed',
          500,
          'FETCH_ERROR'
        );
      } else {
        lastError = new BackendError('Unknown error', 500, 'UNKNOWN');
      }
      
      // Record failure for circuit breaker
      recordFailure();
      
      // Retry with exponential backoff
      if (attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(
          `[BackendClient] Request failed (attempt ${attempt + 1}/${retries + 1}), ` +
          `retrying in ${delay}ms: ${lastError.message}`
        );
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new BackendError('Backend request failed', 500);
}

/**
 * Make a streaming request to the backend (SSE)
 */
export async function backendStream(
  options: Omit<BackendRequestOptions, 'method'> & { method?: 'GET' | 'POST' }
): Promise<ReadableStream> {
  const {
    method = 'GET',
    path,
    body,
    userToken,
    timeout = DEFAULT_TIMEOUT,
    headers = {},
  } = options;
  
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    throw new BackendError(
      'Backend service unavailable (circuit breaker open)',
      503,
      'CIRCUIT_BREAKER_OPEN'
    );
  }
  
  if (!SHARED_SECRET) {
    throw new BackendError(
      'Backend shared secret not configured',
      500,
      'MISSING_SECRET'
    );
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `${BACKEND_URL}${path}`;
    const requestId = crypto.randomUUID();
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Backend-Secret': SHARED_SECRET,
        'Authorization': `Bearer ${userToken}`,
        'X-Request-ID': requestId,
        'Accept': 'text/event-stream',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new BackendError(
        data.error || `Backend stream failed with status ${response.status}`,
        response.status,
        data.code
      );
    }
    
    if (!response.body) {
      throw new BackendError('No response body', 500, 'NO_BODY');
    }
    
    recordSuccess();
    return response.body;
    
  } catch (error) {
    clearTimeout(timeoutId);
    recordFailure();
    
    if (error instanceof BackendError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BackendError(
        `Backend stream timed out after ${timeout}ms`,
        504,
        'TIMEOUT'
      );
    }
    
    throw new BackendError(
      error instanceof Error ? error.message : 'Backend stream failed',
      500,
      'STREAM_ERROR'
    );
  }
}

/**
 * Get backend health status
 */
export async function checkBackendHealth(): Promise<{
  healthy: boolean;
  status?: string;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return {
        healthy: false,
        status: 'unhealthy',
        latency,
        error: `Status ${response.status}`,
      };
    }
    
    const data = await response.json();
    
    return {
      healthy: data.status === 'healthy',
      status: data.status,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      status: 'unreachable',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(): {
  state: string;
  failures: number;
  lastFailure: number | null;
} {
  return {
    state: circuitBreaker.state,
    failures: circuitBreaker.failures,
    lastFailure: circuitBreaker.lastFailure || null,
  };
}

/**
 * Reset circuit breaker (for testing/recovery)
 */
export function resetCircuitBreaker(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailure = 0;
  circuitBreaker.state = 'closed';
}

