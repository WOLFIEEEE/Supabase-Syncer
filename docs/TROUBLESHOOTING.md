# Troubleshooting Guide

Common issues and solutions for Suparbase.

---

## Quick Diagnosis

Run these checks first:

1. **Frontend Health**: `curl https://your-domain.com/api/health`
2. **Backend Health**: `curl https://your-backend/health`
3. **Backend via Frontend**: `curl https://your-domain.com/api/backend-health`

---

## Common Issues

### 1. "Backend Offline" in Admin Dashboard

**Symptoms**:
- Admin dashboard shows backend as offline
- API calls to backend fail

**Causes & Solutions**:

1. **CORS Issue**
   - The frontend calls backend directly from the browser
   - Solution: Use `/api/backend-health` proxy endpoint
   - Ensure `FRONTEND_URL` is set in backend env

2. **Backend Not Running**
   - Check Coolify logs
   - Verify container is healthy
   - Check `docker ps` output

3. **Wrong Backend URL**
   - Verify `BACKEND_URL` in Vercel env
   - Ensure URL is accessible from Vercel servers

**Fix**:
```bash
# Test from command line (should work)
curl http://your-backend.com/health

# If this fails, check backend logs
```

---

### 2. "Encrypted URL is required" Error

**Symptoms**:
- Data explorer fails to load tables
- Error message about encrypted URL

**Cause**: 
- Frontend not passing `encryptedUrl` to backend

**Solution**:
- This was fixed in the explorer routes
- Ensure you have the latest code deployed

---

### 3. Authentication Errors (401)

**Symptoms**:
- "Authentication required" errors
- Redirected to login unexpectedly

**Causes & Solutions**:

1. **Expired Session**
   - Log out and log back in
   - Check Supabase auth settings

2. **Missing Token**
   - Verify `Authorization` header is sent
   - Check browser dev tools > Network

3. **Invalid Supabase Config**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Check Supabase project status

---

### 4. CSRF Token Errors

**Symptoms**:
- Write operations fail with CSRF error
- "CSRF validation failed" message

**Causes & Solutions**:

1. **Missing CSRF Token**
   - Fetch token before write: `GET /api/csrf`
   - Include in header: `X-CSRF-Token: <token>`

2. **Expired Token**
   - Tokens expire after 1 hour
   - Refresh the page to get new token

3. **Same-Origin Issue**
   - Ensure requests come from same domain
   - Check cookie settings

---

### 5. Connection Test Fails

**Symptoms**:
- "Connection failed" when testing database
- Timeout errors

**Causes & Solutions**:

1. **Wrong Connection String**
   - Verify PostgreSQL URL format: `postgresql://user:pass@host:port/db`
   - Check for special characters in password (URL encode them)

2. **Network/Firewall**
   - Ensure database allows connections from Vercel/Coolify IPs
   - Check Supabase connection pooling settings

3. **SSL Required**
   - Add `?sslmode=require` to connection string
   - Supabase requires SSL

**Test Connection String**:
```bash
# From your backend server
psql "postgresql://user:pass@host:port/db?sslmode=require"
```

---

### 6. Sync Job Stuck at "Running"

**Symptoms**:
- Sync job shows running but never completes
- No progress updates

**Causes & Solutions**:

1. **Backend Disconnected**
   - Check backend health
   - Verify SSE stream connection

2. **Redis Queue Issue**
   - Check Redis connection
   - Verify queue workers are running

3. **Large Dataset**
   - Sync may take time for large tables
   - Check backend logs for progress

**Debug**:
```bash
# Check backend logs
docker logs your-backend-container

# Check Redis queue
redis-cli LLEN bull:sync-queue:wait
```

---

### 7. "Rate Limit Exceeded"

**Symptoms**:
- 429 Too Many Requests errors
- Operations fail intermittently

**Solution**:
- Wait for the retry period (check `Retry-After` header)
- Reduce request frequency
- Contact support to increase limits

---

### 8. Build Failures

**Frontend (Vercel)**:
```
Type error: ...
```

**Solutions**:
1. Run `npm run build` locally to reproduce
2. Fix TypeScript errors
3. Check for missing dependencies

**Backend (Coolify)**:
```
Module not found: ...
```

**Solutions**:
1. Ensure `package.json` is in `server/` directory
2. Check Dockerfile paths
3. Verify build output

---

### 9. Environment Variable Issues

**Symptoms**:
- Features not working
- Undefined values in logs

**Checklist**:
1. Variables are set in Vercel/Coolify dashboard
2. No quotes around values (unless needed)
3. No trailing spaces
4. Redeployed after adding variables

**Debug**:
```typescript
// Add temporarily to check
console.log('BACKEND_URL:', process.env.BACKEND_URL);
```

---

### 10. Sentry Not Receiving Errors

**Symptoms**:
- No errors in Sentry dashboard
- Events not appearing

**Solutions**:

1. **Check DSN**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   - DSN format: `https://xxx@xxx.ingest.sentry.io/xxx`

2. **Production Only**
   - Sentry is disabled in development by default
   - Check `environment` setting

3. **Ad Blockers**
   - Some ad blockers block Sentry
   - Use tunnel route: `/monitoring`

---

## Health Check Response Guide

### Healthy Response
```json
{
  "status": "healthy",
  "checks": {
    "supabase": { "status": "ok" },
    "backend": { "status": "ok" },
    "redis": { "status": "ok" },
    "encryption": { "status": "ok" }
  }
}
```

### Degraded Response
```json
{
  "status": "degraded",
  "checks": {
    "supabase": { "status": "ok" },
    "backend": { "status": "error", "message": "Connection timeout" },
    "redis": { "status": "ok" },
    "encryption": { "status": "ok" }
  }
}
```

### What Each Check Means

| Check | OK | Error |
|-------|-----|-------|
| `supabase` | Database connected | Check Supabase status |
| `backend` | Backend responsive | Check Coolify logs |
| `redis` | Redis connected | Check Redis service |
| `encryption` | Key configured | Set ENCRYPTION_KEY |

---

## Log Analysis

### Backend Logs (Pino)

```json
{"level":30,"time":1234567890,"msg":"Request completed"}
```

Level meanings:
- 10: trace
- 20: debug
- 30: info
- 40: warn
- 50: error
- 60: fatal

### Common Log Patterns

**Successful request**:
```
INFO Request completed {"method":"GET","url":"/health","statusCode":200}
```

**Failed authentication**:
```
WARN Auth failed {"error":"Invalid token","userId":null}
```

**Database error**:
```
ERROR Database query failed {"error":"connection refused"}
```

---

## Getting Help

1. **Check Logs**: Always check Vercel/Coolify logs first
2. **Health Endpoints**: Use `/api/health` for diagnosis
3. **Sentry**: Check error tracking dashboard
4. **Documentation**: Review API docs at `/api/docs`

### Information to Include in Support Requests

- Health check output
- Error messages (from browser console)
- Request/response details (from Network tab)
- Backend logs (if accessible)
- Environment (production/development)
- Steps to reproduce

---

## Quick Fixes

### Reset Everything

```bash
# Clear browser cache and cookies
# Or in Chrome: Cmd+Shift+Delete

# Redeploy frontend
# (Push empty commit or trigger manual deploy)

# Restart backend
# (In Coolify, click Restart)
```

### Verify Configuration

```bash
# Test Supabase connection
curl "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key"

# Test backend
curl "https://your-backend.com/health"

# Test frontend health
curl "https://your-domain.com/api/health"
```
