/**
 * Authentication Middleware
 * 
 * Validates requests from the Next.js frontend:
 * 1. Shared secret validation (X-Backend-Secret header)
 * 2. Supabase user token validation (Authorization: Bearer <token>)
 * 
 * Both are required for authenticated routes.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient, User } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    userId?: string;
  }
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Validate the shared secret from the frontend
 */
function validateSharedSecret(request: FastifyRequest): boolean {
  const secret = request.headers['x-backend-secret'];
  
  if (!secret) {
    logger.warn({ requestId: request.id }, 'Missing X-Backend-Secret header');
    return false;
  }
  
  if (secret !== config.backendSharedSecret) {
    logger.warn({ requestId: request.id }, 'Invalid X-Backend-Secret');
    return false;
  }
  
  return true;
}

/**
 * Validate the Supabase user token
 */
async function validateUserToken(request: FastifyRequest): Promise<AuthResult> {
  const authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return { success: false, error: 'Missing Authorization header' };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Invalid Authorization header format' };
  }
  
  const token = authHeader.substring(7);
  
  if (!token) {
    return { success: false, error: 'Empty token' };
  }
  
  // Skip Supabase validation in dev mode if not configured
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    if (config.isDev) {
      logger.warn('Supabase not configured, skipping token validation in dev mode');
      // Return a mock user for development
      return {
        success: true,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User,
      };
    }
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      logger.warn({ error: error.message, requestId: request.id }, 'Supabase token validation failed');
      return { success: false, error: 'Invalid or expired token' };
    }
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    return { success: true, user };
  } catch (error) {
    logger.error({ error, requestId: request.id }, 'Error validating Supabase token');
    return { success: false, error: 'Token validation failed' };
  }
}

/**
 * Full authentication middleware
 * Validates both shared secret and user token
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. Validate shared secret
  if (!validateSharedSecret(request)) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid backend secret',
    });
  }
  
  // 2. Validate user token
  const authResult = await validateUserToken(request);
  
  if (!authResult.success) {
    return reply.status(401).send({
      success: false,
      error: authResult.error || 'Authentication failed',
    });
  }
  
  // 3. Attach user to request
  request.user = authResult.user;
  request.userId = authResult.user?.id;
  
  logger.debug({
    userId: request.userId,
    requestId: request.id,
  }, 'User authenticated');
}

/**
 * Shared secret only middleware
 * For internal service-to-service calls that don't need user context
 */
export async function sharedSecretMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!validateSharedSecret(request)) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid backend secret',
    });
  }
}

/**
 * Optional auth middleware
 * Validates if token is present but doesn't fail if not
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // Validate shared secret first
  if (!validateSharedSecret(request)) {
    return; // Don't fail, just don't set user
  }
  
  // Check for authorization header
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return; // No token, no user
  }
  
  const authResult = await validateUserToken(request);
  if (authResult.success && authResult.user) {
    request.user = authResult.user;
    request.userId = authResult.user.id;
  }
}

/**
 * Admin authentication middleware
 * Validates user has admin privileges
 */
export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First run normal auth
  await authMiddleware(request, reply);
  
  // Check if already sent response
  if (reply.sent) return;
  
  // Check if user is admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.warn('ADMIN_EMAIL not configured');
    return reply.status(403).send({
      success: false,
      error: 'Admin access not configured',
    });
  }
  
  if (request.user?.email !== adminEmail) {
    logger.warn({
      userId: request.userId,
      userEmail: request.user?.email,
      requestId: request.id,
    }, 'Non-admin user attempted admin action');
    
    return reply.status(403).send({
      success: false,
      error: 'Admin access required',
    });
  }
  
  logger.info({
    userId: request.userId,
    requestId: request.id,
  }, 'Admin authenticated');
}

export { validateSharedSecret, validateUserToken };

