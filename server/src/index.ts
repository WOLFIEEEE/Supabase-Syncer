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

  // Register CORS
  await server.register(cors, {
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Backend-Secret',
      'X-Request-ID',
      'X-User-ID',
    ],
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
    const statusCode = error.statusCode || 500;

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

    // 5. Wait a bit for in-flight requests to complete
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
  try {
    log.info('Starting Supabase Syncer Backend...', {
      port: config.port,
      env: config.nodeEnv,
      logLevel: config.logLevel,
    });

    const server = await buildServer();
    global.server = server;

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.fatal('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      log.fatal('Unhandled rejection', reason as Error);
      gracefulShutdown('unhandledRejection');
    });

    // Start server
    await server.listen({
      port: config.port,
      host: config.host,
    });

    log.info(`Server listening on http://${config.host}:${config.port}`);
    log.info('Health check available at /health');

    // Start sync worker (background job processor)
    if (process.env.ENABLE_WORKER !== 'false') {
      startSyncWorker();
      log.info('Sync worker started');
    }
  } catch (error) {
    log.fatal('Failed to start server', error as Error);
    process.exit(1);
  }
}

main();

