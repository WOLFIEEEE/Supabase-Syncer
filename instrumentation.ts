/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js on server startup.
 * It handles graceful shutdown and cleanup of resources.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server (not edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { stopCleanup } = await import('@/lib/services/rate-limiter');
    const { closeQueues } = await import('@/lib/queue/client');

    // Track if shutdown is in progress to prevent multiple shutdowns
    let isShuttingDown = false;

    async function gracefulShutdown(signal: string) {
      if (isShuttingDown) {
        console.log(`[SHUTDOWN] Already shutting down, ignoring ${signal}`);
        return;
      }

      isShuttingDown = true;
      console.log(`[SHUTDOWN] Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop rate limiter cleanup timer
        console.log('[SHUTDOWN] Stopping rate limiter cleanup...');
        stopCleanup();

        // Close queue connections
        console.log('[SHUTDOWN] Closing queue connections...');
        await closeQueues();

        console.log('[SHUTDOWN] Graceful shutdown complete');
      } catch (error) {
        console.error('[SHUTDOWN] Error during graceful shutdown:', error);
      }

      // Give time for cleanup to complete, then exit
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions to ensure cleanup
    process.on('uncaughtException', (error) => {
      console.error('[FATAL] Uncaught exception:', error);
      gracefulShutdown('uncaughtException').finally(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason) => {
      console.error('[FATAL] Unhandled rejection:', reason);
      // Don't exit on unhandled rejections, just log them
    });

    console.log('[INSTRUMENTATION] Graceful shutdown handlers registered');
  }
}
