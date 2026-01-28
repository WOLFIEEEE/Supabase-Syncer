/**
 * Keep Alive Cron Job Endpoint
 * 
 * This endpoint is called by Vercel Cron to ping databases with keep_alive enabled.
 * Runs once daily at midnight UTC to keep Supabase free tier databases active.
 * Note: Vercel Hobby plan limits to 1 cron job per day, so we run daily instead of every 6 hours.
 * This is sufficient since Supabase free tier pauses after 1 week of inactivity.
 * 
 * Security: Protected by CRON_SECRET header verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { pingDatabase, shouldPing, logPingResult, type KeepAliveStats } from '@/lib/services/keep-alive';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { logger } from '@/lib/services/logger';

// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max for cron job

/**
 * GET /api/cron/keep-alive
 * 
 * Pings all databases with keep_alive enabled
 * Called by Vercel Cron once daily at midnight UTC
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify cron secret (Vercel adds this header for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow bypass in development or if no secret is set
  const isDev = process.env.NODE_ENV === 'development';
  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManualTrigger = request.headers.get('x-manual-trigger') === 'true';
  
  if (!isDev && cronSecret && !isVercelCron && !isManualTrigger) {
    logger.warn('[Keep Alive Cron] Unauthorized request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  logger.info('[Keep Alive Cron] Starting keep-alive ping cycle...');
  
  const stats: KeepAliveStats = {
    totalPinged: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };
  
  try {
    // Get all connections with keep_alive enabled
    const connections = await supabaseConnectionStore.getAllForService();
    const keepAliveConnections = connections.filter(c => c.keepAlive);
    
    logger.info('[Keep Alive Cron] Found connections with keep_alive enabled', { count: keepAliveConnections.length });
    
    if (keepAliveConnections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connections with keep_alive enabled',
        stats,
        duration: Date.now() - startTime,
      });
    }
    
    // Process connections sequentially to avoid overwhelming resources
    for (const connection of keepAliveConnections) {
      // Check if we should ping based on last ping time
      if (!shouldPing(connection.lastPingedAt)) {
        logger.info('[Keep Alive Cron] Skipping connection - recently pinged', { connectionName: connection.name });
        stats.skipped++;
        continue;
      }
      
      stats.totalPinged++;
      
      // Ping the database
      const result = await pingDatabase(
        connection.id,
        connection.name,
        connection.encrypted_url
      );
      
      stats.results.push(result);
      
      // Log the ping result to history
      await logPingResult(result);
      
      if (result.success) {
        stats.successful++;
        
        // Update last_pinged_at timestamp
        try {
          await supabaseConnectionStore.updateLastPinged(connection.id);
          logger.info('[Keep Alive Cron] Updated last_pinged_at', { connectionName: connection.name });
        } catch (error) {
          logger.error('[Keep Alive Cron] Failed to update last_pinged_at', { connectionName: connection.name, error });
          // Don't fail the ping - logging is more important than timestamp update
        }
      } else {
        stats.failed++;
      }
      
      // Small delay between pings to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const duration = Date.now() - startTime;

    logger.info('[Keep Alive Cron] Completed', { successful: stats.successful, totalPinged: stats.totalPinged, duration });
    
    return NextResponse.json({
      success: stats.failed === 0,
      message: `Pinged ${stats.totalPinged} database(s): ${stats.successful} successful, ${stats.failed} failed, ${stats.skipped} skipped`,
      stats,
      duration,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Keep Alive Cron] Error', { message, error });
    
    return NextResponse.json(
      {
        success: false,
        error: message,
        stats,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/keep-alive
 * 
 * Manual trigger for a specific connection
 * Used by the UI to test keep-alive functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId } = body;
    
    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    // Get the connection
    const connection = await supabaseConnectionStore.getByIdForService(connectionId);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    logger.info('[Keep Alive] Manual ping requested', { connectionName: connection.name });
    
    // Ping the database
    const result = await pingDatabase(
      connection.id,
      connection.name,
      connection.encrypted_url
    );
    
    if (result.success) {
      // Update last_pinged_at timestamp
      try {
        await supabaseConnectionStore.updateLastPinged(connection.id);
        logger.info('[Keep Alive] Updated last_pinged_at', { connectionName: connection.name });
      } catch (error) {
        logger.error('[Keep Alive] Failed to update last_pinged_at', { connectionName: connection.name, error });
        // Don't fail the ping - logging is more important than timestamp update
      }
    }
    
    return NextResponse.json({
      success: result.success,
      result,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Keep Alive] Manual ping error', { message, error });
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

