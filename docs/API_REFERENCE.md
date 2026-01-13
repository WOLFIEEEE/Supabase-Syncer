# Suparman API Reference

This document provides a comprehensive reference for the Suparman API.

## Base URL

- **Production**: `https://suparbase.com/api`
- **Development**: `http://localhost:3000/api`

## Authentication

Most endpoints require authentication via Supabase Auth. Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Rate Limiting

API requests are rate limited per user:

| Operation Type | Limit |
|---------------|-------|
| Read | 100 requests/minute |
| Write | 20 requests/minute |
| Sync | 10 requests/minute |
| Admin | 50 requests/minute |

When rate limited, you'll receive a `429 Too Many Requests` response with a `Retry-After` header.

---

## Health & Status

### GET /api/health

Returns detailed health status of all system components.

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "supabase": { "status": "ok", "latency": 45 },
    "backend": { "status": "ok", "latency": 120 },
    "redis": { "status": "ok" },
    "encryption": { "status": "ok" }
  },
  "metrics": {
    "memory": {
      "used": 128,
      "total": 512,
      "percentage": 25
    }
  }
}
```

**Status Values**:
- `healthy` - All systems operational
- `degraded` - Some systems have issues
- `unhealthy` - Critical systems are down

---

### GET /api/backend-health

Returns health status of the backend server.

**Authentication**: Not required

**Response**:
```json
{
  "healthy": true,
  "status": "healthy",
  "latency": 120,
  "backend": {
    "url": "http://backend.example.com",
    "version": "1.0.0"
  }
}
```

---

### GET /api/status

Returns comprehensive system status and statistics.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": {
    "application": {
      "status": "ok",
      "version": "1.0.0",
      "uptime": "2h 30m"
    },
    "database": {
      "status": "connected",
      "type": "PostgreSQL (Supabase)",
      "responseTime": 45
    },
    "connections": {
      "total": 5,
      "production": 2,
      "development": 3,
      "keepAliveActive": 3
    }
  }
}
```

---

## Connections

### GET /api/connections

List all database connections for the authenticated user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production DB",
      "environment": "production",
      "keep_alive": true,
      "last_pinged_at": "2026-01-13T12:00:00.000Z",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/connections

Create a new database connection.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "My Database",
  "databaseUrl": "postgresql://user:pass@host:5432/dbname",
  "environment": "development"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Database",
    "environment": "development",
    "created_at": "2026-01-13T12:00:00.000Z"
  }
}
```

**Errors**:
- `400` - Invalid input (validation error)
- `403` - Connection limit reached

---

### GET /api/connections/{id}

Get a specific connection by ID.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Database",
    "environment": "development",
    "keep_alive": false,
    "created_at": "2026-01-13T12:00:00.000Z"
  }
}
```

---

### PUT /api/connections/{id}

Update an existing connection.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Updated Name",
  "environment": "production"
}
```

---

### DELETE /api/connections/{id}

Delete a connection.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Connection deleted"
}
```

---

### POST /api/connections/{id}/test

Test if a connection is working.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "latency": 45,
    "version": "PostgreSQL 15.2"
  }
}
```

---

### GET /api/connections/{id}/schema

Get the database schema for a connection.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "columns": [
          { "name": "id", "type": "uuid", "nullable": false },
          { "name": "email", "type": "text", "nullable": false }
        ]
      }
    ]
  }
}
```

---

### POST /api/connections/{id}/execute

Execute SQL on a connection.

**Authentication**: Required  
**CSRF Protection**: Required

**Request Body**:
```json
{
  "sql": "SELECT * FROM users LIMIT 10",
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "rows": [...],
    "rowCount": 10
  }
}
```

**Warning**: Production databases require confirmation header:
```
X-Confirm-Production: true
```

---

## Sync Jobs

### GET /api/sync

List all sync jobs.

**Authentication**: Required

**Query Parameters**:
- `limit` (default: 50)
- `offset` (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

---

### POST /api/sync

Create a new sync job.

**Authentication**: Required  
**CSRF Protection**: Required

**Request Body**:
```json
{
  "sourceConnectionId": "uuid",
  "targetConnectionId": "uuid",
  "direction": "one_way",
  "tables": [
    {
      "tableName": "users",
      "enabled": true,
      "conflictStrategy": "last_write_wins"
    }
  ],
  "dryRun": false
}
```

**Direction Values**:
- `one_way` - Source to target only
- `two_way` - Bidirectional sync

**Conflict Strategies**:
- `last_write_wins` - Most recent write wins
- `source_wins` - Source always wins
- `target_wins` - Target always wins
- `manual` - Requires manual resolution

---

### POST /api/sync/{id}/start

Start or resume a sync job.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "running",
    "streamUrl": "/api/sync/uuid/stream"
  }
}
```

---

### POST /api/sync/{id}/stop

Stop a running sync job.

**Authentication**: Required

---

### POST /api/sync/{id}/pause

Pause a running sync job (can be resumed).

**Authentication**: Required

---

### GET /api/sync/{id}/stream

Stream sync progress via Server-Sent Events (SSE).

**Authentication**: Required

**Event Types**:
```
event: progress
data: {"table": "users", "processed": 100, "total": 1000}

event: complete
data: {"status": "completed", "duration": 45000}

event: error
data: {"error": "Connection lost"}
```

---

### POST /api/sync/validate

Validate sync configuration before creating a job.

**Authentication**: Required

**Request Body**:
```json
{
  "sourceConnectionId": "uuid",
  "targetConnectionId": "uuid",
  "tables": ["users", "posts"]
}
```

---

### POST /api/sync/generate-migration

Generate SQL migration script.

**Authentication**: Required

**Request Body**:
```json
{
  "sourceConnectionId": "uuid",
  "targetConnectionId": "uuid",
  "tables": ["users"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sql": "ALTER TABLE users ADD COLUMN...",
    "changes": [...]
  }
}
```

---

## Explorer

### GET /api/explorer/{connectionId}/tables

List all tables in a database.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "rowCount": 1000,
        "columnCount": 10,
        "columns": [...]
      }
    ],
    "total": 15
  }
}
```

---

### GET /api/explorer/{connectionId}/{table}/rows

Get paginated rows from a table.

**Authentication**: Required

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `orderBy` (default: "id")
- `orderDir` (asc|desc, default: "desc")

**Response**:
```json
{
  "success": true,
  "data": {
    "rows": [...],
    "total": 1000,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### GET /api/explorer/{connectionId}/{table}/row

Get a single row by ID.

**Authentication**: Required

**Query Parameters**:
- `id` - Row primary key value

---

### POST /api/explorer/{connectionId}/{table}/row

Insert a new row.

**Authentication**: Required  
**CSRF Protection**: Required

**Request Body**:
```json
{
  "data": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### PUT /api/explorer/{connectionId}/{table}/row

Update an existing row.

**Authentication**: Required  
**CSRF Protection**: Required

**Request Body**:
```json
{
  "id": "row-id",
  "data": {
    "name": "Jane Doe"
  }
}
```

---

### DELETE /api/explorer/{connectionId}/{table}/row

Delete a row.

**Authentication**: Required  
**CSRF Protection**: Required

**Query Parameters**:
- `id` - Row primary key value

---

## Admin Endpoints

Admin endpoints require the authenticated user to be an admin.

### GET /api/admin/users

List all users.

### GET /api/admin/sync-jobs

List all sync jobs across all users.

### GET /api/admin/analytics

Get system analytics.

### GET /api/admin/security-events

Get security events.

### GET /api/admin/export

Export system data.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes**:

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## CSRF Protection

Write operations (POST, PUT, DELETE) require CSRF protection:

1. Get a CSRF token: `GET /api/csrf`
2. Include the token in requests:
   - Header: `X-CSRF-Token: <token>`
   - Or cookie: `csrf_token` (automatically included)

---

## OpenAPI Specification

Full OpenAPI 3.0 specification is available at:
```
GET /api/docs?format=openapi
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/connections', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const { data } = await response.json();
```

### cURL

```bash
curl -X GET https://suparbase.com/api/connections \
  -H "Authorization: Bearer YOUR_TOKEN"
```
