/**
 * Supabase Syncer Backend Server
 * 
 * Production-ready Fastify server for handling heavy processing tasks:
 * - Database sync operations
 * - Schema validation and migration generation
 * - Connection testing and management
 * - Background job processing with BullMQ
 * 
 * Features:
 * - Horizontal scaling support (stateless design)
 * - Redis-based distributed rate limiting
 * - Graceful shutdown handling
 * - Comprehensive health checks
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config.js';
import { log } from './utils/logger.js';
import { initSentry, captureException, flush as flushSentry } from './utils/sentry.js';

// Initialize Sentry early
initSentry();
import { healthRoutes, closeHealthCheckConnections } from './routes/health.js';
import { syncRoutes } from './routes/sync.js';
import { connectionRoutes } from './routes/connections.js';
import { adminRoutes } from './routes/admin.js';
import { explorerRoutes } from './routes/explorer.js';
import { registerRateLimiting, closeRateLimitConnections } from './middleware/rate-limit.js';
import { closeQueues } from './queue/client.js';
import { startSyncWorker } from './queue/worker.js';

// Track shutdown state
let isShuttingDown = false;

async function buildServer() {
  const server = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
    trustProxy: true,
    requestTimeout: config.requestTimeout,
    bodyLimit: 10485760, // 10MB
    // Generate request IDs
    genReqId: () => crypto.randomUUID(),
  });

  // Register CORS with dynamic origin checking for Vercel preview domains
  await server.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-side requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check exact matches from ALLOWED_ORIGINS or FRONTEND_URL
      if (config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow Vercel preview domains (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Allow localhost for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      
      // In development, allow all origins
      if (config.isDev) {
        return callback(null, true);
      }
      
      // Log rejected origin for debugging
      log.warn('CORS rejected origin', { origin, allowedOrigins: config.allowedOrigins });
      
      // Reject other origins
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Backend-Secret',
      'X-Request-ID',
      'X-User-ID',
      'Accept',
    ],
    exposedHeaders: ['X-Request-ID'],
  });

  // Register Helmet for security headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disabled for API server
  });

  // Request logging hook
  server.addHook('onRequest', async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      requestId: request.id,
    }, 'Incoming request');
  });

  // Response logging hook
  server.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
      requestId: request.id,
    }, 'Request completed');
  });

  // Error handler
  server.setErrorHandler((error: Error & { validation?: unknown; statusCode?: number }, request, reply) => {
    request.log.error({
      err: error,
      requestId: request.id,
    }, 'Request error');

    // Capture error in Sentry (only for 5xx errors)
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      captureException(error, {
        requestId: request.id,
        method: request.method,
        url: request.url,
        userId: (request as unknown as { userId?: string }).userId,
      });
    }

    // Handle known error types
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.validation,
      });
    }

    // Don't expose internal errors in production
    const message = config.isProd ? 'Internal server error' : error.message;

    return reply.status(statusCode).send({
      success: false,
      error: message,
    });
  });

  // Register rate limiting
  await registerRateLimiting(server);

  // Register health check routes (no auth required)
  await server.register(healthRoutes);

  // Register API routes (auth required)
  await server.register(syncRoutes, { prefix: '/api/sync' });
  await server.register(connectionRoutes, { prefix: '/api/connections' });
  await server.register(adminRoutes, { prefix: '/api/admin' });
  await server.register(explorerRoutes, { prefix: '/api/explorer' });

  // Root route
  server.get('/', async () => {
    return {
      name: 'Supabase Syncer Backend',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      docs: '/health',
      routes: {
        health: '/health',
        sync: '/api/sync',
        connections: '/api/connections',
        admin: '/api/admin',
        explorer: '/api/explorer',
      },
    };
  });

  return server;
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    log.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  log.info(`Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = 30000; // 30 seconds
  const shutdownTimer = setTimeout(() => {
    log.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, shutdownTimeout);

  try {
    // 1. Stop accepting new connections
    if (global.server) {
      log.info('Closing server connections...');
      await global.server.close();
    }

    // 2. Close health check connections
    log.info('Closing health check connections...');
    await closeHealthCheckConnections();

    // 3. Close rate limit connections
    log.info('Closing rate limit connections...');
    await closeRateLimitConnections();

    // 4. Close queue connections
    log.info('Closing queue connections...');
    await closeQueues();

    // 5. Flush Sentry events
    log.info('Flushing Sentry events...');
    await flushSentry(2000);

    // 6. Wait a bit for in-flight requests to complete
    log.info('Waiting for in-flight requests...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    clearTimeout(shutdownTimer);
    log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', error as Error);
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
}

// Declare global server for shutdown access
declare global {
  // eslint-disable-next-line no-var
  var server: Awaited<ReturnType<typeof buildServer>> | undefined;
}

async function main() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:230',message:'main entry',data:{port:config.port,host:config.host,nodeEnv:config.nodeEnv},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    log.info('Starting Supabase Syncer Backend...', {
      port: config.port,
      env: config.nodeEnv,
      logLevel: config.logLevel,
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:238',message:'before buildServer',data:{redisUrl:config.redisUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const server = await buildServer();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:239',message:'after buildServer - success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    global.server = server;

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:246',message:'uncaughtException',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      log.fatal('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:251',message:'unhandledRejection',data:{reason:reason instanceof Error?reason.message:String(reason),stack:reason instanceof Error?reason.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      log.fatal('Unhandled rejection', reason as Error);
      gracefulShutdown('unhandledRejection');
    });

    // Start server
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:257',message:'before server.listen',data:{port:config.port,host:config.host},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    await server.listen({
      port: config.port,
      host: config.host,
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:262',message:'after server.listen - success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    log.info(`Server listening on http://${config.host}:${config.port}`);
    log.info('Health check available at /health');

    // Start sync worker (background job processor)
    if (process.env.ENABLE_WORKER !== 'false') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:266',message:'before startSyncWorker',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      startSyncWorker();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:268',message:'after startSyncWorker - success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      log.info('Sync worker started');
    }
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:270',message:'main completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    const errorData = {error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined};
    console.error('[DEBUG] main catch - fatal error:', errorData);
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:271',message:'main catch - fatal error',data:errorData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    log.fatal('Failed to start server', error as Error);
    process.exit(1);
  }
}

main();

