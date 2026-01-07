/**
 * Enhanced Error Handling Service
 * 
 * Provides:
 * - Automatic error sanitization
 * - Structured error responses
 * - Error codes for client handling
 * - Request ID correlation
 * - Safe error messages for production
 */

import { NextResponse } from 'next/server';
import { logger, generateRequestId } from './logger';
import { sanitizeErrorMessage } from './security-utils';

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication errors (1xxx)
  AUTH_REQUIRED: 'E1001',
  AUTH_INVALID: 'E1002',
  AUTH_EXPIRED: 'E1003',
  
  // Authorization errors (2xxx)
  FORBIDDEN: 'E2001',
  RESOURCE_NOT_FOUND: 'E2002',
  RATE_LIMITED: 'E2003',
  
  // Validation errors (3xxx)
  VALIDATION_FAILED: 'E3001',
  INVALID_INPUT: 'E3002',
  MISSING_FIELD: 'E3003',
  INVALID_FORMAT: 'E3004',
  
  // Security errors (4xxx)
  CSRF_FAILED: 'E4001',
  BODY_TOO_LARGE: 'E4002',
  SQL_INJECTION: 'E4003',
  
  // Server errors (5xxx)
  INTERNAL_ERROR: 'E5001',
  DATABASE_ERROR: 'E5002',
  EXTERNAL_SERVICE_ERROR: 'E5003',
  TIMEOUT: 'E5004',
  
  // Business logic errors (6xxx)
  OPERATION_FAILED: 'E6001',
  CONFLICT: 'E6002',
  LIMIT_EXCEEDED: 'E6003',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// ERROR RESPONSE INTERFACE
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
  details?: string;
  requestId?: string;
  recovery?: string;
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

// Production-safe error messages (don't expose internals)
const SAFE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  E1001: 'Authentication required. Please log in to continue.',
  E1002: 'Invalid authentication credentials.',
  E1003: 'Your session has expired. Please log in again.',
  E2001: 'You do not have permission to perform this action.',
  E2002: 'The requested resource was not found.',
  E2003: 'Too many requests. Please slow down and try again.',
  E3001: 'Validation failed. Please check your input.',
  E3002: 'Invalid input provided.',
  E3003: 'Required field is missing.',
  E3004: 'Input format is invalid.',
  E4001: 'Security validation failed. Please refresh the page and try again.',
  E4002: 'Request payload is too large.',
  E4003: 'Invalid characters detected in input.',
  E5001: 'An unexpected error occurred. Please try again later.',
  E5002: 'Database operation failed. Please try again.',
  E5003: 'External service is unavailable. Please try again later.',
  E5004: 'Operation timed out. Please try again.',
  E6001: 'Operation could not be completed.',
  E6002: 'A conflict occurred. Please refresh and try again.',
  E6003: 'Limit exceeded. Please upgrade or contact support.',
};

// Recovery suggestions for common errors
const RECOVERY_SUGGESTIONS: Partial<Record<ErrorCode, string>> = {
  E1001: 'Click the login button in the navigation bar.',
  E1003: 'Your session has expired after 30 minutes of inactivity.',
  E2003: 'Wait a few seconds before making another request.',
  E4001: 'This usually happens when a page is open for too long.',
  E5001: 'If the problem persists, please contact support.',
  E5002: 'Check your database connection and try again.',
};

// ============================================================================
// ERROR RESPONSE FACTORY
// ============================================================================

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  options?: {
    message?: string;
    details?: string;
    status?: number;
    requestId?: string;
    includeRecovery?: boolean;
    logError?: Error;
    logContext?: Record<string, unknown>;
  }
): NextResponse<ErrorResponse> {
  const {
    message,
    details,
    status = getStatusForCode(code),
    requestId = generateRequestId(),
    includeRecovery = true,
    logError,
    logContext,
  } = options || {};
  
  // Use production-safe message or custom message
  const safeMessage = message 
    ? sanitizeErrorMessage(message)
    : SAFE_ERROR_MESSAGES[code];
  
  // Build response
  const response: ErrorResponse = {
    success: false,
    error: safeMessage,
    code,
    requestId,
  };
  
  // Add details if provided (sanitized)
  if (details) {
    response.details = sanitizeErrorMessage(details);
  }
  
  // Add recovery suggestion
  if (includeRecovery && RECOVERY_SUGGESTIONS[code]) {
    response.recovery = RECOVERY_SUGGESTIONS[code];
  }
  
  // Log the error server-side
  if (logError || logContext) {
    logger.error(`API Error [${code}]: ${safeMessage}`, logError, {
      requestId,
      errorCode: code,
      ...logContext,
    });
  }
  
  return NextResponse.json(response, { 
    status,
    headers: {
      'X-Request-ID': requestId,
      'X-Error-Code': code,
    },
  });
}

/**
 * Get HTTP status code for error code
 */
function getStatusForCode(code: ErrorCode): number {
  const prefix = code.substring(1, 2);
  
  switch (prefix) {
    case '1': return 401; // Auth errors
    case '2': return code === 'E2003' ? 429 : 403; // Authorization/rate limit
    case '3': return 400; // Validation errors
    case '4': return code === 'E4002' ? 413 : 403; // Security errors
    case '5': return 500; // Server errors
    case '6': return code === 'E6002' ? 409 : 422; // Business logic errors
    default: return 500;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create authentication required error
 */
export function authRequiredError(requestId?: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ERROR_CODES.AUTH_REQUIRED, { requestId });
}

/**
 * Create forbidden error
 */
export function forbiddenError(message?: string, requestId?: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ERROR_CODES.FORBIDDEN, { message, requestId });
}

/**
 * Create not found error
 */
export function notFoundError(resource?: string, requestId?: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ERROR_CODES.RESOURCE_NOT_FOUND, { 
    message: resource ? `${resource} not found` : undefined,
    requestId,
  });
}

/**
 * Create rate limit error
 */
export function rateLimitError(retryAfter?: number, requestId?: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ERROR_CODES.RATE_LIMITED, { 
    requestId,
    details: retryAfter ? `Try again in ${retryAfter} seconds` : undefined,
  });
}

/**
 * Create validation error
 */
export function validationError(errors: string[], requestId?: string): NextResponse<ErrorResponse> {
  return createErrorResponse(ERROR_CODES.VALIDATION_FAILED, { 
    requestId,
    details: errors.join(', '),
  });
}

/**
 * Create internal error
 */
export function internalError(
  error: Error, 
  context?: Record<string, unknown>,
  requestId?: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, { 
    requestId,
    logError: error,
    logContext: context,
  });
}

// ============================================================================
// ERROR WRAPPER
// ============================================================================

/**
 * Wrap an API handler with automatic error handling
 */
export function withErrorHandling<T>(
  handler: (requestId: string) => Promise<NextResponse<T>>
): () => Promise<NextResponse<T | ErrorResponse>> {
  return async () => {
    const requestId = generateRequestId();
    
    try {
      return await handler(requestId);
    } catch (error) {
      // Log the error
      logger.error('Unhandled API error', error instanceof Error ? error : undefined, {
        requestId,
      });
      
      // Determine error type and respond appropriately
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          return authRequiredError(requestId);
        }
        
        if (error.message.includes('not found')) {
          return notFoundError(undefined, requestId);
        }
        
        if (error.message.includes('timeout')) {
          return createErrorResponse(ERROR_CODES.TIMEOUT, { requestId, logError: error });
        }
      }
      
      // Default to internal error
      return internalError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        requestId
      );
    }
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a response is an error response
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ErrorResponse).success === false
  );
}

