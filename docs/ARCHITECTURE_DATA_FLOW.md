# Architecture & Data Flow Documentation

## Overview

This document outlines what functionality uses the **Backend Server (Coolify)** vs **Direct Database Access (Supabase)** in the application.

---

## 🔴 Backend Server Usage (Coolify)

The backend server handles **heavy processing**, **long-running operations**, and **resource-intensive tasks**.

### API Routes That Proxy to Backend

#### 1. **Sync Operations** (`/api/sync/*`)
- **POST `/api/sync`** - Create sync job
  - File: `app/api/sync/route.ts`
  - Proxies to: `POST /api/sync` (backend)
  - Why: Heavy validation, schema analysis, job initialization

- **POST `/api/sync/[id]/start`** - Start/resume sync job
  - File: `app/api/sync/[id]/start/route.ts`
  - Proxies to: `POST /api/sync/:id/start` (backend)
  - Why: Long-running sync operations, background processing

- **POST `/api/sync/[id]/stop`** - Stop sync job
  - File: `app/api/sync/[id]/stop/route.ts`
  - Proxies to: `POST /api/sync/:id/stop` (backend)
  - Why: Job control, cleanup operations

- **POST `/api/sync/[id]/pause`** - Pause sync job
  - File: `app/api/sync/[id]/pause/route.ts`
  - Proxies to: `POST /api/sync/:id/pause` (backend)
  - Why: Job state management

- **GET `/api/sync/[id]/stream`** - Stream sync progress (SSE)
  - File: `app/api/sync/[id]/stream/route.ts`
  - Proxies to: `GET /api/sync/:id/stream` (backend)
  - Why: Real-time progress streaming, long-lived connections

- **GET `/api/sync/[id]/metrics`** - Get sync metrics
  - File: `app/api/sync/[id]/metrics/route.ts`
  - Proxies to: `GET /api/sync/:id/metrics` (backend)
  - Why: Performance metrics calculation

- **POST `/api/sync/validate`** - Validate sync configuration
  - File: `app/api/sync/validate/route.ts`
  - Proxies to: `POST /api/sync/validate` (backend)
  - Why: Schema validation, compatibility checks

- **POST `/api/sync/generate-migration`** - Generate migration SQL
  - File: `app/api/sync/generate-migration/route.ts`
  - Proxies to: `POST /api/sync/generate-migration` (backend)
  - Why: Complex SQL generation, schema diffing

#### 2. **Connection Operations** (`/api/connections/*`)
- **POST `/api/connections/[id]/execute`** - Execute SQL
  - File: `app/api/connections/[id]/execute/route.ts`
  - Proxies to: `POST /api/connections/:id/execute` (backend)
  - Why: SQL execution, query safety checks, result processing

- **GET `/api/connections/[id]/schema`** - Get database schema
  - File: `app/api/connections/[id]/schema/route.ts`
  - Proxies to: `GET /api/connections/:id/schema` (backend)
  - Why: Schema introspection, table/column analysis

- **POST `/api/connections/[id]/test`** - Test connection
  - File: `app/api/connections/[id]/test/route.ts`
  - Proxies to: `POST /api/connections/:id/test` (backend)
  - Why: Connection testing, validation

#### 3. **Explorer Operations** (`/api/explorer/*`)
- **GET `/api/explorer/[connectionId]/tables`** - List tables
  - File: `app/api/explorer/[connectionId]/tables/route.ts`
  - Proxies to: `GET /api/explorer/:connectionId/tables` (backend)
  - Why: Table listing, schema analysis, row counts

- **GET `/api/explorer/[connectionId]/[table]/rows`** - Get table rows
  - File: `app/api/explorer/[connectionId]/[table]/rows/route.ts`
  - Proxies to: `GET /api/explorer/:connectionId/:table/rows` (backend)
  - Why: Data fetching, pagination, query execution

#### 4. **Admin Operations** (`/api/admin/*`)
- **GET `/api/admin/users`** - List users
  - File: `app/api/admin/users/route.ts`
  - Proxies to: `GET /api/admin/users` (backend)
  - Why: User management, analytics

- **GET `/api/admin/sync-jobs`** - List all sync jobs
  - File: `app/api/admin/sync-jobs/route.ts`
  - Proxies to: `GET /api/admin/sync-jobs` (backend)
  - Why: System-wide job monitoring

- **GET `/api/admin/analytics`** - Get analytics
  - File: `app/api/admin/analytics/route.ts`
  - Proxies to: `GET /api/admin/analytics` (backend)
  - Why: Data aggregation, statistics

- **GET `/api/admin/security-events`** - Get security events
  - File: `app/api/admin/security-events/route.ts`
  - Proxies to: `GET /api/admin/security-events` (backend)
  - Why: Security monitoring, event analysis

- **GET `/api/admin/export`** - Export data
  - File: `app/api/admin/export/route.ts`
  - Proxies to: `GET /api/admin/export` (backend)
  - Why: Data export, file generation

#### 5. **Backend Health Check**
- **GET `/api/backend-health`** - Check backend status
  - File: `app/api/backend-health/route.ts`
  - Uses: Direct fetch to backend (server-side)
  - Why: Health monitoring, status checks

---

## 🟢 Direct Database Access (Supabase)

Direct database access is used for **lightweight operations**, **CRUD operations**, and **user-scoped data**.

### API Routes That Use Direct Database Access

#### 1. **Connection Management** (`/api/connections/*`)
- **GET `/api/connections`** - List user connections
  - File: `app/api/connections/route.ts`
  - Uses: `supabaseConnectionStore.getAll(user.id)`
  - Why: Simple list operation, user-scoped

- **POST `/api/connections`** - Create connection
  - File: `app/api/connections/route.ts`
  - Uses: `supabaseConnectionStore.create(user.id, data)`
  - Why: Simple insert, user-scoped

- **GET `/api/connections/[id]`** - Get connection
  - File: `app/api/connections/[id]/route.ts`
  - Uses: `supabaseConnectionStore.getById(id, user.id)`
  - Why: Simple read, user-scoped

- **PUT `/api/connections/[id]`** - Update connection
  - File: `app/api/connections/[id]/route.ts`
  - Uses: `supabaseConnectionStore.update(id, user.id, data)`
  - Why: Simple update, user-scoped

- **DELETE `/api/connections/[id]`** - Delete connection
  - File: `app/api/connections/[id]/route.ts`
  - Uses: `supabaseConnectionStore.delete(id, user.id)`
  - Why: Simple delete, user-scoped

- **POST `/api/connections/[id]/keep-alive`** - Update keep-alive status
  - File: `app/api/connections/[id]/keep-alive/route.ts`
  - Uses: `supabaseConnectionStore.updateKeepAlive(id, user.id, keepAlive)`
  - Why: Simple boolean update, user-scoped

#### 2. **Sync Job Management** (`/api/sync/*`)
- **GET `/api/sync`** - List user sync jobs
  - File: `app/api/sync/route.ts`
  - Uses: `supabaseSyncJobStore.getAll(user.id, limit, offset)`
  - Why: Simple list operation, user-scoped

- **GET `/api/sync/[id]`** - Get sync job
  - File: `app/api/sync/[id]/route.ts`
  - Uses: `supabaseSyncJobStore.getById(id, user.id)`
  - Why: Simple read, user-scoped

- **PUT `/api/sync/[id]`** - Update sync job
  - File: `app/api/sync/[id]/route.ts`
  - Uses: `supabaseSyncJobStore.update(id, user.id, data)`
  - Why: Simple update, user-scoped

- **DELETE `/api/sync/[id]`** - Delete sync job
  - File: `app/api/sync/[id]/route.ts`
  - Uses: `supabaseSyncJobStore.delete(id, user.id)`
  - Why: Simple delete, user-scoped

#### 3. **Explorer Row Operations** (`/api/explorer/*`)
- **GET `/api/explorer/[connectionId]/[table]/row`** - Get single row
  - File: `app/api/explorer/[connectionId]/[table]/row/route.ts`
  - Uses: Direct Drizzle connection to user's database
  - Why: Simple read, lightweight operation

- **POST `/api/explorer/[connectionId]/[table]/row`** - Insert row
  - File: `app/api/explorer/[connectionId]/[table]/row/route.ts`
  - Uses: Direct Drizzle connection to user's database
  - Why: Simple insert, lightweight operation

- **PUT `/api/explorer/[connectionId]/[table]/row`** - Update row
  - File: `app/api/explorer/[connectionId]/[table]/row/route.ts`
  - Uses: Direct Drizzle connection to user's database
  - Why: Simple update, lightweight operation

- **DELETE `/api/explorer/[connectionId]/[table]/row`** - Delete row
  - File: `app/api/explorer/[connectionId]/[table]/row/route.ts`
  - Uses: Direct Drizzle connection to user's database
  - Why: Simple delete, lightweight operation

#### 4. **Cron Jobs** (`/api/cron/*`)
- **GET `/api/cron/keep-alive`** - Keep-alive cron job
  - File: `app/api/cron/keep-alive/route.ts`
  - Uses: `supabaseConnectionStore.getAllForService()`
  - Why: Scheduled task, direct database access

#### 5. **Status & Health** (`/api/status`, `/api/health`)
- **GET `/api/status`** - System status
  - File: `app/api/status/route.ts`
  - Uses: Direct Supabase queries for stats
  - Why: Lightweight status check

- **GET `/api/health`** - Health check
  - File: `app/api/health/route.ts`
  - Uses: Environment variable checks
  - Why: Simple health check

#### 6. **Other Routes**
- **GET `/api/features`** - Feature flags
  - File: `app/api/features/route.ts`
  - Uses: Environment variables
  - Why: Simple configuration

- **GET `/api/version`** - Version info
  - File: `app/api/version/route.ts`
  - Uses: Package.json
  - Why: Simple read

- **GET `/api/usage`** - Usage stats
  - File: `app/api/usage/route.ts`
  - Uses: Direct Supabase queries
  - Why: User-scoped stats

- **GET `/api/sessions`** - List sessions
  - File: `app/api/sessions/route.ts`
  - Uses: Supabase auth
  - Why: Session management

- **GET `/api/sessions/[id]`** - Get session
  - File: `app/api/sessions/[id]/route.ts`
  - Uses: Supabase auth
  - Why: Session read

- **GET `/api/csrf`** - CSRF token
  - File: `app/api/csrf/route.ts`
  - Uses: Session-based token generation
  - Why: Security token

---

## 📊 Summary Table

| Category | Backend Server | Direct Database |
|----------|---------------|-----------------|
| **Sync Operations** | Create, Start, Stop, Pause, Stream, Metrics, Validate, Generate Migration | List, Get, Update, Delete |
| **Connection Operations** | Execute SQL, Get Schema, Test Connection | CRUD (Create, Read, Update, Delete), Keep-Alive |
| **Explorer Operations** | List Tables, Get Rows (paginated) | Get/Insert/Update/Delete Single Row |
| **Admin Operations** | All admin routes (Users, Sync Jobs, Analytics, Security, Export) | None |
| **Status & Health** | Backend Health Check | Frontend Health, Status |
| **Other** | None | Sessions, CSRF, Features, Version, Usage, Cron |

---

## 🔄 Data Flow Patterns

### Pattern 1: Frontend → Backend Server
```
Browser → Frontend API Route → Backend Server (Coolify) → User's Database
```
**Used for:** Heavy processing, long-running operations, complex queries

### Pattern 2: Frontend → Direct Database
```
Browser → Frontend API Route → Supabase Database
```
**Used for:** Simple CRUD, user-scoped data, lightweight operations

### Pattern 3: Frontend → Direct User Database
```
Browser → Frontend API Route → User's Database (via Drizzle)
```
**Used for:** Explorer row operations, simple queries

---

## 🎯 Decision Criteria

### Use Backend Server When:
- ✅ Heavy processing required
- ✅ Long-running operations (>30 seconds)
- ✅ Complex SQL generation
- ✅ Schema analysis/introspection
- ✅ Background job processing
- ✅ Real-time streaming (SSE)
- ✅ System-wide operations (admin)

### Use Direct Database When:
- ✅ Simple CRUD operations
- ✅ User-scoped data access
- ✅ Lightweight queries
- ✅ Fast response needed (<1 second)
- ✅ No heavy processing required
- ✅ Status/health checks

---

## 📝 Notes

1. **Connection URLs**: Always stored encrypted in Supabase, decrypted only when needed
2. **Authentication**: All routes require user authentication via Supabase
3. **Rate Limiting**: Applied to both backend and direct database routes
4. **Error Handling**: Consistent error responses across all routes
5. **Security**: Row Level Security (RLS) enforced on all Supabase queries

---

## 🔍 Files Reference

### Backend Client
- `lib/utils/backend-client.ts` - Backend HTTP client
- `lib/utils/proxy-handler.ts` - Proxy utilities

### Database Stores
- `lib/db/supabase-store.ts` - Supabase direct access
- `lib/services/drizzle-factory.ts` - Direct database connections

### Backend Routes
- `server/src/routes/*` - Backend API routes

### Frontend Routes
- `app/api/*` - Frontend API routes
