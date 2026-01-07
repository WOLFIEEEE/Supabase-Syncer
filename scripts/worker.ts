/**
 * Background worker script for processing sync jobs
 * 
 * Run with: npx tsx scripts/worker.ts
 */

import { startSyncWorker } from '../lib/queue/sync.worker';

console.log('Starting sync worker...');

// Start the worker
startSyncWorker();

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down worker...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down worker...');
  process.exit(0);
});



