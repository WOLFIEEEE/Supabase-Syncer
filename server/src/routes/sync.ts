/**
 * Sync Routes
 * 
 * API routes for sync operations:
 * - POST /api/sync - Create sync job
 * - GET /api/sync/:id - Get sync job status
 * - POST /api/sync/:id/start - Start sync job
 * - POST /api/sync/:id/pause - Pause sync job
 * - POST /api/sync/:id/stop - Stop sync job
 * - POST /api/sync/validate - Validate schema compatibility
 * - POST /api/sync/generate-migration - Generate migration script
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { logger } from '../utils/logger.js';
import { addSyncJob, getJobStatus, pauseSyncJob, cancelSyncJob } from '../queue/client.js';
import { markJobCancelled } from '../queue/worker.js';
import {
  getConnectionById,
  getSyncJobById,
  createSyncJob as createJobInDb,
  updateSyncJob,
  addSyncLog,
} from '../services/supabase-client.js';
import { decrypt } from '../services/encryption.js';
import type { TableConfig, SyncJobData } from '../types/index.js';

// Request body types
interface CreateSyncJobBody {
  sourceConnectionId: string;
  targetConnectionId: string;
  direction: 'one_way' | 'two_way';
  tables: TableConfig[];
  dryRun?: boolean;
  sourceEncryptedUrl?: string;
  targetEncryptedUrl?: string;
}

interface ValidateSchemaBody {
  sourceConnectionId: string;
  targetConnectionId: string;
  tables?: string[];
  direction?: 'one_way' | 'two_way';
  sourceEncryptedUrl?: string;
  targetEncryptedUrl?: string;
}

interface GenerateMigrationBody {
  sourceConnectionId: string;
  targetConnectionId: string;
  sourceEncryptedUrl?: string;
  targetEncryptedUrl?: string;
}

// Route params
interface SyncJobParams {
  id: string;
}

export async function syncRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  
  // POST /api/sync - Create sync job
  fastify.post<{ Body: CreateSyncJobBody }>(
    '/',
    { preHandler: createRateLimitMiddleware('sync') },
    async (request: FastifyRequest<{ Body: CreateSyncJobBody }>, reply: FastifyReply) => {
      const { sourceConnectionId, targetConnectionId, direction, tables, dryRun, sourceEncryptedUrl, targetEncryptedUrl } = request.body;
      const userId = request.userId!;
      
      logger.info({
        userId,
        sourceConnectionId,
        targetConnectionId,
        direction,
        dryRun,
        tableCount: tables?.length,
      }, 'Creating sync job');
      
      // Validate required fields
      if (!sourceConnectionId || !targetConnectionId) {
        return reply.status(400).send({
          success: false,
          error: 'Source and target connection IDs are required',
        });
      }
      
      if (!tables || tables.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'At least one table must be specified',
        });
      }
      
      try {
        // Get encrypted URLs if not provided
        let sourceEncUrl = sourceEncryptedUrl;
        let targetEncUrl = targetEncryptedUrl;
        
        if (!sourceEncUrl || !targetEncUrl) {
          const [sourceConn, targetConn] = await Promise.all([
            getConnectionById(sourceConnectionId, userId),
            getConnectionById(targetConnectionId, userId),
          ]);
          
          if (!sourceConn || !targetConn) {
            return reply.status(404).send({
              success: false,
              error: 'Connection not found',
            });
          }
          
          sourceEncUrl = sourceConn.encrypted_url;
          targetEncUrl = targetConn.encrypted_url;
        }
        
        // Create job in database
        const job = await createJobInDb(userId, {
          source_connection_id: sourceConnectionId,
          target_connection_id: targetConnectionId,
          direction,
          tables_config: tables,
        });
        
        // Add to queue if not dry run
        if (!dryRun) {
          const jobData: SyncJobData = {
            jobId: job.id,
            userId,
            sourceConnectionId,
            targetConnectionId,
            tablesConfig: tables,
            direction,
            sourceUrl: sourceEncUrl,
            targetUrl: targetEncUrl,
          };
          
          await addSyncJob(jobData);
          await addSyncLog(job.id, 'info', 'Sync job created and queued');
        } else {
          await addSyncLog(job.id, 'info', 'Sync job created (dry run mode)');
        }
        
        return reply.status(201).send({
          success: true,
          data: {
            id: job.id,
            status: job.status,
            sourceConnectionId,
            targetConnectionId,
            direction,
            tables,
            dryRun: dryRun || false,
            createdAt: job.created_at,
          },
        });
      } catch (error) {
        logger.error({ error, userId }, 'Failed to create sync job');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create sync job',
        });
      }
    }
  );
  
  // GET /api/sync/:id - Get sync job status
  fastify.get<{ Params: SyncJobParams }>(
    '/:id',
    { preHandler: createRateLimitMiddleware('read') },
    async (request: FastifyRequest<{ Params: SyncJobParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const userId = request.userId!;
      
      logger.info({ userId, jobId: id }, 'Getting sync job status');
      
      try {
        // Get job from database
        const job = await getSyncJobById(id, userId);
        
        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'Sync job not found',
          });
        }
        
        // Get queue status if job is active
        let queueStatus = null;
        if (job.status === 'running' || job.status === 'pending') {
          queueStatus = await getJobStatus(id);
        }
        
        return reply.send({
          success: true,
          data: {
            id: job.id,
            status: job.status,
            sourceConnectionId: job.source_connection_id,
            targetConnectionId: job.target_connection_id,
            direction: job.direction,
            tablesConfig: job.tables_config,
            progress: job.progress,
            checkpoint: job.checkpoint,
            startedAt: job.started_at,
            completedAt: job.completed_at,
            createdAt: job.created_at,
            queueStatus,
          },
        });
      } catch (error) {
        logger.error({ error, userId, jobId: id }, 'Failed to get sync job status');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get sync job status',
        });
      }
    }
  );
  
  // POST /api/sync/:id/start - Start sync job
  fastify.post<{ Params: SyncJobParams; Body: { sourceEncryptedUrl?: string; targetEncryptedUrl?: string } }>(
    '/:id/start',
    { preHandler: createRateLimitMiddleware('sync') },
    async (request: FastifyRequest<{ Params: SyncJobParams; Body: { sourceEncryptedUrl?: string; targetEncryptedUrl?: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { sourceEncryptedUrl, targetEncryptedUrl } = request.body;
      const userId = request.userId!;
      
      logger.info({ userId, jobId: id }, 'Starting sync job');
      
      try {
        // Get job from database
        const job = await getSyncJobById(id, userId);
        
        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'Sync job not found',
          });
        }
        
        // Check if job can be started
        if (!['pending', 'paused', 'failed'].includes(job.status)) {
          return reply.status(400).send({
            success: false,
            error: `Cannot start job with status "${job.status}"`,
          });
        }
        
        // Get encrypted URLs if not provided
        let sourceEncUrl = sourceEncryptedUrl;
        let targetEncUrl = targetEncryptedUrl;
        
        if (!sourceEncUrl || !targetEncUrl) {
          const [sourceConn, targetConn] = await Promise.all([
            getConnectionById(job.source_connection_id, userId),
            getConnectionById(job.target_connection_id, userId),
          ]);
          
          if (!sourceConn || !targetConn) {
            return reply.status(404).send({
              success: false,
              error: 'Connection not found',
            });
          }
          
          sourceEncUrl = sourceConn.encrypted_url;
          targetEncUrl = targetConn.encrypted_url;
        }
        
        // Update job status
        await updateSyncJob(id, userId, {
          status: 'running',
          started_at: new Date().toISOString(),
        });
        
        // Add to queue
        const jobData: SyncJobData = {
          jobId: id,
          userId,
          sourceConnectionId: job.source_connection_id,
          targetConnectionId: job.target_connection_id,
          tablesConfig: job.tables_config as TableConfig[],
          direction: job.direction,
          checkpoint: job.checkpoint as any,
          sourceUrl: sourceEncUrl,
          targetUrl: targetEncUrl,
        };
        
        await addSyncJob(jobData);
        await addSyncLog(id, 'info', 'Sync job started');
        
        return reply.send({
          success: true,
          data: {
            jobId: id,
            status: 'running',
            message: 'Sync job started successfully',
          },
        });
      } catch (error) {
        logger.error({ error, userId, jobId: id }, 'Failed to start sync job');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start sync job',
        });
      }
    }
  );
  
  // GET /api/sync/:id/stream - SSE stream for sync progress
  fastify.get<{ Params: SyncJobParams }>(
    '/:id/stream',
    { preHandler: createRateLimitMiddleware('sync') },
    async (request: FastifyRequest<{ Params: SyncJobParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const userId = request.userId!;
      
      logger.info({ userId, jobId: id }, 'Opening sync progress stream');
      
      // Verify job exists and belongs to user
      const job = await getSyncJobById(id, userId);
      if (!job) {
        return reply.status(404).send({
          success: false,
          error: 'Sync job not found',
        });
      }
      
      // Set up SSE headers
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      
      // Send initial connection message
      reply.raw.write(`data: ${JSON.stringify({ type: 'connected', jobId: id })}\n\n`);
      
      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const currentJob = await getSyncJobById(id, userId);
          
          if (!currentJob) {
            reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: 'Job not found' })}\n\n`);
            clearInterval(pollInterval);
            reply.raw.end();
            return;
          }
          
          // Send progress update
          reply.raw.write(`data: ${JSON.stringify({
            type: 'progress',
            status: currentJob.status,
            progress: currentJob.progress,
            checkpoint: currentJob.checkpoint,
          })}\n\n`);
          
          // Close stream if job is completed or failed
          if (['completed', 'failed'].includes(currentJob.status)) {
            reply.raw.write(`data: ${JSON.stringify({
              type: 'complete',
              status: currentJob.status,
              progress: currentJob.progress,
            })}\n\n`);
            clearInterval(pollInterval);
            reply.raw.end();
          }
        } catch (error) {
          logger.error({ error, jobId: id }, 'Error polling sync progress');
          reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to get progress' })}\n\n`);
        }
      }, 1000); // Poll every second
      
      // Clean up on client disconnect
      request.raw.on('close', () => {
        clearInterval(pollInterval);
        reply.raw.end();
      });
      
      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        reply.raw.write(`data: ${JSON.stringify({ type: 'timeout' })}\n\n`);
        reply.raw.end();
      }, 600000);
      
      return reply;
    }
  );
  
  // POST /api/sync/:id/pause - Pause sync job
  fastify.post<{ Params: SyncJobParams }>(
    '/:id/pause',
    { preHandler: createRateLimitMiddleware('sync') },
    async (request: FastifyRequest<{ Params: SyncJobParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const userId = request.userId!;
      
      logger.info({ userId, jobId: id }, 'Pausing sync job');
      
      try {
        const job = await getSyncJobById(id, userId);
        
        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'Sync job not found',
          });
        }
        
        if (job.status !== 'running') {
          return reply.status(400).send({
            success: false,
            error: `Cannot pause job with status "${job.status}"`,
          });
        }
        
        // Mark as cancelled in queue
        const paused = await pauseSyncJob(id);
        
        if (paused) {
          await updateSyncJob(id, userId, { status: 'paused' });
          await addSyncLog(id, 'info', 'Sync job paused');
          
          return reply.send({
            success: true,
            data: {
              jobId: id,
              status: 'paused',
            },
          });
        } else {
          return reply.status(400).send({
            success: false,
            error: 'Failed to pause sync job',
          });
        }
      } catch (error) {
        logger.error({ error, userId, jobId: id }, 'Failed to pause sync job');
        return reply.status(500).send({
          success: false,
          error: 'Failed to pause sync job',
        });
      }
    }
  );
  
  // POST /api/sync/:id/stop - Stop sync job
  fastify.post<{ Params: SyncJobParams }>(
    '/:id/stop',
    { preHandler: createRateLimitMiddleware('sync') },
    async (request: FastifyRequest<{ Params: SyncJobParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const userId = request.userId!;
      
      logger.info({ userId, jobId: id }, 'Stopping sync job');
      
      try {
        const job = await getSyncJobById(id, userId);
        
        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'Sync job not found',
          });
        }
        
        if (!['running', 'paused'].includes(job.status)) {
          return reply.status(400).send({
            success: false,
            error: `Cannot stop job with status "${job.status}"`,
          });
        }
        
        // Cancel in queue
        const cancelled = await cancelSyncJob(id);
        
        if (cancelled) {
          markJobCancelled(id);
          await updateSyncJob(id, userId, {
            status: 'failed',
            completed_at: new Date().toISOString(),
          });
          await addSyncLog(id, 'info', 'Sync job stopped by user');
          
          return reply.send({
            success: true,
            data: {
              jobId: id,
              status: 'failed',
            },
          });
        } else {
          return reply.status(400).send({
            success: false,
            error: 'Failed to stop sync job',
          });
        }
      } catch (error) {
        logger.error({ error, userId, jobId: id }, 'Failed to stop sync job');
        return reply.status(500).send({
          success: false,
          error: 'Failed to stop sync job',
        });
      }
    }
  );
  
  // POST /api/sync/validate - Validate schema compatibility
  fastify.post<{ Body: ValidateSchemaBody }>(
    '/validate',
    { preHandler: createRateLimitMiddleware('schema') },
    async (request: FastifyRequest<{ Body: ValidateSchemaBody }>, reply: FastifyReply) => {
      const { sourceConnectionId, targetConnectionId, tables, sourceEncryptedUrl, targetEncryptedUrl } = request.body;
      const userId = request.userId!;
      
      logger.info({
        userId,
        sourceConnectionId,
        targetConnectionId,
        tableCount: tables?.length,
      }, 'Validating schema compatibility');
      
      // Validate required fields
      if (!sourceConnectionId || !targetConnectionId) {
        return reply.status(400).send({
          success: false,
          error: 'Source and target connection IDs are required',
        });
      }
      
      try {
        // Get encrypted URLs if not provided
        let sourceEncUrl = sourceEncryptedUrl;
        let targetEncUrl = targetEncryptedUrl;
        
        if (!sourceEncUrl || !targetEncUrl) {
          const [sourceConn, targetConn] = await Promise.all([
            getConnectionById(sourceConnectionId, userId),
            getConnectionById(targetConnectionId, userId),
          ]);
          
          if (!sourceConn || !targetConn) {
            return reply.status(404).send({
              success: false,
              error: 'Connection not found',
            });
          }
          
          sourceEncUrl = sourceConn.encrypted_url;
          targetEncUrl = targetConn.encrypted_url;
        }
        
        // Decrypt URLs
        const sourceUrl = decrypt(sourceEncUrl);
        const targetUrl = decrypt(targetEncUrl);
        
        // TODO: Implement actual schema validation using schema-validator service
        // For now, return a placeholder response
        // This should call the schema validation service from lib/services
        
        return reply.send({
          success: true,
          data: {
            isValid: true,
            canProceed: true,
            requiresConfirmation: false,
            issues: [],
            summary: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              info: 0,
            },
          },
        });
      } catch (error) {
        logger.error({ error, userId }, 'Failed to validate schema');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Schema validation failed',
        });
      }
    }
  );
  
  // POST /api/sync/generate-migration - Generate migration script
  fastify.post<{ Body: GenerateMigrationBody }>(
    '/generate-migration',
    { preHandler: createRateLimitMiddleware('schema') },
    async (request: FastifyRequest<{ Body: GenerateMigrationBody }>, reply: FastifyReply) => {
      const { sourceConnectionId, targetConnectionId, sourceEncryptedUrl, targetEncryptedUrl } = request.body;
      const userId = request.userId!;
      
      logger.info({
        userId,
        sourceConnectionId,
        targetConnectionId,
      }, 'Generating migration script');
      
      // Validate required fields
      if (!sourceConnectionId || !targetConnectionId) {
        return reply.status(400).send({
          success: false,
          error: 'Source and target connection IDs are required',
        });
      }
      
      try {
        // Get encrypted URLs if not provided
        let sourceEncUrl = sourceEncryptedUrl;
        let targetEncUrl = targetEncryptedUrl;
        
        if (!sourceEncUrl || !targetEncUrl) {
          const [sourceConn, targetConn] = await Promise.all([
            getConnectionById(sourceConnectionId, userId),
            getConnectionById(targetConnectionId, userId),
          ]);
          
          if (!sourceConn || !targetConn) {
            return reply.status(404).send({
              success: false,
              error: 'Connection not found',
            });
          }
          
          sourceEncUrl = sourceConn.encrypted_url;
          targetEncUrl = targetConn.encrypted_url;
        }
        
        // Decrypt URLs
        const sourceUrl = decrypt(sourceEncUrl);
        const targetUrl = decrypt(targetEncUrl);
        
        // TODO: Implement actual migration generation using schema-migration-generator service
        // For now, return a placeholder response
        // This should call the migration generator service from lib/services
        
        return reply.send({
          success: true,
          data: {
            scripts: [],
            safeScripts: [],
            breakingScripts: [],
            manualReviewRequired: [],
            combinedSQL: '-- No changes required',
            rollbackSQL: '-- No rollback needed',
            estimatedDuration: '< 1 minute',
            riskLevel: 'low',
          },
        });
      } catch (error) {
        logger.error({ error, userId }, 'Failed to generate migration');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Migration generation failed',
        });
      }
    }
  );
}

export default syncRoutes;

