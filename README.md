# suparbase

A powerful database synchronization and keep-alive platform for Supabase. Keep your free-tier databases alive and sync data between environments with ease.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Fastify](https://img.shields.io/badge/Fastify-5.0-green)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Vercel](https://img.shields.io/badge/Vercel-Ready-black)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────┐      ┌──────────────────────────────┐   │
│   │   VERCEL (Frontend)  │      │   COOLIFY/DOCKER (Backend)   │   │
│   │   ─────────────────  │      │   ────────────────────────   │   │
│   │   • Next.js 16       │      │   • Fastify Server           │   │
│   │   • React UI         │ ──── │   • BullMQ Job Queue         │   │
│   │   • API Proxies      │      │   • Redis                    │   │
│   │   • Static Assets    │      │   • Heavy Processing         │   │
│   └──────────────────────┘      └──────────────────────────────┘   │
│              │                               │                       │
│              └───────────┬───────────────────┘                       │
│                          ▼                                           │
│                 ┌─────────────────┐                                  │
│                 │    SUPABASE     │                                  │
│                 │   (Database +   │                                  │
│                 │   Auth)         │                                  │
│                 └─────────────────┘                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Core Functionality
- **One-Click Sync** - Synchronize data between Supabase databases
- **Schema Comparison** - Compare table structures and detect differences
- **Migration Generator** - Auto-generate SQL scripts for schema fixes
- **Keep-Alive Service** - Prevent free-tier database pausing
- **Data Explorer** - Browse and manage database tables

### Security
- **AES-256-GCM Encryption** - Database URLs encrypted at rest
- **Production Safeguards** - Dry-run previews, confirmation dialogs
- **Rate Limiting** - Redis-based distributed rate limiting
- **Row Level Security** - Per-user data isolation

### Backend Features
- **BullMQ Queue** - Background job processing for sync operations
- **Real-time Updates** - SSE streaming for sync progress
- **Health Monitoring** - Comprehensive health check endpoints
- **Admin Dashboard** - Analytics, user management, security events

---

## 🚀 Quick Start

### Option 1: Local Development

```bash
# Clone repository
git clone https://github.com/WOLFIEEEE/Supabase-Syncer.git
cd Supabase-Syncer

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Create environment file
cp .env.example .env.local

# Add your Supabase credentials to .env.local:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# ENCRYPTION_KEY=$(openssl rand -hex 16)
# BACKEND_SHARED_SECRET=$(openssl rand -hex 32)
# BACKEND_URL=http://localhost:3001

# Start backend (Docker)
docker-compose up -d

# Start frontend
npm run dev
```

**Frontend**: http://localhost:3000  
**Backend**: http://localhost:3001

### Option 2: Full Stack Docker (Development)

```bash
# Use the development compose file
docker-compose -f docker-compose.dev.yaml up -d
```

This starts frontend, backend, and Redis all in Docker.

### Option 3: Production Deployment (Recommended)

Deploy frontend and backend separately for better scalability:

| Component | Platform | Configuration |
|-----------|----------|---------------|
| Frontend | **Vercel** | Automatic from GitHub |
| Backend | **Coolify/Docker** | `docker-compose.yaml` |

See [Deployment Guide](#-deployment) below.

---

## 📦 Project Structure

```
supabase-syncer/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── (public)/          # Public marketing pages
│   ├── api/               # API routes (proxy to backend)
│   └── test/              # Test suite page
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── supabase/         # Supabase client
│   └── utils/            # Backend client, proxy handlers
├── server/               # Backend server (separate project)
│   ├── src/
│   │   ├── routes/       # Fastify API routes
│   │   ├── services/     # Business logic
│   │   ├── queue/        # BullMQ job queue
│   │   └── middleware/   # Auth, rate limiting
│   ├── Dockerfile        # Backend Docker image
│   └── package.json      # Backend dependencies
├── docker-compose.yaml   # Production: Backend + Redis only
├── docker-compose.dev.yaml # Development: Full stack
├── Dockerfile            # Frontend Docker image
└── vercel.json           # Vercel configuration
```

---

## 🔧 Environment Variables

### Frontend (.env.local or Vercel)

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Encryption (Required)
ENCRYPTION_KEY=your_32_char_hex_key

# Backend Connection (Required)
BACKEND_URL=http://localhost:3001          # Local development
# BACKEND_URL=https://api.yourdomain.com   # Production
BACKEND_SHARED_SECRET=your_shared_secret

# App URL (Required for OAuth)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Local development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com # Production
```

### Backend (.env or Docker)

```env
# Server
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Security (Required)
BACKEND_SHARED_SECRET=your_shared_secret  # Must match frontend
FRONTEND_URL=https://yourdomain.com       # For CORS

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Encryption (Required)
ENCRYPTION_KEY=your_32_char_hex_key  # Must match frontend

# Redis (Auto-configured in Docker)
REDIS_URL=redis://redis:6379

# Admin (Optional)
ADMIN_EMAIL=admin@yourdomain.com
```

### Generate Secure Keys

```bash
# Encryption key (32 hex chars)
openssl rand -hex 16

# Shared secret (64 hex chars)
openssl rand -hex 32
```

---

## 🚢 Deployment

### Frontend: Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

2. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ENCRYPTION_KEY
   BACKEND_URL=https://your-backend.coolify.io
   BACKEND_SHARED_SECRET
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **Deploy**
   - Click Deploy
   - Vercel handles build and deployment

### Backend: Coolify (Docker)

1. **Create Application in Coolify**
   - New Resource → Application → Docker Compose
   - Repository: `https://github.com/WOLFIEEEE/Supabase-Syncer`
   - Branch: `main`
   - Docker Compose file: `docker-compose.yaml`

2. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ENCRYPTION_KEY
   BACKEND_SHARED_SECRET
   FRONTEND_URL=https://your-app.vercel.app
   ADMIN_EMAIL=your@email.com
   ```

3. **Configure Domain**
   - Add domain: `api.yourdomain.com`
   - Coolify auto-configures SSL

4. **Deploy**
   - Click Deploy
   - Wait for health check to pass

### Post-Deployment

1. **Update Vercel**: Set `BACKEND_URL` to your Coolify backend URL
2. **Configure Supabase**: Add your frontend URL to Authentication → URL Configuration
3. **Test**: Visit `/api/health` on both services

---

## 🔌 API Reference

### Health Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Backend health check |
| `/health/ready` | HEAD | No | Readiness probe |
| `/health/live` | HEAD | No | Liveness probe |
| `/api/health` | GET | No | Frontend health check |
| `/api/status` | GET | No | Full status with Supabase |

### Connection Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/connections` | GET | Yes | List connections |
| `/api/connections` | POST | Yes | Create connection |
| `/api/connections/:id` | GET | Yes | Get connection |
| `/api/connections/:id` | DELETE | Yes | Delete connection |
| `/api/connections/:id/test` | POST | Yes | Test connection |
| `/api/connections/:id/schema` | GET | Yes | Get schema |
| `/api/connections/:id/execute` | POST | Yes | Execute SQL |

### Sync Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/sync` | GET | Yes | List sync jobs |
| `/api/sync` | POST | Yes | Create sync job |
| `/api/sync/:id` | GET | Yes | Get sync job |
| `/api/sync/:id/start` | POST | Yes | Start sync |
| `/api/sync/:id/pause` | POST | Yes | Pause sync |
| `/api/sync/:id/stop` | POST | Yes | Stop sync |
| `/api/sync/:id/stream` | GET | Yes | SSE progress stream |
| `/api/sync/validate` | POST | Yes | Validate schema |
| `/api/sync/generate-migration` | POST | Yes | Generate migration |

### Admin Endpoints (Requires ADMIN_EMAIL)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/analytics` | GET | Admin | Platform analytics |
| `/api/admin/users` | GET | Admin | User list |
| `/api/admin/sync-jobs` | GET | Admin | All sync jobs |
| `/api/admin/security-events` | GET | Admin | Security logs |
| `/api/admin/export` | GET | Admin | Export data |

---

## 🧪 Testing

### Run Tests Locally

```bash
# 1. Start backend
docker-compose up -d

# 2. Start frontend
npm run dev

# 3. Test endpoints
curl http://localhost:3001/health  # Backend
curl http://localhost:3000/api/health  # Frontend
```

### Test Page

Visit `/test` with password `test123` for comprehensive integration tests.

### Get Auth Token for Testing

```bash
npx tsx scripts/get-test-token.ts --email your@email.com --password yourpassword
```

---

## 🛠️ Development

### Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check

# Backend
cd server
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server

# Docker
docker-compose up -d                    # Start backend (production)
docker-compose -f docker-compose.dev.yaml up -d  # Start full stack (dev)
docker-compose logs -f backend          # View backend logs
docker-compose down                     # Stop all services
```

### Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Prettier for formatting

---

## 🔒 Security

### Encryption
- Database URLs encrypted with AES-256-GCM
- Encryption key stored securely in environment
- Each user's data isolated

### Authentication
- Supabase Auth with JWT tokens
- Shared secret for backend communication
- Rate limiting on all endpoints

### Production Safeguards
- Confirmation dialogs for destructive operations
- Dry-run mode for previewing changes
- Detailed audit logs

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file - Overview and quick start |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Detailed deployment guide |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing instructions |
| [VERCEL_ENV.example](./VERCEL_ENV.example) | Vercel environment template |
| [server/COOLIFY_ENV.example](./server/COOLIFY_ENV.example) | Coolify environment template |

---

## 🆘 Troubleshooting

### Frontend Build Fails
```
Error: Cannot find module 'fastify'
```
**Solution**: The `server/` directory should be excluded. Check `tsconfig.json` includes `"server"` in `exclude` array.

### Backend Health Check Fails
```
ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Redis is not running. Start with `docker-compose up -d redis`.

### CORS Errors
```
Access-Control-Allow-Origin
```
**Solution**: Set `FRONTEND_URL` in backend environment to your Vercel domain.

### Auth Token Invalid
```
Invalid or expired token
```
**Solution**: Ensure `BACKEND_SHARED_SECRET` matches between frontend and backend.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Proprietary software. See [Terms of Service](https://suparbase.com/terms).

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/WOLFIEEEE/Supabase-Syncer/issues)
- **Website**: [suparbase.com](https://suparbase.com)

---

Built with ❤️ for the Supabase community
