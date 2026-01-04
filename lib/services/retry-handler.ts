/**
 * Retry Handler Service
 * 
 * Provides retry logic with exponential backoff for async operations.
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.multiplier, attempt);
  const delay = Math.min(exponentialDelay, config.maxDelay);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retryable errors
    const retryable = [
      'timeout',
      'connection reset',
      'econnreset',
      'econnrefused',
      'etimedout',
      'network',
      'socket',
      'temporarily unavailable',
      'too many connections',
      'connection pool',
    ];
    return retryable.some(pattern => message.includes(pattern));
  }
  return false;
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = fullConfig.retryCondition 
        ? fullConfig.retryCondition(error)
        : isRetryableError(error);
      
      if (!shouldRetry || attempt >= fullConfig.maxRetries) {
        throw error;
      }
      
      const delay = calculateDelay(attempt, fullConfig);
      
      // Notify about retry
      fullConfig.onRetry?.(error, attempt + 1, delay);
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutError || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute with both retry and timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  options: {
    timeoutMs: number;
    retryConfig?: Partial<RetryConfig>;
  }
): Promise<T> {
  return withRetry(
    () => withTimeout(fn, options.timeoutMs),
    options.retryConfig
  );
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a circuit breaker for a function
 * Prevents calling a failing function repeatedly
 */
export function createCircuitBreaker<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  options: {
    failureThreshold: number;
    resetTimeout: number;
  } = { failureThreshold: 5, resetTimeout: 60000 }
) {
  let failures = 0;
  let lastFailure: number | null = null;
  let isOpen = false;
  
  return async (...args: Args): Promise<T> => {
    // Check if circuit should be reset
    if (isOpen && lastFailure && Date.now() - lastFailure > options.resetTimeout) {
      isOpen = false;
      failures = 0;
    }
    
    // Reject if circuit is open
    if (isOpen) {
      throw new Error('Circuit breaker is open - too many failures');
    }
    
    try {
      const result = await fn(...args);
      failures = 0;
      return result;
    } catch (error) {
      failures++;
      lastFailure = Date.now();
      
      if (failures >= options.failureThreshold) {
        isOpen = true;
      }
      
      throw error;
    }
  };
}

/**
 * Batch operations with concurrency limit
 */
export async function batchWithLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Retry with progressive delay for sync operations
 */
export async function retrySyncOperation<T>(
  fn: () => Promise<T>,
  options: {
    operationName: string;
    maxRetries?: number;
    onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;
  }
): Promise<T> {
  const { operationName, maxRetries = 3, onLog } = options;
  
  return withRetry(fn, {
    maxRetries,
    initialDelay: 2000,
    maxDelay: 30000,
    multiplier: 2,
    onRetry: (error, attempt, delay) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onLog?.('warn', `${operationName} failed (attempt ${attempt}/${maxRetries}): ${message}. Retrying in ${delay}ms...`);
    },
  });
}

