# CORS Solution Guide

This document explains the best approaches to handle CORS issues between the frontend (Vercel) and backend (Coolify).

## 🎯 Recommended Solution: Next.js Rewrites (Proxy)

**Status**: ✅ **IMPLEMENTED** - This is the cleanest solution and avoids CORS entirely.

### How It Works

Next.js rewrites proxy backend requests through the Next.js server, so the browser never directly hits the backend. This completely eliminates CORS issues.

### Configuration

**File: `next.config.ts`**
```typescript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!backendUrl) {
    return [];
  }
  
  return [
    {
      source: '/backend-api/:path*',
      destination: `${backendUrl}/:path*`,
    },
  ];
}
```

### Usage

**In Browser (Client Components):**
```typescript
// ✅ Works - uses proxy, no CORS issues
const response = await fetch('/backend-api/health');

// ❌ Don't use - causes CORS issues
const response = await fetch('http://your-backend.com/health');
```

**In Server (API Routes, Server Components):**
```typescript
// ✅ Works - server-to-server, no CORS
const response = await fetch(process.env.BACKEND_URL + '/health');
```

### Benefits

- ✅ **No CORS configuration needed** on backend
- ✅ **Works automatically** - just use `/backend-api/*` paths
- ✅ **Single source of truth** - backend URL configured once
- ✅ **Works in all environments** (dev, staging, production)
- ✅ **No additional server routes needed**

### Backend Client

The `lib/utils/backend-client.ts` automatically uses the proxy in the browser:

```typescript
// Browser: Uses '/backend-api' (proxy)
// Server: Uses direct BACKEND_URL
const BACKEND_URL = typeof window !== 'undefined' 
  ? '/backend-api'  // Proxy path
  : process.env.BACKEND_URL;  // Direct URL
```

---

## 🔧 Alternative Solution: Backend CORS Configuration

If you prefer to call the backend directly from the browser, configure CORS on the backend.

### Backend Configuration

**In Coolify, set these environment variables:**

```env
# Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Or comma-separated list of allowed origins
ALLOWED_ORIGINS=https://your-app.vercel.app,https://preview.vercel.app
```

### How It Works

The backend (`server/src/index.ts`) already has CORS configured:

```typescript
await server.register(cors, {
  origin: (origin, callback) => {
    // Allows FRONTEND_URL and ALLOWED_ORIGINS
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allows *.vercel.app domains
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});
```

### Usage

**In Browser:**
```typescript
// ✅ Works if CORS is configured
const response = await fetch('http://your-backend.com/health', {
  credentials: 'include',  // If using cookies
});
```

### Benefits

- ✅ Direct backend communication
- ✅ No proxy overhead
- ✅ Works for WebSocket/SSE connections

### Drawbacks

- ❌ Requires backend configuration
- ❌ Must update CORS when frontend URL changes
- ❌ More complex setup

---

## 📊 Comparison

| Feature | Next.js Rewrites (Proxy) | Backend CORS |
|---------|------------------------|--------------|
| **Setup Complexity** | ✅ Simple (one config) | ⚠️ Medium (env vars) |
| **CORS Issues** | ✅ None (no CORS needed) | ⚠️ Must configure |
| **Performance** | ✅ Good (Next.js edge) | ✅ Excellent (direct) |
| **WebSocket/SSE** | ⚠️ Limited | ✅ Full support |
| **URL Changes** | ✅ Automatic | ❌ Manual update |
| **Recommended** | ✅ **YES** | ⚠️ For advanced use |

---

## 🚀 Current Implementation

**We're using Next.js Rewrites (Proxy)** - the recommended solution.

### What's Configured

1. ✅ `next.config.ts` - Rewrites configured
2. ✅ `lib/utils/backend-client.ts` - Auto-uses proxy in browser
3. ✅ Admin components - Use proxy paths
4. ✅ API testing - Uses proxy paths

### Environment Variables Needed

**Frontend (Vercel):**
```env
BACKEND_URL=http://your-backend.coolify.io
# OR
NEXT_PUBLIC_BACKEND_URL=http://your-backend.coolify.io
```

**Backend (Coolify):**
```env
FRONTEND_URL=https://your-app.vercel.app
# Optional - only if you want direct browser access
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## 🔍 Testing

### Test Proxy Works

```bash
# Should work from browser (no CORS)
curl https://your-app.vercel.app/backend-api/health
```

### Test Direct Backend (if CORS configured)

```bash
# Should work if CORS is configured
curl -H "Origin: https://your-app.vercel.app" \
     http://your-backend.coolify.io/health
```

---

## 📝 Summary

**For most use cases**: Use **Next.js Rewrites (Proxy)** ✅

- Already implemented
- No CORS configuration needed
- Works out of the box
- Clean and maintainable

**For advanced use cases** (WebSockets, SSE, direct connections): Configure **Backend CORS** ⚠️

- Requires backend environment variables
- More setup but more flexible
