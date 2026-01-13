# CORS Configuration Guide

## Overview

This project uses a **proxy pattern** to avoid CORS issues between frontend (Vercel) and backend (Coolify).

## Architecture

```
Browser → Frontend API Route (server-side) → Backend API
         (No CORS issues)                    (Direct connection)
```

## Frontend Configuration

### Environment Variables

Set these in **Vercel**:

```env
# Backend URL (used by server-side API routes)
BACKEND_URL=http://csockw8w80ww08gccgo4cs8c.72.61.229.220.sslip.io

# Optional: For client-side direct access (not recommended)
NEXT_PUBLIC_BACKEND_URL=http://csockw8w80ww08gccgo4cs8c.72.61.229.220.sslip.io
```

### Frontend API Proxy Routes

All backend communication should go through frontend API routes:

- `/api/backend-health` - Backend health check proxy
- `/api/sync/*` - Sync operations (proxied via `lib/utils/backend-client.ts`)
- `/api/connections/*` - Connection operations (proxied)

**Never call backend directly from browser JavaScript!**

## Backend Configuration

### Environment Variables

Set these in **Coolify**:

```env
# Frontend URL (for CORS allowlist)
FRONTEND_URL=https://your-app.vercel.app

# OR specify multiple origins (comma-separated)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://preview.vercel.app
```

### CORS Behavior

The backend allows:

1. **No origin** (server-to-server requests) ✅
2. **Exact matches** from `ALLOWED_ORIGINS` or `FRONTEND_URL` ✅
3. **Vercel preview domains** (`*.vercel.app`) ✅
4. **Localhost** (development only) ✅
5. **All origins** (development mode only) ✅

### Testing CORS

```bash
# Test from command line (should work - no origin)
curl http://your-backend.com/health

# Test from browser console (may fail if origin not allowed)
fetch('http://your-backend.com/health')
```

## Common Issues

### Issue: "CORS policy blocked"

**Cause**: Frontend trying to call backend directly from browser

**Solution**: Use frontend API proxy routes instead

```typescript
// ❌ BAD - Direct call from browser
const res = await fetch('http://backend.com/health');

// ✅ GOOD - Use frontend proxy
const res = await fetch('/api/backend-health');
```

### Issue: Backend shows "offline" in admin dashboard

**Cause**: Frontend health check failing

**Solution**: 
1. Check `/api/backend-health` works
2. Verify `BACKEND_URL` is set in Vercel
3. Check backend is accessible from Vercel's servers

### Issue: Backend rejects requests

**Cause**: Origin not in allowlist

**Solution**: Add your frontend URL to backend environment:

```env
FRONTEND_URL=https://your-app.vercel.app
```

Or add to `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://preview-xyz.vercel.app
```

## Best Practices

1. ✅ **Always use frontend API routes** for backend communication
2. ✅ **Set `FRONTEND_URL`** in backend environment
3. ✅ **Use `BACKEND_URL`** (not `NEXT_PUBLIC_BACKEND_URL`) in frontend
4. ❌ **Never call backend directly** from browser JavaScript
5. ❌ **Don't expose backend URL** in client-side code

## Verification

### Check Frontend Proxy

```bash
curl https://your-app.vercel.app/api/backend-health
```

Should return:
```json
{
  "healthy": true,
  "status": "healthy",
  "latency": 123,
  "backend": {
    "url": "http://...",
    "version": "1.0.0"
  }
}
```

### Check Backend Directly

```bash
curl http://your-backend.com/health
```

Should return:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Current Configuration

- **Frontend**: Vercel (Next.js)
- **Backend**: Coolify (Fastify)
- **Backend URL**: `http://csockw8w80ww08gccgo4cs8c.72.61.229.220.sslip.io`
- **CORS Strategy**: Proxy pattern (no direct browser-to-backend calls)
