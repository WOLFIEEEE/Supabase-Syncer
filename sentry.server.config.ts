/**
 * Sentry Server Configuration
 * 
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Configure which errors to ignore
  ignoreErrors: [
    // Ignore expected errors
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    // Ignore rate limit errors
    'Rate limit exceeded',
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-backend-secret'];
    }
    
    // Scrub database URLs
    if (event.exception?.values) {
      event.exception.values.forEach(exception => {
        if (exception.value) {
          exception.value = exception.value.replace(
            /postgres(ql)?:\/\/[^@]+@[^\s]+/g,
            'postgresql://[REDACTED]'
          );
        }
      });
    }
    
    return event;
  },
});
