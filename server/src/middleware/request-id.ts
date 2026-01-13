/**
 * Request ID Middleware
 * 
 * Ensures every request has a unique ID for tracing:
 * - Uses X-Request-ID header if provided by frontend
 * - Generates a new UUID if not provided
 * - Adds request ID to response headers
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

// Extend FastifyRequest to include requestId
declare module 'fastify' {
  interface FastifyRequest {
    requestId?: string;
  }
}

/**
 * Request ID middleware
 */
export async function requestIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get request ID from header or generate new one
  const requestId = (request.headers['x-request-id'] as string) || randomUUID();
  
  // Store on request
  request.requestId = requestId;
  
  // Add to response headers
  reply.header('X-Request-ID', requestId);
}

export default requestIdMiddleware;

