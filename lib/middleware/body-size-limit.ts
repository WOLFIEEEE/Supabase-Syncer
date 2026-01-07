/**
 * Request Body Size Limit Middleware
 * 
 * Validates request body size before processing to prevent
 * denial-of-service attacks via large payloads.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// SIZE LIMITS BY ENDPOINT TYPE
// ============================================================================

export const SIZE_LIMITS = {
  // Default limit for most endpoints
  default: 100 * 1024, // 100KB
  
  // Connection API (connection strings are small)
  connections: 1 * 1024 * 1024, // 1MB
  
  // Sync API (table configs can be larger)
  sync: 2 * 1024 * 1024, // 2MB
  
  // SQL execution (already limited elsewhere)
  sql: 256 * 1024, // 256KB
  
  // Explorer API (row data)
  explorer: 500 * 1024, // 500KB
  
  // File uploads (if any)
  upload: 10 * 1024 * 1024, // 10MB
} as const;

export type SizeLimitType = keyof typeof SIZE_LIMITS;

// ============================================================================
// BODY SIZE VALIDATION
// ============================================================================

export interface BodySizeValidationResult {
  valid: boolean;
  error?: string;
  contentLength?: number;
  limit?: number;
}

/**
 * Validate request body size from Content-Length header
 */
export function validateBodySize(
  request: NextRequest,
  limitType: SizeLimitType = 'default'
): BodySizeValidationResult {
  const contentLengthHeader = request.headers.get('content-length');
  const limit = SIZE_LIMITS[limitType];
  
  // If no Content-Length header, we'll check later during body parsing
  // This is okay for streaming requests
  if (!contentLengthHeader) {
    return { valid: true };
  }
  
  const contentLength = parseInt(contentLengthHeader, 10);
  
  // Invalid Content-Length header
  if (isNaN(contentLength) || contentLength < 0) {
    return {
      valid: false,
      error: 'Invalid Content-Length header',
    };
  }
  
  // Check against limit
  if (contentLength > limit) {
    return {
      valid: false,
      error: `Request body too large. Maximum size is ${formatBytes(limit)}`,
      contentLength,
      limit,
    };
  }
  
  return {
    valid: true,
    contentLength,
    limit,
  };
}

/**
 * Create error response for oversized body
 */
export function createBodySizeLimitResponse(
  contentLength?: number,
  limit?: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Request body too large',
      details: limit ? `Maximum size is ${formatBytes(limit)}` : undefined,
      received: contentLength ? formatBytes(contentLength) : undefined,
    },
    {
      status: 413, // Payload Too Large
      headers: {
        'X-Max-Content-Length': limit?.toString() || SIZE_LIMITS.default.toString(),
      },
    }
  );
}

/**
 * Middleware wrapper for body size validation
 */
export function withBodySizeLimit<T>(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<T>,
  limitType: SizeLimitType = 'default'
): (request: NextRequest, ...args: unknown[]) => Promise<T | NextResponse> {
  return async (request: NextRequest, ...args: unknown[]) => {
    const validation = validateBodySize(request, limitType);
    
    if (!validation.valid) {
      return createBodySizeLimitResponse(validation.contentLength, validation.limit);
    }
    
    return handler(request, ...args);
  };
}

/**
 * Parse request body with size limit enforcement
 */
export async function parseJSONWithSizeLimit<T>(
  request: NextRequest,
  limitType: SizeLimitType = 'default'
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  const limit = SIZE_LIMITS[limitType];
  
  // First check Content-Length if available
  const validation = validateBodySize(request, limitType);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Request body too large',
      status: 413,
    };
  }
  
  try {
    // Read body as text first to check actual size
    const text = await request.text();
    
    if (text.length > limit) {
      return {
        success: false,
        error: `Request body too large. Maximum size is ${formatBytes(limit)}`,
        status: 413,
      };
    }
    
    // Parse JSON
    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Invalid JSON in request body',
        status: 400,
      };
    }
    
    return {
      success: false,
      error: 'Failed to parse request body',
      status: 400,
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get limit type based on request path
 */
export function getLimitTypeForPath(pathname: string): SizeLimitType {
  if (pathname.includes('/api/connections') && pathname.includes('/execute')) {
    return 'sql';
  }
  
  if (pathname.includes('/api/connections')) {
    return 'connections';
  }
  
  if (pathname.includes('/api/sync')) {
    return 'sync';
  }
  
  if (pathname.includes('/api/explorer')) {
    return 'explorer';
  }
  
  return 'default';
}

