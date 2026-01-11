/**
 * Structured Logging Utility
 * 
 * Production-ready logging with pino
 */

import pino from 'pino';
import { config } from '../config.js';

// Create base logger
export const logger = pino({
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
  base: {
    service: 'supabase-syncer-backend',
    version: process.env.npm_package_version || '1.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Child logger factory for request-scoped logging
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
  });
}

// Child logger factory for job-scoped logging
export function createJobLogger(jobId: string, userId?: string) {
  return logger.child({
    jobId,
    userId,
    type: 'job',
  });
}

// Log levels helper
export const log = {
  debug: (msg: string, data?: object) => logger.debug(data, msg),
  info: (msg: string, data?: object) => logger.info(data, msg),
  warn: (msg: string, data?: object) => logger.warn(data, msg),
  error: (msg: string, error?: Error | unknown, data?: object) => {
    if (error instanceof Error) {
      logger.error({ ...data, err: error }, msg);
    } else {
      logger.error({ ...data, error }, msg);
    }
  },
  fatal: (msg: string, error?: Error | unknown, data?: object) => {
    if (error instanceof Error) {
      logger.fatal({ ...data, err: error }, msg);
    } else {
      logger.fatal({ ...data, error }, msg);
    }
  },
};

export default logger;

