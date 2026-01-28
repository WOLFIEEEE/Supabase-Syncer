import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { SyncJobData } from '@/types';
import { logger } from '@/lib/services/logger';

// Redis connection
const getRedisConnection = () => {
  // In Docker: redis://redis:6379 (service name)
  // In local dev: redis://localhost:6379
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Reconnect on READONLY errors
        return true;
      }
      return false;
    },
  });
};

// Promise-based singleton instances to prevent race conditions
// Multiple concurrent calls will share the same promise
let syncQueuePromise: Promise<Queue<SyncJobData>> | null = null;
let queueEventsPromise: Promise<QueueEvents> | null = null;

// Cached instances for synchronous access after initialization
let syncQueueInstance: Queue<SyncJobData> | null = null;
let queueEventsInstance: QueueEvents | null = null;

/**
 * Get the sync job queue (creates if not exists) - async version with race protection
 */
export async function getSyncQueueAsync(): Promise<Queue<SyncJobData>> {
  if (!syncQueuePromise) {
    syncQueuePromise = Promise.resolve().then(() => {
      const queue = new Queue<SyncJobData>('sync-jobs', {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            count: 50, // Keep last 50 failed jobs
          },
        },
      });
      syncQueueInstance = queue;
      return queue;
    });
  }
  return syncQueuePromise;
}

/**
 * Get the sync job queue (creates if not exists) - sync version for backward compatibility
 */
export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueueInstance) {
    syncQueueInstance = new Queue<SyncJobData>('sync-jobs', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs
        },
      },
    });
    syncQueuePromise = Promise.resolve(syncQueueInstance);
  }
  return syncQueueInstance;
}

/**
 * Get queue events for listening to job updates - async version with race protection
 */
export async function getQueueEventsAsync(): Promise<QueueEvents> {
  if (!queueEventsPromise) {
    queueEventsPromise = Promise.resolve().then(() => {
      const events = new QueueEvents('sync-jobs', {
        connection: getRedisConnection(),
      });
      queueEventsInstance = events;
      return events;
    });
  }
  return queueEventsPromise;
}

/**
 * Get queue events for listening to job updates - sync version for backward compatibility
 */
export function getQueueEvents(): QueueEvents {
  if (!queueEventsInstance) {
    queueEventsInstance = new QueueEvents('sync-jobs', {
      connection: getRedisConnection(),
    });
    queueEventsPromise = Promise.resolve(queueEventsInstance);
  }
  return queueEventsInstance;
}

/**
 * Add a sync job to the queue
 */
export async function addSyncJob(data: SyncJobData): Promise<Job<SyncJobData>> {
  const queue = getSyncQueue();
  
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
  
  // BullMQ doesn't have built-in pause for individual jobs
  // We'll use a custom approach by updating job data
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

  // Remove the old job if exists
  const existingJob = await queue.getJob(data.jobId);
  if (existingJob) {
    try {
      await existingJob.remove();
    } catch (error) {
      // Log but don't fail - the job might have already been removed
      logger.warn(`Failed to remove existing job ${data.jobId}`, { jobId: data.jobId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // Add new job with checkpoint
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
    // Can't cancel active job directly, mark for cancellation
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
 * Create a sync worker (should be called in a separate process)
 */
export function createSyncWorker(
  processor: (job: Job<SyncJobData>) => Promise<void>
): Worker<SyncJobData> {
  return new Worker<SyncJobData>('sync-jobs', processor, {
    connection: getRedisConnection(),
    concurrency: 2, // Process 2 jobs at a time
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  });
}

/**
 * Gracefully close queue connections
 */
export async function closeQueues(): Promise<void> {
  if (syncQueueInstance) {
    await syncQueueInstance.close();
    syncQueueInstance = null;
    syncQueuePromise = null;
  }
  if (queueEventsInstance) {
    await queueEventsInstance.close();
    queueEventsInstance = null;
    queueEventsPromise = null;
  }
}

