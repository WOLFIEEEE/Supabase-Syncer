/**
 * Explorer Routes
 * 
 * API routes for database explorer:
 * - GET /api/explorer/:connectionId/tables - List tables
 * - GET /api/explorer/:connectionId/:table/rows - Get table rows
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { logger } from '../utils/logger.js';
import { 
  createDrizzleClient,
  getSyncableTables, 
  getTableSchema,
  getTableRowCount,
  safeInt,
} from '../services/drizzle-factory.js';
import { decrypt } from '../services/encryption.js';

// Route params
interface ConnectionParams {
  connectionId: string;
}

interface TableParams extends ConnectionParams {
  table: string;
}

// Query params
interface PaginationQuery {
  page?: string;
  limit?: string;
  encryptedUrl?: string;
}

interface RowsQuery extends PaginationQuery {
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
}

export async function explorerRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  
  // GET /api/explorer/:connectionId/tables - List tables
  fastify.get<{ Params: ConnectionParams; Querystring: { encryptedUrl?: string } }>(
    '/:connectionId/tables',
    { preHandler: createRateLimitMiddleware('read') },
    async (request: FastifyRequest<{ Params: ConnectionParams; Querystring: { encryptedUrl?: string } }>, reply: FastifyReply) => {
      const { connectionId } = request.params;
      const { encryptedUrl } = request.query;
      const userId = request.userId;
      
      logger.info({ userId, connectionId }, 'Listing tables');
      
      if (!encryptedUrl) {
        return reply.status(400).send({
          success: false,
          error: 'Encrypted URL is required',
        });
      }
      
      try {
        const databaseUrl = decrypt(encryptedUrl);
        const tables = await getSyncableTables(databaseUrl);
        
        // Get row counts for each table
        const tablesWithCounts = await Promise.all(
          tables.map(async (tableName) => {
            const rowCount = await getTableRowCount(databaseUrl, tableName);
            const columns = await getTableSchema(databaseUrl, tableName);
            return {
              name: tableName,
              rowCount,
              columnCount: columns.length,
              columns: columns.map(c => ({
                name: c.columnName,
                type: c.dataType,
                nullable: c.isNullable,
              })),
            };
          })
        );
        
        return reply.send({
          success: true,
          data: {
            tables: tablesWithCounts,
            total: tablesWithCounts.length,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list tables';
        logger.error({ error, userId, connectionId }, 'Failed to list tables');
        
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );
  
  // GET /api/explorer/:connectionId/:table/rows - Get table rows
  fastify.get<{ Params: TableParams; Querystring: RowsQuery }>(
    '/:connectionId/:table/rows',
    { preHandler: createRateLimitMiddleware('read') },
    async (request: FastifyRequest<{ Params: TableParams; Querystring: RowsQuery }>, reply: FastifyReply) => {
      const { connectionId, table } = request.params;
      const { 
        page = '1', 
        limit = '50', 
        orderBy = 'id', 
        orderDir = 'desc',
        encryptedUrl,
      } = request.query;
      const userId = request.userId;
      
      logger.info({ userId, connectionId, table, page, limit }, 'Getting table rows');
      
      if (!encryptedUrl) {
        return reply.status(400).send({
          success: false,
          error: 'Encrypted URL is required',
        });
      }
      
      // Validate table name to prevent SQL injection
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid table name',
        });
      }
      
      try {
        const databaseUrl = decrypt(encryptedUrl);
        const connection = createDrizzleClient(databaseUrl);
        
        const pageNum = Math.max(1, safeInt(page, 1));
        const limitNum = Math.min(100, Math.max(1, safeInt(limit, 50)));
        const offset = (pageNum - 1) * limitNum;
        
        // Validate orderBy column
        const safeOrderBy = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(orderBy) ? orderBy : 'id';
        const safeOrderDir = orderDir === 'asc' ? 'ASC' : 'DESC';
        
        // Get total count
        const countResult = await connection.client.unsafe(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        const total = safeInt(countResult[0]?.count, 0);
        
        // Get rows
        const rows = await connection.client.unsafe(
          `SELECT * FROM "${table}" ORDER BY "${safeOrderBy}" ${safeOrderDir} LIMIT ${limitNum} OFFSET ${offset}`
        );
        
        await connection.close();
        
        return reply.send({
          success: true,
          data: {
            rows: rows as Record<string, unknown>[],
            total,
            page: pageNum,
            limit: limitNum,
            hasMore: offset + rows.length < total,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get rows';
        logger.error({ error, userId, connectionId, table }, 'Failed to get table rows');
        
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );
}

export default explorerRoutes;

