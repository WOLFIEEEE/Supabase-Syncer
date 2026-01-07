# Storage Architecture

This document explains the storage architecture of Supabase Syncer, including the different storage backends and when each is used.

## Overview

Supabase Syncer supports **dual storage systems** to provide flexibility in deployment:

1. **Supabase Backend** (Default, Recommended)
2. **Custom PostgreSQL with Drizzle ORM** (Optional)

---

## Storage Backends

### 1. Supabase Backend (Default)

**Location:** `lib/db/supabase-store.ts`

**When Used:**
- By default when `DATABASE_URL` is NOT set
- Recommended for production deployments
- Used by all API routes and UI components

**Features:**
- ✅ Row Level Security (RLS) built-in
- ✅ Real-time subscriptions
- ✅ Automatic backups
- ✅ User isolation via `auth.users(id)`
- ✅ Server-side session management
- ✅ Managed service (no maintenance needed)

**Schema:**
The Supabase schema is defined in SQL migrations located at:
- `supabase/migrations/001_create_tables.sql` - Initial schema
- `supabase/migrations/002_add_keep_alive.sql` - Keep-alive feature
- `supabase/migrations/003_add_email_notifications.sql` - Email tracking
- `supabase/migrations/004_add_usage_limits.sql` - Usage tracking

**Tables:**
- `connections` - Stores encrypted database connection URLs
- `sync_jobs` - Tracks synchronization jobs
- `sync_logs` - Audit trail for sync operations
- `user_settings` - User preferences
- `usage_limits` - Usage tracking and limits
- `email_notifications` - Email notification log

**Security:**
All tables have RLS policies that ensure users can only access their own data:
```sql
CREATE POLICY "Users can view their own connections"
    ON connections FOR SELECT
    USING (auth.uid() = user_id);
```

---

### 2. Custom PostgreSQL with Drizzle ORM (Optional)

**Location:** `lib/db/schema.ts`

**When Used:**
- Only when `DATABASE_URL` environment variable is set
- Used by the queue worker (`lib/queue/sync.worker.ts`)
- For self-hosted deployments with custom PostgreSQL

**Features:**
- ✅ Full control over database
- ✅ Type-safe queries with Drizzle ORM
- ✅ Migration support via `drizzle-kit`
- ⚠️ No built-in RLS (must be configured manually)
- ⚠️ Requires manual user_id filtering in queries

**Schema:**
The Drizzle schema is defined in TypeScript:
- `lib/db/schema.ts` - TypeScript schema definition
- `lib/db/migrations/` - Generated SQL migrations

**Migration Commands:**
```bash
# Generate migration files from schema
npm run db:generate

# Run migrations on DATABASE_URL
npm run db:migrate

# Push schema changes directly (dev only)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

**Security Note:**
When using Drizzle with a custom database, you **must** manually filter queries by `user_id`:
```typescript
// ✅ CORRECT - Filters by user_id
const connection = await db.query.connections.findFirst({
  where: and(
    eq(connections.id, connectionId),
    eq(connections.userId, userId) // Security filter
  ),
});

// ❌ WRONG - Missing user_id filter (security vulnerability)
const connection = await db.query.connections.findFirst({
  where: eq(connections.id, connectionId),
});
```

---

### 3. In-Memory Store (Testing Only)

**Location:** `lib/db/memory-store.ts`

**When Used:**
- Only for testing and development
- Not used in production

**Features:**
- ✅ Zero setup required
- ✅ Fast for tests
- ⚠️ Data not persisted
- ⚠️ Resets on server restart

---

## How Storage Backend is Selected

The application uses a factory pattern to select the appropriate storage backend:

**File:** `lib/db/index.ts`

```typescript
// Pseudo-code
if (DATABASE_URL is set) {
  use Drizzle ORM with custom PostgreSQL
} else {
  use Supabase (default)
}
```

**Environment Variables:**
```bash
# Option 1: Use Supabase (default)
# No DATABASE_URL needed
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Option 2: Use custom PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

---

## Schema Synchronization

**CRITICAL:** Both storage backends must have matching schemas.

### Supabase Schema
Defined in SQL migrations:
- User ID: `user_id UUID NOT NULL REFERENCES auth.users(id)`
- Tables: connections, sync_jobs, sync_logs, user_settings, etc.

### Drizzle Schema
Defined in TypeScript (`lib/db/schema.ts`):
- User ID: `userId: uuid('user_id').notNull()`
- Tables: connections, syncJobs, syncLogs

**Migration Workflow:**

1. **Supabase** (manual):
   - Run SQL migrations in Supabase SQL Editor
   - Located in `supabase/migrations/`

2. **Custom PostgreSQL** (automatic):
   ```bash
   npm run db:generate  # Generate migration from schema
   npm run db:migrate   # Apply migration
   ```

---

## Queue Worker Storage

The background queue worker (`lib/queue/sync.worker.ts`) uses **Drizzle ORM** to fetch connection details.

**Why Drizzle for Worker?**
- Workers run in separate processes
- Direct database access (bypasses Next.js)
- No Supabase session context available

**Security:**
The worker **must** filter by `user_id` to prevent privilege escalation:
```typescript
const sourceConnection = await db.query.connections.findFirst({
  where: and(
    eq(connections.id, sourceConnectionId),
    eq(connections.userId, userId) // ✅ Required for security
  ),
});
```

---

## Data Flow

### API Routes (Server Components)
```
User Request
  ↓
Next.js API Route
  ↓
Supabase Store (lib/db/supabase-store.ts)
  ↓
Supabase Database (with RLS)
```

### Queue Worker
```
Job Enqueued
  ↓
BullMQ (Redis)
  ↓
Sync Worker (lib/queue/sync.worker.ts)
  ↓
Drizzle ORM (lib/db/client.ts)
  ↓
PostgreSQL (DATABASE_URL or Supabase connection pooler)
```

---

## Best Practices

### For Supabase Backend (Recommended)
1. ✅ Use Supabase for all user-facing operations
2. ✅ Rely on RLS for security
3. ✅ Use server-side Supabase client (`lib/supabase/server.ts`)
4. ✅ Never bypass RLS unless necessary (service role)

### For Custom PostgreSQL
1. ✅ Set `DATABASE_URL` in environment
2. ✅ Run `npm run db:migrate` before deployment
3. ✅ **Always** filter queries by `user_id`
4. ✅ Use parameterized queries (SQL injection prevention)
5. ⚠️ Consider implementing your own RLS

### For Queue Workers
1. ✅ Include `userId` in `SyncJobData`
2. ✅ Filter connections by `userId` in worker
3. ✅ Use structured logger (`lib/services/logger.ts`)
4. ✅ Handle errors gracefully

---

## Migration Checklist

If you modify the schema, you must update **both** storage backends:

- [ ] Update `lib/db/schema.ts` (Drizzle)
- [ ] Run `npm run db:generate` to create migration
- [ ] Create corresponding SQL migration in `supabase/migrations/`
- [ ] Test both backends
- [ ] Update this documentation

---

## Troubleshooting

### Issue: "Connection not found" in worker
**Cause:** Worker missing `userId` or incorrect filtering
**Fix:** Ensure `SyncJobData` includes `userId` and worker filters by it

### Issue: Schema mismatch error
**Cause:** Drizzle schema doesn't match Supabase schema
**Fix:** Regenerate migrations and ensure both are in sync

### Issue: RLS policy violation
**Cause:** Using service role key when user context is needed
**Fix:** Use anon key with user session for user operations

### Issue: Migrations not applied
**Cause:** DATABASE_URL not set or migrations not run
**Fix:** Set DATABASE_URL and run `npm run db:migrate`

---

## Security Considerations

### Row Level Security (RLS)
Supabase automatically enforces RLS policies. When using custom PostgreSQL:
- Implement application-level security
- Always filter by `user_id`
- Use parameterized queries
- Validate user ownership before operations

### Encryption
All database connection URLs are encrypted using AES-256-GCM:
- Encryption key: `ENCRYPTION_KEY` environment variable
- Encrypted before storage
- Decrypted only when needed for sync

### Sensitive Data Logging
The logger (`lib/services/logger.ts`) automatically redacts:
- Database passwords
- API keys
- JWT tokens
- Email addresses (partial)
- Credit card numbers

---

## Future Improvements

Potential enhancements to the storage architecture:

1. **Connection Pooling** - Implement PgBouncer for custom PostgreSQL
2. **Read Replicas** - Route read queries to replicas
3. **Caching Layer** - Add Redis caching for frequent queries
4. **Multi-tenant** - Organization-level data isolation
5. **Audit Logs** - Comprehensive audit trail for all operations
6. **Backup Automation** - Automated backups for custom PostgreSQL

---

## Related Documentation

- [Supabase Migrations](./supabase/migrations/README.md)
- [Database Setup](./docs/DATABASE_SETUP.md)
- [Security Best Practices](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

**Last Updated:** 2026-01-07
**Version:** 1.0.0
