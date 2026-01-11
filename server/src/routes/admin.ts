/**
 * Admin Routes
 * 
 * API routes for admin operations:
 * - GET /api/admin/analytics - Admin analytics
 * - GET /api/admin/users - User management
 * - GET /api/admin/sync-jobs - All sync jobs
 * - GET /api/admin/security-events - Security events
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminAuthMiddleware } from '../middleware/auth.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { logger } from '../utils/logger.js';
import { getSupabaseClient } from '../services/supabase-client.js';

// Query params
interface PaginationQuery {
  page?: string;
  limit?: string;
}

interface DateRangeQuery extends PaginationQuery {
  startDate?: string;
  endDate?: string;
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Apply admin auth middleware to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);
  
  // GET /api/admin/analytics - Admin analytics
  fastify.get<{ Querystring: DateRangeQuery }>(
    '/analytics',
    { preHandler: createRateLimitMiddleware('admin') },
    async (request: FastifyRequest<{ Querystring: DateRangeQuery }>, reply: FastifyReply) => {
      const { startDate, endDate } = request.query;
      const userId = request.userId;
      
      logger.info({ userId, startDate, endDate }, 'Fetching admin analytics');
      
      // TODO: Implement actual analytics from database
      return reply.send({
        success: true,
        data: {
          overview: {
            totalUsers: 0,
            activeUsers: 0,
            totalConnections: 0,
            totalSyncJobs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
          },
          syncStats: {
            totalRowsSynced: 0,
            avgSyncDuration: 0,
            syncsByDay: [],
          },
          userActivity: {
            newUsersToday: 0,
            activeUsersToday: 0,
            topUsers: [],
          },
          systemHealth: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
          },
          generatedAt: new Date().toISOString(),
        },
      });
    }
  );
  
  // GET /api/admin/users - User management
  fastify.get<{ Querystring: PaginationQuery & { search?: string } }>(
    '/users',
    { preHandler: createRateLimitMiddleware('admin') },
    async (request: FastifyRequest<{ Querystring: PaginationQuery & { search?: string } }>, reply: FastifyReply) => {
      const { page = '1', limit = '20', search } = request.query;
      const userId = request.userId;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      
      logger.info({ userId, page, limit, search }, 'Fetching users list');
      
      try {
        const supabase = getSupabaseClient();
        
        // Get unique users from connections
        const { data: connections, error: connError } = await supabase
          .from('connections')
          .select('user_id, created_at')
          .order('created_at', { ascending: false });
        
        if (connError) throw connError;
        
        // Aggregate user data
        const userMap = new Map<string, {
          userId: string;
          firstSeen: string;
          connectionCount: number;
        }>();
        
        if (connections) {
          connections.forEach((conn: { user_id: string; created_at: string }) => {
            const existing = userMap.get(conn.user_id) || {
              userId: conn.user_id,
              firstSeen: conn.created_at,
              connectionCount: 0,
            };
            existing.connectionCount++;
            const connDate = new Date(conn.created_at);
            const existingDate = new Date(existing.firstSeen);
            if (connDate < existingDate) {
              existing.firstSeen = conn.created_at;
            }
            userMap.set(conn.user_id, existing);
          });
        }
        
        let users = Array.from(userMap.values());
        
        // Filter by search
        if (search) {
          users = users.filter(u => u.userId.toLowerCase().includes(search.toLowerCase()));
        }
        
        const total = users.length;
        const paginatedUsers = users.slice(offset, offset + parseInt(limit, 10));
        
        return reply.send({
          success: true,
          data: paginatedUsers,
          pagination: {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            hasMore: offset + parseInt(limit, 10) < total,
          },
        });
      } catch (error) {
        logger.error({ error, userId }, 'Failed to fetch users');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch users',
        });
      }
    }
  );
  
  // GET /api/admin/sync-jobs - All sync jobs
  fastify.get<{ Querystring: PaginationQuery & { status?: string; userId?: string; startDate?: string; endDate?: string } }>(
    '/sync-jobs',
    { preHandler: createRateLimitMiddleware('admin') },
    async (request: FastifyRequest<{ Querystring: PaginationQuery & { status?: string; userId?: string; startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
      const { page = '1', limit = '20', status, userId: filterUserId, startDate, endDate } = request.query;
      const userId = request.userId;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      
      logger.info({ userId, page, limit, status, filterUserId, startDate, endDate }, 'Fetching all sync jobs');
      
      try {
        const supabase = getSupabaseClient();
        
        let query = supabase
          .from('sync_jobs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });
        
        if (status) {
          query = query.eq('status', status);
        }
        
        if (filterUserId) {
          query = query.eq('user_id', filterUserId);
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        
        if (endDate) {
          query = query.lte('created_at', endDate);
        }
        
        const { data, error, count } = await query.range(offset, offset + parseInt(limit, 10) - 1);
        
        if (error) throw error;
        
        return reply.send({
          success: true,
          data: data || [],
          pagination: {
            total: count || 0,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            hasMore: (count || 0) > offset + parseInt(limit, 10),
          },
        });
      } catch (error) {
        logger.error({ error, userId }, 'Failed to fetch sync jobs');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch sync jobs',
        });
      }
    }
  );
  
  // GET /api/admin/security-events - Security events
  fastify.get<{ Querystring: DateRangeQuery & { severity?: string; eventType?: string; userId?: string } }>(
    '/security-events',
    { preHandler: createRateLimitMiddleware('admin') },
    async (request: FastifyRequest<{ Querystring: DateRangeQuery & { severity?: string; eventType?: string; userId?: string } }>, reply: FastifyReply) => {
      const { page = '1', limit = '50', startDate, endDate, severity, eventType, userId: filterUserId } = request.query;
      const userId = request.userId;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      
      logger.info({ userId, page, limit, startDate, endDate, severity, eventType, filterUserId }, 'Fetching security events');
      
      try {
        const supabase = getSupabaseClient();
        
        let query = supabase
          .from('security_events')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });
        
        if (severity) {
          query = query.eq('severity', severity);
        }
        
        if (eventType) {
          query = query.eq('event_type', eventType);
        }
        
        if (filterUserId) {
          query = query.eq('user_id', filterUserId);
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        
        if (endDate) {
          query = query.lte('created_at', endDate);
        }
        
        const { data, error, count } = await query.range(offset, offset + parseInt(limit, 10) - 1);
        
        if (error) throw error;
        
        return reply.send({
          success: true,
          data: data || [],
          pagination: {
            total: count || 0,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            hasMore: (count || 0) > offset + parseInt(limit, 10),
          },
        });
      } catch (error) {
        logger.error({ error, userId }, 'Failed to fetch security events');
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch security events',
        });
      }
    }
  );
  
  // POST /api/admin/export - Export data
  fastify.post<{ Body: { type: string; format?: string } }>(
    '/export',
    { preHandler: createRateLimitMiddleware('admin') },
    async (request: FastifyRequest<{ Body: { type: string; format?: string } }>, reply: FastifyReply) => {
      const { type, format = 'json' } = request.body;
      const userId = request.userId;
      
      logger.info({ userId, type, format }, 'Exporting data');
      
      // TODO: Implement actual data export
      return reply.send({
        success: true,
        data: {
          exportId: `export-${Date.now()}`,
          status: 'pending',
          type,
          format,
          createdAt: new Date().toISOString(),
        },
      });
    }
  );
}

export default adminRoutes;

