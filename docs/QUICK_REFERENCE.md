# Quick Reference: Backend vs Database Usage

## 🚀 Backend Server (Coolify) - Heavy Processing

### Sync Operations
- ✅ Create sync job
- ✅ Start/Stop/Pause sync
- ✅ Stream sync progress (SSE)
- ✅ Get sync metrics
- ✅ Validate sync config
- ✅ Generate migration SQL

### Connection Operations
- ✅ Execute SQL queries
- ✅ Get database schema
- ✅ Test connections

### Explorer Operations
- ✅ List tables (with metadata)
- ✅ Get table rows (paginated)

### Admin Operations
- ✅ All admin routes (users, jobs, analytics, security, export)

---

## 💾 Direct Database (Supabase) - Lightweight Operations

### Connection Management
- ✅ List connections (user-scoped)
- ✅ Create/Read/Update/Delete connections
- ✅ Update keep-alive status

### Sync Job Management
- ✅ List sync jobs (user-scoped)
- ✅ Get/Update/Delete sync jobs

### Explorer Row Operations
- ✅ Get/Insert/Update/Delete single rows

### System Operations
- ✅ Status checks
- ✅ Health checks
- ✅ Sessions
- ✅ CSRF tokens
- ✅ Usage stats
- ✅ Cron jobs

---

## 📋 Quick Decision Guide

**Use Backend if:**
- Processing takes >1 second
- Complex SQL generation
- Schema analysis
- Background jobs
- Streaming data
- Admin/system-wide operations

**Use Direct Database if:**
- Simple CRUD
- User-scoped data
- Fast response needed
- Lightweight queries
- Status/health checks

---

For detailed information, see [ARCHITECTURE_DATA_FLOW.md](./ARCHITECTURE_DATA_FLOW.md)
