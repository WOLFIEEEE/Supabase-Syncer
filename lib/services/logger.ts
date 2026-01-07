/**
 * Structured Logging Service
 * 
 * Provides consistent, structured logging with:
 * - Log levels (debug, info, warn, error)
 * - Automatic sensitive data redaction
 * - Request ID tracking
 * - JSON format for log aggregation
 * - Context preservation
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level (configurable via environment)
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// ============================================================================
// SENSITIVE DATA PATTERNS
// ============================================================================

const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string | ((match: string, ...args: string[]) => string) }> = [
  // PostgreSQL connection URLs
  { 
    pattern: /postgres(ql)?:\/\/([^:]+):([^@]+)@/gi, 
    replacement: 'postgres://$2:[REDACTED]@' 
  },
  // Generic passwords in URLs
  { 
    pattern: /:([^:@\/]{8,})@/g, 
    replacement: ':[REDACTED]@' 
  },
  // API keys (common formats)
  { 
    pattern: /(['"]\s*(?:api[_-]?key|apikey|api_secret|secret_key)\s*['"]\s*:\s*['"])([^'"]+)(['"])/gi, 
    replacement: '$1[REDACTED]$3' 
  },
  // Bearer tokens
  { 
    pattern: /(Bearer\s+)[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_=]*\.?[A-Za-z0-9-_.+/=]*/gi, 
    replacement: '$1[REDACTED]' 
  },
  // JWT tokens
  { 
    pattern: /eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/g, 
    replacement: '[REDACTED_JWT]' 
  },
  // Email addresses (partial)
  { 
    pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, 
    replacement: (match: string, user: string, domain: string) => {
      const maskedUser = user.substring(0, 2) + '***';
      return `${maskedUser}@${domain}`;
    }
  },
  // Credit card numbers
  { 
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, 
    replacement: '[REDACTED_CC]' 
  },
  // SSN
  { 
    pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, 
    replacement: '[REDACTED_SSN]' 
  },
];

// Keys that should always be redacted
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'apiKey',
  'authorization',
  'auth',
  'credential',
  'private',
  'privateKey',
  'private_key',
];

// ============================================================================
// REDACTION FUNCTIONS
// ============================================================================

/**
 * Redact sensitive data from a string
 */
function redactString(value: string): string {
  let result = value;
  
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    if (typeof replacement === 'function') {
      result = result.replace(pattern, replacement as (match: string, ...args: string[]) => string);
    } else {
      result = result.replace(pattern, replacement);
    }
  }
  
  return result;
}

/**
 * Redact sensitive data from an object
 */
function redactObject(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 10) return { '[MAX_DEPTH]': 'Object too deep' };
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if key is sensitive
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      result[key] = '[REDACTED]';
      continue;
    }
    
    // Redact based on value type
    if (typeof value === 'string') {
      result[key] = redactString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (typeof item === 'string') return redactString(item);
        if (typeof item === 'object' && item !== null) return redactObject(item as Record<string, unknown>, depth + 1);
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactObject(value as Record<string, unknown>, depth + 1);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Sanitize error stack traces
 */
function sanitizeStack(stack?: string): string | undefined {
  if (!stack) return undefined;
  
  // Remove absolute paths, keep only relative
  let sanitized = stack.replace(/\/[^\s:]+\//g, '/****/');
  
  // Redact any sensitive data in stack
  sanitized = redactString(sanitized);
  
  // Limit stack trace length
  const lines = sanitized.split('\n');
  if (lines.length > 15) {
    return lines.slice(0, 15).join('\n') + '\n    ... (truncated)';
  }
  
  return sanitized;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private context: LogContext = {};
  
  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }
  
  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
  }
  
  /**
   * Format and output log entry
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message: redactString(message),
      timestamp: new Date().toISOString(),
    };
    
    // Merge contexts
    const mergedContext = { ...this.context, ...context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = redactObject(mergedContext);
    }
    
    // Add error if present
    if (error) {
      entry.error = {
        name: error.name,
        message: redactString(error.message),
        stack: sanitizeStack(error.stack),
      };
    }
    
    // Output as JSON in production, pretty print in development
    const output = process.env.NODE_ENV === 'production'
      ? JSON.stringify(entry)
      : JSON.stringify(entry, null, 2);
    
    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }
  
  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
  
  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }
  
  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }
  
  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    const ctx = error instanceof Error ? context : (error as LogContext | undefined);
    this.log('error', message, ctx, err);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const defaultLogger = new Logger();

// ============================================================================
// PUBLIC API
// ============================================================================

export const logger = {
  /**
   * Create a child logger with context
   */
  child: (context: LogContext) => defaultLogger.child(context),
  
  /**
   * Log debug message
   */
  debug: (message: string, context?: LogContext) => defaultLogger.debug(message, context),
  
  /**
   * Log info message
   */
  info: (message: string, context?: LogContext) => defaultLogger.info(message, context),
  
  /**
   * Log warning message
   */
  warn: (message: string, context?: LogContext) => defaultLogger.warn(message, context),
  
  /**
   * Log error message
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => 
    defaultLogger.error(message, error, context),
};

// ============================================================================
// REQUEST LOGGER MIDDLEWARE
// ============================================================================

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a logger for a specific request
 */
export function createRequestLogger(
  requestId: string,
  context?: Partial<LogContext>
): Logger {
  return defaultLogger.child({
    requestId,
    ...context,
  });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { redactString, redactObject };

