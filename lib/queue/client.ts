import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { SyncJobData } from '@/types';

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

// Singleton instances
let syncQueue: Queue<SyncJobData> | null = null;
let queueEvents: QueueEvents | null = null;

/**
 * Get the sync job queue (creates if not exists)
 */
export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueue) {
    syncQueue = new Queue<SyncJobData>('sync-jobs', {
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
  }
  return syncQueue;
}

/**
 * Get queue events for listening to job updates
 */
export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents('sync-jobs', {
      connection: getRedisConnection(),
    });
  }
  return queueEvents;
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
    await existingJob.remove();
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
  if (syncQueue) {
    await syncQueue.close();
    syncQueue = null;
  }
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
}

