/**
 * Sentry Configuration for Backend
 * 
 * Initializes Sentry for error tracking and performance monitoring.
 */

import * as Sentry from '@sentry/node';
import { config } from '../config.js';
import { log } from './logger.js';

let initialized = false;

/**
 * Initialize Sentry for the backend server
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    log.info('Sentry DSN not configured, skipping initialization');
    return;
  }
  
  if (initialized) {
    log.warn('Sentry already initialized');
    return;
  }
  
  try {
    Sentry.init({
      dsn,
      environment: config.nodeEnv,
      release: process.env.npm_package_version || '1.0.0',
      
      // Performance monitoring
      tracesSampleRate: config.isProd ? 0.1 : 1.0,
      
      // Only enable in production
      enabled: config.isProd,
      
      // Filter out sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-backend-secret'];
        }
        
        // Scrub database URLs from error messages
        if (event.exception?.values) {
          event.exception.values.forEach(exception => {
            if (exception.value) {
              exception.value = exception.value.replace(
                /postgres(ql)?:\/\/[^@]+@[^\s]+/g,
                'postgresql://[REDACTED]'
              );
              // Also scrub redis URLs
              exception.value = exception.value.replace(
                /redis:\/\/[^\s]+/g,
                'redis://[REDACTED]'
              );
            }
          });
        }
        
        return event;
      },
      
      // Configure which errors to ignore
      ignoreErrors: [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'Rate limit exceeded',
      ],
    });
    
    initialized = true;
    log.info('Sentry initialized successfully');
  } catch (error) {
    log.error('Failed to initialize Sentry', error as Error);
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }
  
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!initialized) {
    return;
  }
  
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 */
export function setUser(userId: string, email?: string): void {
  if (!initialized) {
    return;
  }
  
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!initialized) {
    return;
  }
  
  Sentry.setUser(null);
}

/**
 * Flush pending events before shutdown
 */
export async function flush(timeout: number = 2000): Promise<void> {
  if (!initialized) {
    return;
  }
  
  await Sentry.flush(timeout);
}

export { Sentry };
