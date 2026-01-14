/**
 * BullMQ Queue Client
 * 
 * Manages job queues for background sync processing
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type { SyncJobData } from '../types/index.js';

// Redis connection options for BullMQ
// Properly handles rediss:// (TLS) URLs with authentication
const getRedisOptions = () => {
  try {
    const url = new URL(config.redisUrl);
    const isTls = url.protocol === 'rediss:';

    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null as null,
      enableReadyCheck: false,
      lazyConnect: true,
    };
  } catch (error) {
    // Fallback for simple redis:// URLs or localhost
    logger.warn({ error }, 'Failed to parse Redis URL, using defaults');
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null as null,
    };
  }
};

// Singleton instances
let syncQueue: Queue<SyncJobData> | null = null;
let queueEvents: QueueEvents | null = null;
let syncWorker: Worker<SyncJobData> | null = null;

/**
 * Get the sync job queue (creates if not exists)
 */
export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueue) {
    syncQueue = new Queue<SyncJobData>('sync-jobs', {
      connection: getRedisOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 50,
        },
      },
    });

    logger.info('Sync queue initialized');
  }
  return syncQueue;
}

/**
 * Get queue events for listening to job updates
 */
export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents('sync-jobs', {
      connection: getRedisOptions(),
    });
  }
  return queueEvents;
}

/**
 * Add a sync job to the queue
 */
export async function addSyncJob(data: SyncJobData): Promise<Job<SyncJobData>> {
  const queue = getSyncQueue();

  logger.info({ jobId: data.jobId, userId: data.userId }, 'Adding sync job to queue');

  return queue.add('sync', data, {
    jobId: data.jobId,
    priority: 1,
  });
}

/**
 * Get job status from queue
 */
export async function getJobStatus(jobId: string): Promise<{
  state: string;
  progress: number | object | null;
  failedReason?: string;
} | null> {
  const queue = getSyncQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress as number | object | null;
  const failedReason = job.failedReason;

  return {
    state,
    progress,
    failedReason,
  };
}

/**
 * Pause a running sync job
 */
export async function pauseSyncJob(jobId: string): Promise<boolean> {
  const queue = getSyncQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return false;
  }

  await job.updateData({
    ...job.data,
    checkpoint: { ...job.data.checkpoint, paused: true } as SyncJobData['checkpoint'],
  });

  return true;
}

/**
 * Resume a paused sync job
 */
export async function resumeSyncJob(data: SyncJobData): Promise<Job<SyncJobData>> {
  const queue = getSyncQueue();

  const existingJob = await queue.getJob(data.jobId);
  if (existingJob) {
    await existingJob.remove();
  }

  return queue.add('sync', data, {
    jobId: `${data.jobId}-resumed-${Date.now()}`,
    priority: 1,
  });
}

/**
 * Cancel a sync job
 */
export async function cancelSyncJob(jobId: string): Promise<boolean> {
  const queue = getSyncQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return false;
  }

  const state = await job.getState();

  if (state === 'active') {
    await job.updateData({
      ...job.data,
      checkpoint: { ...job.data.checkpoint, cancelled: true } as SyncJobData['checkpoint'],
    });
    return true;
  }

  if (state === 'waiting' || state === 'delayed') {
    await job.remove();
    return true;
  }

  return false;
}

/**
 * Create and start a sync worker
 */
export function createSyncWorker(
  processor: (job: Job<SyncJobData>) => Promise<void>
): Worker<SyncJobData> {
  if (syncWorker) {
    logger.warn('Sync worker already exists, returning existing worker');
    return syncWorker;
  }

  try {
    syncWorker = new Worker<SyncJobData>('sync-jobs', processor, {
      connection: getRedisOptions(),
      concurrency: 2,
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    syncWorker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Sync job completed');
    });

    syncWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, error: err }, 'Sync job failed');
    });

    syncWorker.on('error', (err) => {
      logger.error({ error: err }, 'Sync worker error');
    });

    logger.info('Sync worker started');

    return syncWorker;
  } catch (error) {
    throw error;
  }
}

/**
 * Get the current worker instance
 */
export function getWorker(): Worker<SyncJobData> | null {
  return syncWorker;
}

/**
 * Gracefully close queue connections
 */
export async function closeQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (syncWorker) {
    logger.info('Closing sync worker...');
    closePromises.push(syncWorker.close().then(() => {
      syncWorker = null;
    }));
  }

  if (syncQueue) {
    logger.info('Closing sync queue...');
    closePromises.push(syncQueue.close().then(() => {
      syncQueue = null;
    }));
  }

  if (queueEvents) {
    logger.info('Closing queue events...');
    closePromises.push(queueEvents.close().then(() => {
      queueEvents = null;
    }));
  }

  await Promise.all(closePromises);
  logger.info('All queue connections closed');
}

