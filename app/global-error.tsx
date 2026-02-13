'use client';

/**
 * Global Error Boundary (Root Layout)
 * 
 * Catches errors in the root layout and reports them to Sentry.
 * This is the fallback for errors that occur outside the normal error boundary.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ 
        backgroundColor: '#09090b', 
        color: 'white', 
        fontFamily: 'system-ui, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            Something went wrong
          </h1>
          
          <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>
            A critical error occurred. Our team has been notified.
          </p>
          
          {error.digest && (
            <p style={{ 
              fontSize: '12px', 
              color: '#71717a', 
              fontFamily: 'monospace',
              marginBottom: '24px',
            }}>
              Error ID: {error.digest}
            </p>
          )}
          
          <button
            onClick={reset}
            style={{
              backgroundColor: '#14b8a6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              marginRight: '12px',
            }}
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.assign('/')}
            style={{
              color: '#a1a1aa',
              background: 'transparent',
              border: 'none',
              padding: '12px 24px',
              display: 'inline-block',
              cursor: 'pointer',
            }}
          >
            Go to Homepage
          </button>
        </div>
      </body>
    </html>
  );
}
