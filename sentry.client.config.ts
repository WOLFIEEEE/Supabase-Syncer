/**
 * Sentry Client Configuration
 * 
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
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

  // Replay configuration for session recording
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Configure which errors to ignore
  ignoreErrors: [
    // Ignore common browser errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Ignore network errors that are expected
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    // Ignore user-triggered navigation
    'AbortError',
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
      delete event.request.headers['X-Backend-Secret'];
    }
    
    // Scrub URLs that might contain tokens
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/token=[^&]+/g, 'token=[REDACTED]');
    }
    
    return event;
  },
});
