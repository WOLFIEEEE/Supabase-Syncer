# Deployment Guide

Complete guide for deploying Supabase Syncer with **Frontend on Vercel** and **Backend on Coolify/Docker**.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [1. Supabase Setup](#1-supabase-setup)
- [2. Backend Deployment (Coolify)](#2-backend-deployment-coolify)
- [3. Frontend Deployment (Vercel)](#3-frontend-deployment-vercel)
- [4. Post-Deployment Configuration](#4-post-deployment-configuration)
- [5. Testing](#5-testing)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌─────────────────────────┐        ┌─────────────────────────────┐   │
│    │     VERCEL (Frontend)   │        │   COOLIFY (Backend)          │   │
│    │     ─────────────────   │        │   ─────────────────          │   │
│    │                         │        │                              │   │
│    │  • Next.js 16 App       │        │  • Fastify API Server        │   │
│    │  • React UI Components  │  HTTPS │  • BullMQ Job Queue          │   │
│    │  • API Route Proxies    │◄──────►│  • Redis (for queues/cache)  │   │
│    │  • Static Assets (CDN)  │        │  • Heavy DB Operations       │   │
│    │  • Edge Functions       │        │  • Sync Job Processing       │   │
│    │                         │        │                              │   │
│    │  URL: your-app.vercel.app        │  URL: api.yourdomain.com     │   │
│    └─────────────────────────┘        └─────────────────────────────┘   │
│                 │                                    │                   │
│                 │                                    │                   │
│                 └──────────────┬─────────────────────┘                   │
│                                │                                         │
│                                ▼                                         │
│                    ┌──────────────────────┐                              │
│                    │      SUPABASE        │                              │
│                    │   (External Cloud)   │                              │
│                    │   ────────────────   │                              │
│                    │   • PostgreSQL DB    │                              │
│                    │   • Authentication   │                              │
│                    │   • Row Level Sec.   │                              │
│                    └──────────────────────┘                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Separate Deployment?

| Benefit | Description |
|---------|-------------|
| **Scalability** | Frontend scales on Vercel CDN, backend scales on Coolify |
| **Cost Efficiency** | Free Vercel tier for frontend, pay only for backend resources |
| **Performance** | Static assets served from edge, API calls to dedicated server |
| **Reliability** | Backend can restart without affecting frontend |
| **Security** | Separate security boundaries, backend not exposed directly |

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Supabase Project** with URL and anon key
- [ ] **Vercel Account** (free tier works)
- [ ] **Coolify Instance** or Docker-compatible hosting
- [ ] **Domain Names** (optional but recommended)
- [ ] **GitHub Repository** with the code

### Generate Required Secrets

```bash
# Encryption key for database URLs (32 hex characters)
openssl rand -hex 16
# Example: a1b2c3d4e5f67890abcdef1234567890

# Shared secret for frontend-backend communication (64 hex characters)
openssl rand -hex 32
# Example: a1b2c3d4e5f67890abcdef1234567890a1b2c3d4e5f67890abcdef1234567890
```

**⚠️ Important**: Keep these secrets safe and never commit them to git!

---

## 1. Supabase Setup

### Create Required Tables

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Run the migration files:

```sql
-- Run supabase/migrations/001_create_tables.sql first
-- Then run supabase/migrations/004_add_usage_limits.sql
```

### Configure Authentication

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000/**` (for development)

### Get Credentials

From **Project Settings** → **API**:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon/Public key

---

## 2. Backend Deployment (Coolify)

### Step 1: Create Application

1. Log into Coolify dashboard
2. Go to **Projects** → Select or create project
3. Click **+ Add Resource** → **Application**
4. Select **Docker Compose**
5. Connect your GitHub repository

### Step 2: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Repository** | `https://github.com/YOUR-USERNAME/Supabase-Syncer` |
| **Branch** | `main` |
| **Docker Compose File** | `docker-compose.yaml` |
| **Base Directory** | `/` (root) |

### Step 3: Set Environment Variables

Add these in Coolify's environment variables section:

```env
# ═══════════════════════════════════════════════════════════
# REQUIRED VARIABLES
# ═══════════════════════════════════════════════════════════

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security: Must match frontend exactly!
BACKEND_SHARED_SECRET=your_64_character_secret_here
ENCRYPTION_KEY=your_32_character_key_here

# CORS: Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app

# ═══════════════════════════════════════════════════════════
# OPTIONAL VARIABLES
# ═══════════════════════════════════════════════════════════

# Admin email for admin routes
ADMIN_EMAIL=admin@yourdomain.com

# Logging level (debug, info, warn, error)
LOG_LEVEL=info

# Additional CORS origins (comma-separated)
ALLOWED_ORIGINS=https://preview-*.vercel.app

# Rate limiting (requests per minute)
RATE_LIMIT_SYNC=10
RATE_LIMIT_SCHEMA=30
RATE_LIMIT_EXECUTE=20
RATE_LIMIT_READ=100
```

### Step 4: Configure Domain

1. In application settings, find **Domains** section
2. Add your backend domain: `api.yourdomain.com`
3. Coolify automatically:
   - Configures SSL/TLS certificate
   - Sets up reverse proxy
   - Handles HTTPS redirect

### Step 5: Deploy

1. Click **Deploy**
2. Wait for Docker images to build (~5-10 minutes first time)
3. Monitor logs for any errors

### Step 6: Verify Backend

```bash
# Health check
curl https://api.yourdomain.com/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "checks": {
#     "redis": { "status": "up" },
#     "queue": { "status": "up" }
#   }
# }
```

---

## 3. Frontend Deployment (Vercel)

### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js

### Step 2: Configure Build Settings

Vercel should auto-detect these, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### Step 3: Set Environment Variables

In Vercel project settings → Environment Variables:

```env
# ═══════════════════════════════════════════════════════════
# REQUIRED VARIABLES
# ═══════════════════════════════════════════════════════════

# Supabase Configuration (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend Connection
BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com

# Security: Must match backend exactly!
BACKEND_SHARED_SECRET=your_64_character_secret_here
ENCRYPTION_KEY=your_32_character_key_here

# App URL (your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Note your Vercel domain

### Step 5: Verify Frontend

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Status check
curl https://your-app.vercel.app/api/status
```

---

## 4. Post-Deployment Configuration

### Update CORS (if needed)

If your Vercel domain changed, update backend:
1. Go to Coolify → Your backend application
2. Update `FRONTEND_URL` environment variable
3. Redeploy

### Configure Custom Domain (Optional)

**For Vercel:**
1. Go to Project Settings → Domains
2. Add your domain: `app.yourdomain.com`
3. Configure DNS as instructed

**For Coolify:**
1. Update `FRONTEND_URL` to include new domain
2. Add new domain to Supabase redirect URLs

### Update Supabase Redirect URLs

After deployment, add all domains to Supabase:
1. Supabase Dashboard → Authentication → URL Configuration
2. Add to Redirect URLs:
   - `https://your-app.vercel.app/**`
   - `https://app.yourdomain.com/**` (if using custom domain)

---

## 5. Testing

### Quick Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Backend readiness (Kubernetes-style)
curl -I https://api.yourdomain.com/health/ready

# Frontend health
curl https://your-app.vercel.app/api/health

# Frontend status (includes Supabase check)
curl https://your-app.vercel.app/api/status
```

### Test Authentication Flow

1. Visit `https://your-app.vercel.app/signup`
2. Create a test account
3. Check email for verification (if enabled)
4. Log in at `/login`
5. Verify dashboard loads

### Test API Proxying

```bash
# Get a test token first
npx tsx scripts/get-test-token.ts --email your@email.com --password yourpassword

# Test a protected endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.vercel.app/api/connections
```

### Test Page

Visit `https://your-app.vercel.app/test` with password `test123` for comprehensive integration testing.

---

## Troubleshooting

### Backend Issues

#### "Cannot connect to Redis"
```
Error: ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Check Redis container is running:
```bash
docker ps | grep redis
docker-compose logs redis
```

#### "Health check failing"
```
Container unhealthy
```
**Solution**: Check backend logs:
```bash
docker-compose logs -f backend
```

#### "CORS error"
```
Access-Control-Allow-Origin missing
```
**Solution**: Ensure `FRONTEND_URL` is set correctly in backend environment.

### Frontend Issues

#### "Cannot connect to backend"
```
ECONNREFUSED or 502 Bad Gateway
```
**Solution**: 
1. Verify `BACKEND_URL` is correct
2. Check backend is running: `curl https://api.yourdomain.com/health`
3. Check CORS is configured

#### "Invalid token"
```
Authentication failed
```
**Solution**: Ensure `BACKEND_SHARED_SECRET` matches on both sides.

#### "Build failed"
```
Cannot find module 'fastify'
```
**Solution**: The `server/` directory should be excluded from frontend build. Check `tsconfig.json` has `"server"` in the `exclude` array.

### Database Issues

#### "Supabase not configured"
```
Missing NEXT_PUBLIC_SUPABASE_URL
```
**Solution**: Ensure environment variables are set in Vercel and start with `NEXT_PUBLIC_` for client-side access.

---

## Security Checklist

Before going to production:

- [ ] `BACKEND_SHARED_SECRET` is 64+ characters and random
- [ ] `ENCRYPTION_KEY` is 32+ characters and random
- [ ] Both secrets match between frontend and backend
- [ ] `FRONTEND_URL` is set to exact Vercel domain
- [ ] HTTPS is enabled on both services
- [ ] Environment variables are marked as "Secret" in Coolify
- [ ] Supabase RLS policies are enabled
- [ ] Admin email is set for admin routes
- [ ] Rate limiting is configured
- [ ] No secrets are committed to git

---

## Environment Variable Reference

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `BACKEND_URL` | ✅ | Backend API URL |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | Backend URL (client-side) |
| `BACKEND_SHARED_SECRET` | ✅ | Shared secret |
| `ENCRYPTION_KEY` | ✅ | Encryption key |
| `NEXT_PUBLIC_APP_URL` | Recommended | Frontend URL |

### Backend (Coolify)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `BACKEND_SHARED_SECRET` | ✅ | Shared secret |
| `ENCRYPTION_KEY` | ✅ | Encryption key |
| `FRONTEND_URL` | ✅ | Vercel frontend URL |
| `REDIS_URL` | Auto | Auto-configured in Docker |
| `PORT` | No | Server port (default: 3001) |
| `LOG_LEVEL` | No | Logging level |
| `ADMIN_EMAIL` | No | Admin email |
| `ALLOWED_ORIGINS` | No | Additional CORS origins |

---

## Support

If you encounter issues:

1. Check logs in Vercel (frontend) and Coolify (backend)
2. Verify all environment variables are set
3. Test health endpoints
4. Check [GitHub Issues](https://github.com/WOLFIEEEE/Supabase-Syncer/issues)

---

**🎉 Congratulations!** Your Supabase Syncer is now deployed and ready to use!
