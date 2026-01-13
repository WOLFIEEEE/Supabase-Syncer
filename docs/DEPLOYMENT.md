# Suparbase Deployment Guide

This guide covers deploying Suparbase to production with Vercel (frontend) and Coolify (backend).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                             │
│                   suparbase.com                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Next.js 16 App Router                                      ││
│  │  - Static pages                                              ││
│  │  - API routes (lightweight)                                  ││
│  │  - Proxy to backend                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Coolify (Backend)                             │
│              backend.suparbase.com                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Fastify Server                                              ││
│  │  - Heavy processing                                          ││
│  │  - Sync operations                                           ││
│  │  - Background jobs (BullMQ)                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Supabase   │   │    Redis    │   │  User DBs   │
│  Database   │   │   (Queue)   │   │             │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## Prerequisites

- Node.js 20.9.0+
- npm or yarn
- Vercel account
- Coolify instance or Docker host
- Supabase project
- Redis instance (for background jobs)

---

## Frontend Deployment (Vercel)

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory (not `server/`)

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 3. Environment Variables

Add these environment variables in Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend
BACKEND_URL=https://your-backend.coolify.domain.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend.coolify.domain.com
BACKEND_SHARED_SECRET=your_shared_secret_min_32_chars

# Security
ENCRYPTION_KEY=your_64_hex_char_encryption_key

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx

# App URL
NEXT_PUBLIC_APP_URL=https://suparbase.com
```

### 4. Ignore Backend Changes

The frontend is configured to ignore backend changes via `vercel.json`:

```json
{
  "ignoreCommand": "bash scripts/vercel-ignore.sh"
}
```

### 5. Deploy

Click "Deploy" or push to your main branch.

---

## Backend Deployment (Coolify)

### 1. Create New Service

1. Log into your Coolify dashboard
2. Create a new service from Git repository
3. Set the root directory to `server/`

### 2. Docker Configuration

The backend uses the Dockerfile at `server/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 3. Environment Variables

Add these in Coolify:

```env
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Security
BACKEND_SHARED_SECRET=your_shared_secret_min_32_chars
ENCRYPTION_KEY=your_64_hex_char_encryption_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# CORS
FRONTEND_URL=https://suparbase.com

# Redis
REDIS_URL=redis://redis:6379

# Sentry (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Admin
ADMIN_EMAIL=admin@example.com
```

### 4. Ignore Frontend Changes

Use `.coolifyignore` to ignore frontend changes:

```
app/
components/
public/
.next/
next.config.js
package.json
```

### 5. Health Check

Configure health check endpoint:
- **URL**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

---

## Database Setup (Supabase)

### 1. Create Tables

Run the migration in Supabase SQL Editor:

```sql
-- See supabase/migrations/ for full schema
```

### 2. Enable Row Level Security

Ensure RLS is enabled on all tables:

```sql
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
-- etc.
```

### 3. Configure Authentication

1. Go to Authentication > Settings
2. Enable Email/Password sign-up
3. Configure redirect URLs

---

## Redis Setup

### Option 1: Coolify Redis

Deploy Redis as a Coolify service on the same network as your backend.

### Option 2: Upstash

Use [Upstash](https://upstash.com/) for serverless Redis:

```env
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

### Option 3: Self-hosted

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

---

## SSL/TLS Configuration

### Vercel (Automatic)

Vercel automatically provisions SSL certificates for your domain.

### Coolify

1. Add your domain in Coolify
2. Enable "Let's Encrypt" for automatic SSL
3. Or provide custom certificate

---

## Environment Variable Reference

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `BACKEND_URL` | Yes | Backend server URL |
| `BACKEND_SHARED_SECRET` | Yes | Shared secret (32+ chars) |
| `ENCRYPTION_KEY` | Yes | Encryption key (64 hex chars) |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |

### Backend (Coolify)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Server port (default: 3001) |
| `BACKEND_SHARED_SECRET` | Yes | Must match frontend |
| `ENCRYPTION_KEY` | Yes | Must match frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `REDIS_URL` | Yes | Redis connection URL |
| `SENTRY_DSN` | No | Sentry DSN |
| `ADMIN_EMAIL` | No | Admin user email |

---

## Post-Deployment Checklist

- [ ] Verify frontend loads at your domain
- [ ] Check `/api/health` returns healthy status
- [ ] Test authentication flow
- [ ] Test database connection creation
- [ ] Verify backend communication (`/api/backend-health`)
- [ ] Test sync job creation
- [ ] Check Sentry receives errors (if configured)
- [ ] Verify Redis connection (check queue)
- [ ] Test keep-alive cron job

---

## Scaling Considerations

### Horizontal Scaling

- **Frontend**: Vercel handles automatically
- **Backend**: Deploy multiple instances behind a load balancer
- **Redis**: Use Redis Cluster for high availability

### Performance Tips

1. Enable caching (`ENABLE_CACHING=true`)
2. Use connection pooling
3. Optimize database queries
4. Use CDN for static assets (automatic on Vercel)

---

## Rollback Procedure

### Vercel

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." > "Promote to Production"

### Coolify

1. Go to your service
2. Select previous deployment
3. Click "Redeploy"

---

## Monitoring

### Sentry Dashboard

Monitor errors and performance at:
- https://sentry.io/organizations/your-org/

### Health Endpoints

- Frontend: `https://suparbase.com/api/health`
- Backend: `https://backend.suparbase.com/health`

### Logs

- **Vercel**: Functions > Logs
- **Coolify**: Service > Logs

---

## Security Checklist

- [ ] `ENCRYPTION_KEY` is 64 hex characters
- [ ] `BACKEND_SHARED_SECRET` is 32+ characters
- [ ] Both keys match between frontend and backend
- [ ] CORS is configured correctly
- [ ] RLS is enabled on all Supabase tables
- [ ] SSL is enabled on all services
- [ ] Admin email is configured
- [ ] Rate limiting is enabled
