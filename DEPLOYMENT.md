# Deployment Guide

This guide covers deploying the Supabase Syncer application with **frontend on Vercel** and **backend on Coolify** separately.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Vercel         │         │  Coolify         │
│  (Frontend)     │────────▶│  (Backend)      │
│  Next.js        │  HTTP   │  Fastify        │
│  Port: 3000     │         │  Port: 3001     │
└─────────────────┘         └─────────────────┘
                                      │
                                      ▼
                              ┌─────────────────┐
                              │  Redis          │
                              │  (Queue/Rate   │
                              │   Limiting)     │
                              └─────────────────┘
```

## Frontend Deployment (Vercel)

### Prerequisites

1. Vercel account
2. GitHub repository connected to Vercel
3. Backend URL (from Coolify deployment)

### Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 2: Configure Environment Variables

In Vercel project settings, add the following environment variables:

#### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend Configuration (from Coolify)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.coolify-domain.com
BACKEND_SHARED_SECRET=your_64_character_shared_secret

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# App URL (your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional Variables

```env
# Database (if using external PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (if using external Redis, otherwise not needed)
REDIS_URL=redis://host:6379
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Note your Vercel domain (e.g., `your-app.vercel.app`)

### Step 4: Update Backend CORS

After getting your Vercel domain, update the backend's `FRONTEND_URL` environment variable in Coolify (see Backend Deployment section).

## Backend Deployment (Coolify)

### Prerequisites

1. Coolify instance running
2. Redis service (can be deployed separately or use external Redis)
3. Domain/subdomain for backend API

### Step 1: Create New Application in Coolify

1. Go to your Coolify dashboard
2. Click "New Resource" → "Dockerfile"
3. Configure:
   - **Name**: `supabase-syncer-backend`
   - **Repository**: Your GitHub repository
   - **Branch**: `main` or your feature branch
   - **Dockerfile Path**: `server/Dockerfile`
   - **Port**: `3001`

### Step 2: Configure Environment Variables

In Coolify application settings, add the following:

#### Required Variables

```env
# Server Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Security
BACKEND_SHARED_SECRET=your_64_character_shared_secret
# Generate with: openssl rand -hex 32

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key
# Generate with: openssl rand -hex 16

# Frontend URL (your Vercel domain)
FRONTEND_URL=https://your-app.vercel.app

# Redis Configuration
REDIS_URL=redis://redis:6379
# Or if using external Redis:
# REDIS_URL=redis://your-redis-host:6379
```

#### Optional Variables

```env
# Admin
ADMIN_EMAIL=admin@example.com

# CORS (comma-separated, if you need additional origins)
ALLOWED_ORIGINS=https://custom-domain.com,https://another-domain.com

# Rate Limiting (requests per minute)
RATE_LIMIT_SYNC=10
RATE_LIMIT_SCHEMA=30
RATE_LIMIT_EXECUTE=20
RATE_LIMIT_READ=100
RATE_LIMIT_ADMIN=50

# Database (if using external PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Step 3: Deploy Redis (if not using external)

1. In Coolify, create a new service
2. Use Docker image: `redis:7-alpine`
3. Configure:
   - **Port**: `6379`
   - **Volume**: `/data` for persistence
   - **Command**: `redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru`

### Step 4: Configure Domain

1. In Coolify application settings, go to "Domains"
2. Add your backend domain (e.g., `api.yourdomain.com` or `backend.yourdomain.com`)
3. Coolify will automatically configure SSL/TLS

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build and deployment to complete
3. Test health endpoint: `https://your-backend-domain.com/health`

### Step 6: Update Frontend

After backend is deployed, update the `NEXT_PUBLIC_BACKEND_URL` in Vercel to point to your Coolify backend domain.

## Testing the Deployment

### 1. Test Frontend

```bash
curl https://your-app.vercel.app/api/status
```

### 2. Test Backend Health

```bash
curl https://your-backend-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "redis": { "status": "up", "latency": 2 },
    "database": { "status": "up", "latency": 15 }
  }
}
```

### 3. Test Backend Liveness

```bash
curl https://your-backend-domain.com/health/live
```

### 4. Test Backend Readiness

```bash
curl https://your-backend-domain.com/health/ready
```

## Environment Variable Reference

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Backend API URL (from Coolify) |
| `BACKEND_SHARED_SECRET` | Yes | Shared secret (same as backend) |
| `ENCRYPTION_KEY` | Yes | Encryption key for database URLs |
| `NEXT_PUBLIC_APP_URL` | Recommended | Frontend URL (for OAuth callbacks) |
| `DATABASE_URL` | No | External PostgreSQL URL |
| `REDIS_URL` | No | External Redis URL (usually not needed) |

### Backend (Coolify)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Server port (default: 3001) |
| `BACKEND_SHARED_SECRET` | Yes | Shared secret (same as frontend) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `ENCRYPTION_KEY` | Yes | Encryption key (same as frontend) |
| `FRONTEND_URL` | Yes | Frontend URL (from Vercel) |
| `REDIS_URL` | Yes | Redis connection URL |
| `ADMIN_EMAIL` | No | Admin email for admin routes |
| `ALLOWED_ORIGINS` | No | Additional CORS origins (comma-separated) |
| `RATE_LIMIT_*` | No | Rate limiting configuration |

## Troubleshooting

### Frontend can't connect to backend

1. Check `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel
2. Verify backend is accessible: `curl https://your-backend-domain.com/health`
3. Check CORS configuration in backend (ensure `FRONTEND_URL` is set)
4. Check backend logs in Coolify

### Backend CORS errors

1. Ensure `FRONTEND_URL` is set in backend environment variables
2. Add additional origins to `ALLOWED_ORIGINS` if needed
3. Check backend logs for CORS rejection messages

### Rate limiting issues

1. Check Redis connection in backend health endpoint
2. Verify `REDIS_URL` is correct
3. Check rate limit configuration in backend environment variables

### Build failures

1. **Frontend (Vercel)**: Check build logs, ensure all dependencies are in `package.json`
2. **Backend (Coolify)**: Check Docker build logs, ensure `server/Dockerfile` is correct

## Security Checklist

- [ ] `BACKEND_SHARED_SECRET` is a strong random string (64+ characters)
- [ ] `ENCRYPTION_KEY` is a strong random string (32+ characters)
- [ ] Backend is not publicly accessible without authentication
- [ ] CORS is properly configured (only allow frontend domain)
- [ ] SSL/TLS is enabled on both frontend and backend
- [ ] Environment variables are not committed to git
- [ ] Rate limiting is enabled and configured
- [ ] Admin routes are protected with `ADMIN_EMAIL`

## Monitoring

### Frontend (Vercel)

- Use Vercel Analytics for performance monitoring
- Check Vercel logs for errors
- Monitor API route execution times

### Backend (Coolify)

- Use backend health endpoints for monitoring
- Check Coolify logs for errors
- Monitor Redis connection status
- Set up alerts for health check failures

## Scaling

### Frontend (Vercel)

- Vercel automatically scales based on traffic
- No additional configuration needed

### Backend (Coolify)

- Deploy multiple backend instances behind a load balancer
- Ensure Redis is accessible to all instances
- Backend is stateless, so horizontal scaling works out of the box
- Use Coolify's scaling features or deploy multiple instances

## Support

For issues or questions:
1. Check logs in Vercel (frontend) and Coolify (backend)
2. Verify all environment variables are set correctly
3. Test health endpoints
4. Check CORS configuration

