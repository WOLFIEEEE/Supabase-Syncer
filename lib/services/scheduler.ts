/**
 * Scheduler Service
 *
 * In-memory cron-like scheduler for sync jobs.
 * Supports recurring schedules with timezone handling.
 */

import { logger } from '@/lib/services/logger';

export interface ScheduledJob {
  id: string;
  userId: string;
  name: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  tables: Array<{ tableName: string; enabled: boolean; conflictStrategy?: string }>;
  direction: 'one_way' | 'two_way';
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastRunStatus: 'success' | 'failed' | 'running' | null;
  lastRunJobId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConfig {
  cronExpression: string;
  timezone?: string;
}

// Store for scheduled jobs
const scheduledJobs = new Map<string, ScheduledJob>();

// Store for active timers
const activeTimers = new Map<string, NodeJS.Timeout>();

// Callback for when a scheduled job should run
let onScheduledJobRun: ((job: ScheduledJob) => Promise<void>) | null = null;

/**
 * Parse a simple cron expression
 * Format: minute hour day-of-month month day-of-week
 * Supports: asterisk, specific values, ranges (1-5), lists (1,3,5), steps
 */
function parseCronField(field: string, min: number, max: number): number[] {
  const values: number[] = [];
  
  // Handle *
  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.push(i);
    }
    return values;
  }
  
  // Handle */step
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  }
  
  // Handle ranges and lists
  const parts = field.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) values.push(i);
      }
    } else {
      const val = parseInt(part, 10);
      if (val >= min && val <= max) values.push(val);
    }
  }
  
  return values;
}

/**
 * Calculate next run time based on cron expression
 */
export function calculateNextRun(cronExpression: string, fromDate: Date = new Date()): Date | null {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    
    const [minuteField, hourField, dayField, monthField, dowField] = parts;
    
    const minutes = parseCronField(minuteField, 0, 59);
    const hours = parseCronField(hourField, 0, 23);
    const days = parseCronField(dayField, 1, 31);
    const months = parseCronField(monthField, 1, 12);
    const daysOfWeek = parseCronField(dowField, 0, 6);
    
    // Search forward from current time
    const candidate = new Date(fromDate);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1); // Start from next minute
    
    // Search up to 1 year ahead
    const maxDate = new Date(fromDate);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    while (candidate < maxDate) {
      const month = candidate.getMonth() + 1;
      const day = candidate.getDate();
      const dow = candidate.getDay();
      const hour = candidate.getHours();
      const minute = candidate.getMinutes();
      
      if (
        months.includes(month) &&
        days.includes(day) &&
        daysOfWeek.includes(dow) &&
        hours.includes(hour) &&
        minutes.includes(minute)
      ) {
        return candidate;
      }
      
      // Move to next minute
      candidate.setMinutes(candidate.getMinutes() + 1);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): { valid: boolean; error?: string } {
  const parts = expression.trim().split(/\s+/);
  
  if (parts.length !== 5) {
    return { valid: false, error: 'Cron expression must have 5 fields: minute hour day month day-of-week' };
  }
  
  const [minute, hour, day, month, dow] = parts;
  
  // Basic validation for each field
  const fieldValidation = [
    { field: minute, name: 'minute', min: 0, max: 59 },
    { field: hour, name: 'hour', min: 0, max: 23 },
    { field: day, name: 'day', min: 1, max: 31 },
    { field: month, name: 'month', min: 1, max: 12 },
    { field: dow, name: 'day-of-week', min: 0, max: 6 },
  ];
  
  for (const { field, name, min, max } of fieldValidation) {
    if (field === '*' || field.startsWith('*/')) continue;
    
    const values = field.split(',');
    for (const value of values) {
      if (value.includes('-')) {
        const [start, end] = value.split('-').map(Number);
        if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
          return { valid: false, error: `Invalid range in ${name}: ${value}` };
        }
      } else {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < min || num > max) {
          return { valid: false, error: `Invalid value in ${name}: ${value}` };
        }
      }
    }
  }
  
  return { valid: true };
}

/**
 * Get human-readable description of cron expression
 */
export function describeCron(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid expression';
  
  const [minute, hour, day, month, dow] = parts;
  
  // Common patterns
  if (minute === '0' && hour === '*' && day === '*' && month === '*' && dow === '*') {
    return 'Every hour at minute 0';
  }
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dow === '*') {
    return 'Daily at midnight';
  }
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dow === '0') {
    return 'Every Sunday at midnight';
  }
  if (minute === '0' && hour === '0' && day === '1' && month === '*' && dow === '*') {
    return 'First day of every month at midnight';
  }
  if (minute.startsWith('*/')) {
    const interval = minute.slice(2);
    return `Every ${interval} minutes`;
  }
  if (hour.startsWith('*/')) {
    const interval = hour.slice(2);
    return `Every ${interval} hours`;
  }
  
  return `At ${minute} minutes past ${hour === '*' ? 'every hour' : `hour ${hour}`}`;
}

/**
 * Create a scheduled job
 */
export function createScheduledJob(
  userId: string,
  config: {
    name: string;
    sourceConnectionId: string;
    targetConnectionId: string;
    tables: ScheduledJob['tables'];
    direction: 'one_way' | 'two_way';
    cronExpression: string;
    timezone?: string;
    enabled?: boolean;
  }
): ScheduledJob {
  const id = `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();
  
  const validation = validateCronExpression(config.cronExpression);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const nextRunAt = config.enabled !== false 
    ? calculateNextRun(config.cronExpression) 
    : null;
  
  const job: ScheduledJob = {
    id,
    userId,
    name: config.name,
    sourceConnectionId: config.sourceConnectionId,
    targetConnectionId: config.targetConnectionId,
    tables: config.tables,
    direction: config.direction,
    cronExpression: config.cronExpression,
    timezone: config.timezone || 'UTC',
    enabled: config.enabled !== false,
    lastRunAt: null,
    nextRunAt,
    lastRunStatus: null,
    lastRunJobId: null,
    createdAt: now,
    updatedAt: now,
  };
  
  scheduledJobs.set(id, job);
  
  if (job.enabled) {
    scheduleNextRun(job);
  }
  
  return job;
}

/**
 * Schedule the next run for a job
 */
function scheduleNextRun(job: ScheduledJob): void {
  // Clear existing timer
  const existingTimer = activeTimers.get(job.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
    activeTimers.delete(job.id);
  }
  
  if (!job.enabled || !job.nextRunAt) return;
  
  const delay = job.nextRunAt.getTime() - Date.now();
  if (delay < 0) {
    // Time has passed, calculate next run
    const nextRun = calculateNextRun(job.cronExpression);
    if (nextRun) {
      job.nextRunAt = nextRun;
      scheduledJobs.set(job.id, job);
      scheduleNextRun(job);
    }
    return;
  }
  
  // Maximum setTimeout delay (about 24.8 days)
  const maxDelay = 2147483647;
  
  if (delay > maxDelay) {
    // Schedule a check closer to the time
    const timer = setTimeout(() => {
      scheduleNextRun(job);
    }, maxDelay);
    activeTimers.set(job.id, timer);
  } else {
    // Schedule the actual run
    const timer = setTimeout(async () => {
      await executeScheduledJob(job);
    }, delay);
    activeTimers.set(job.id, timer);
  }
}

/**
 * Execute a scheduled job
 */
async function executeScheduledJob(job: ScheduledJob): Promise<void> {
  if (!onScheduledJobRun) {
    logger.error('No scheduled job handler registered');
    return;
  }
  
  // Update job status
  job.lastRunAt = new Date();
  job.lastRunStatus = 'running';
  scheduledJobs.set(job.id, job);
  
  try {
    await onScheduledJobRun(job);
    job.lastRunStatus = 'success';
  } catch (error) {
    logger.error('Scheduled job failed', { jobId: job.id, error });
    job.lastRunStatus = 'failed';
  }
  
  // Calculate next run
  job.nextRunAt = calculateNextRun(job.cronExpression);
  job.updatedAt = new Date();
  scheduledJobs.set(job.id, job);
  
  // Schedule next run
  if (job.enabled) {
    scheduleNextRun(job);
  }
}

/**
 * Register handler for scheduled job execution
 */
export function registerScheduledJobHandler(
  handler: (job: ScheduledJob) => Promise<void>
): void {
  onScheduledJobRun = handler;
}

/**
 * Get all scheduled jobs for a user
 */
export function getScheduledJobs(userId: string): ScheduledJob[] {
  return Array.from(scheduledJobs.values())
    .filter(job => job.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get a scheduled job by ID
 */
export function getScheduledJob(id: string, userId: string): ScheduledJob | undefined {
  const job = scheduledJobs.get(id);
  if (job && job.userId === userId) {
    return job;
  }
  return undefined;
}

/**
 * Update a scheduled job
 */
export function updateScheduledJob(
  id: string,
  userId: string,
  updates: Partial<Pick<ScheduledJob, 'name' | 'cronExpression' | 'timezone' | 'enabled' | 'tables'>>
): ScheduledJob | null {
  const job = scheduledJobs.get(id);
  if (!job || job.userId !== userId) return null;
  
  if (updates.cronExpression) {
    const validation = validateCronExpression(updates.cronExpression);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }
  
  const updatedJob: ScheduledJob = {
    ...job,
    ...updates,
    updatedAt: new Date(),
  };
  
  // Recalculate next run if cron or enabled changed
  if (updates.cronExpression || updates.enabled !== undefined) {
    updatedJob.nextRunAt = updatedJob.enabled 
      ? calculateNextRun(updatedJob.cronExpression) 
      : null;
  }
  
  scheduledJobs.set(id, updatedJob);
  
  // Reschedule
  if (updatedJob.enabled) {
    scheduleNextRun(updatedJob);
  } else {
    const timer = activeTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      activeTimers.delete(id);
    }
  }
  
  return updatedJob;
}

/**
 * Delete a scheduled job
 */
export function deleteScheduledJob(id: string, userId: string): boolean {
  const job = scheduledJobs.get(id);
  if (!job || job.userId !== userId) return false;
  
  // Clear timer
  const timer = activeTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(id);
  }
  
  return scheduledJobs.delete(id);
}

/**
 * Trigger a scheduled job immediately
 */
export async function triggerScheduledJob(id: string, userId: string): Promise<boolean> {
  const job = scheduledJobs.get(id);
  if (!job || job.userId !== userId) return false;
  
  await executeScheduledJob(job);
  return true;
}

/**
 * Get system stats
 */
export function getSchedulerStats() {
  const jobs = Array.from(scheduledJobs.values());
  return {
    total: jobs.length,
    enabled: jobs.filter(j => j.enabled).length,
    disabled: jobs.filter(j => !j.enabled).length,
    running: jobs.filter(j => j.lastRunStatus === 'running').length,
  };
}

// Common cron presets
export const CRON_PRESETS = {
  everyMinute: '* * * * *',
  every5Minutes: '*/5 * * * *',
  every15Minutes: '*/15 * * * *',
  every30Minutes: '*/30 * * * *',
  everyHour: '0 * * * *',
  every6Hours: '0 */6 * * *',
  every12Hours: '0 */12 * * *',
  daily: '0 0 * * *',
  dailyAt9AM: '0 9 * * *',
  weekly: '0 0 * * 0',
  monthly: '0 0 1 * *',
};

