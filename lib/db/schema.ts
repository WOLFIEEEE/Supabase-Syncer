import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';

// Enums
export const environmentEnum = pgEnum('environment', ['production', 'development']);
export const syncDirectionEnum = pgEnum('sync_direction', ['one_way', 'two_way']);
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'running', 'completed', 'failed', 'paused']);
export const logLevelEnum = pgEnum('log_level', ['info', 'warn', 'error']);

// Connections table - stores encrypted database credentials
export const connections = pgTable('connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users(id) - enforced by Supabase RLS
  name: varchar('name', { length: 255 }).notNull(),
  encryptedUrl: text('encrypted_url').notNull(),
  environment: environmentEnum('environment').notNull(),
  // Keep Alive feature - prevents Supabase from pausing inactive databases
  keepAlive: boolean('keep_alive').default(false).notNull(),
  lastPingedAt: timestamp('last_pinged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sync jobs table - stores sync job records
export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users(id) - enforced by Supabase RLS
  sourceConnectionId: uuid('source_connection_id').references(() => connections.id).notNull(),
  targetConnectionId: uuid('target_connection_id').references(() => connections.id).notNull(),
  direction: syncDirectionEnum('direction').notNull().default('one_way'),
  status: syncStatusEnum('status').notNull().default('pending'),
  tablesConfig: jsonb('tables_config').$type<{
    tableName: string;
    enabled: boolean;
    conflictStrategy?: string;
  }[]>().notNull().default([]),
  progress: jsonb('progress').$type<{
    totalTables: number;
    completedTables: number;
    currentTable: string | null;
    totalRows: number;
    processedRows: number;
    insertedRows: number;
    updatedRows: number;
    skippedRows: number;
    errors: number;
  } | null>(),
  checkpoint: jsonb('checkpoint').$type<{
    lastTable: string;
    lastRowId: string;
    lastUpdatedAt: string;
    processedTables: string[];
  } | null>(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sync logs table - audit trail
export const syncLogs = pgTable('sync_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  syncJobId: uuid('sync_job_id').references(() => syncJobs.id).notNull(),
  level: logLevelEnum('level').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for use in application
export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;

export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;

// Note: Usage limits tables are defined in SQL migrations (004_add_usage_limits.sql)
// They are managed via Supabase client directly, not through Drizzle ORM

