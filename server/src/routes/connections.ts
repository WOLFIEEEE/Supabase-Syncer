/**
 * Connection Routes
 * 
 * API routes for database connection operations:
 * - POST /api/connections/:id/test - Test connection
 * - POST /api/connections/:id/execute - Execute SQL
 * - GET /api/connections/:id/schema - Get schema
 * - POST /api/connections/:id/keep-alive - Keep-alive ping
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { logger } from '../utils/logger.js';
import { 
  testConnection, 
  getTableSchema, 
  getSyncableTables,
} from '../services/drizzle-factory.js';
import { decrypt } from '../services/encryption.js';

// Route params
interface ConnectionParams {
  id: string;
}

// Request body types
interface ExecuteSQLBody {
  sql: string;
  dryRun?: boolean;
  maxRows?: number;
}

interface TestConnectionBody {
  encryptedUrl?: string;
}

export async function connectionRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  
  // POST /api/connections/:id/test - Test connection
  fastify.post<{ Params: ConnectionParams; Body: TestConnectionBody }>(
    '/:id/test',
    { preHandler: createRateLimitMiddleware('read') },
    async (request: FastifyRequest<{ Params: ConnectionParams; Body: TestConnectionBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { encryptedUrl } = request.body;
      const userId = request.userId;
      
      logger.info({ userId, connectionId: id }, 'Testing connection');
      
      // If encryptedUrl is provided directly, use it
      // Otherwise, we'd need to fetch from database
      if (!encryptedUrl) {
        return reply.status(400).send({
          success: false,
          error: 'Encrypted URL is required',
        });
      }
      
      try {
        const databaseUrl = decrypt(encryptedUrl);
        const result = await testConnection(databaseUrl);
        
        if (result.success) {
          return reply.send({
            success: true,
            data: {
              connected: true,
              version: result.version,
              tableCount: result.tableCount,
            },
          });
        } else {
          return reply.status(400).send({
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Connection test failed';
        logger.error({ error, userId, connectionId: id }, 'Connection test failed');
        
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );
  
  // POST /api/connections/:id/execute - Execute SQL
  fastify.post<{ Params: ConnectionParams; Body: ExecuteSQLBody }>(
    '/:id/execute',
    { preHandler: createRateLimitMiddleware('execute') },
    async (request: FastifyRequest<{ Params: ConnectionParams; Body: ExecuteSQLBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { sql, dryRun } = request.body;
      const userId = request.userId;
      
      logger.info({ userId, connectionId: id, dryRun, sqlLength: sql?.length }, 'Executing SQL');
      
      if (!sql) {
        return reply.status(400).send({
          success: false,
          error: 'SQL query is required',
        });
      }
      
      // TODO: Fetch connection from database and get encrypted URL
      // For now, return error
      return reply.status(400).send({
        success: false,
        error: 'Connection not found or encrypted URL required in request',
      });
    }
  );
  
  // GET /api/connections/:id/schema - Get schema
  fastify.get<{ Params: ConnectionParams; Querystring: { encryptedUrl?: string } }>(
    '/:id/schema',
    { preHandler: createRateLimitMiddleware('schema') },
    async (request: FastifyRequest<{ Params: ConnectionParams; Querystring: { encryptedUrl?: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { encryptedUrl } = request.query;
      const userId = request.userId;
      
      logger.info({ userId, connectionId: id }, 'Getting schema');
      
      if (!encryptedUrl) {
        return reply.status(400).send({
          success: false,
          error: 'Encrypted URL is required',
        });
      }
      
      try {
        const databaseUrl = decrypt(encryptedUrl);
        const syncableTables = await getSyncableTables(databaseUrl);
        
        // Get schema for each table
        const tablesWithSchema = await Promise.all(
          syncableTables.map(async (tableName) => {
            const columns = await getTableSchema(databaseUrl, tableName);
            return {
              tableName,
              columns,
            };
          })
        );
        
        return reply.send({
          success: true,
          data: {
            tables: tablesWithSchema,
            syncableTables,
            inspectedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get schema';
        logger.error({ error, userId, connectionId: id }, 'Failed to get schema');
        
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );
  
  // POST /api/connections/:id/keep-alive - Keep-alive ping
  fastify.post<{ Params: ConnectionParams; Body: { encryptedUrl?: string } }>(
    '/:id/keep-alive',
    { preHandler: createRateLimitMiddleware('read') },
    async (request: FastifyRequest<{ Params: ConnectionParams; Body: { encryptedUrl?: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { encryptedUrl } = request.body;
      const userId = request.userId;
      
      logger.debug({ userId, connectionId: id }, 'Keep-alive ping');
      
      if (!encryptedUrl) {
        return reply.status(400).send({
          success: false,
          error: 'Encrypted URL is required',
        });
      }
      
      try {
        const databaseUrl = decrypt(encryptedUrl);
        const result = await testConnection(databaseUrl);
        
        return reply.send({
          success: result.success,
          data: {
            alive: result.success,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Keep-alive failed';
        logger.warn({ error, userId, connectionId: id }, 'Keep-alive failed');
        
        return reply.send({
          success: false,
          data: {
            alive: false,
            error: message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );
}

export default connectionRoutes;

