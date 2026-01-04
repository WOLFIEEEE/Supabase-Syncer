# Supabase Database Syncer

A powerful, self-hosted tool for synchronizing database schemas and data between Supabase environments (development, staging, production).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Coolify](https://img.shields.io/badge/Coolify-Compatible-blueviolet)

## Features

- **One-Click Sync** - Synchronize data between databases with a single click
- **Schema Comparison** - Compare table structures and detect differences
- **Migration Generator** - Auto-generate SQL scripts to fix schema mismatches
- **Direct Execution** - Run migrations from the UI (with production safeguards)
- **Encrypted Storage** - Database URLs encrypted with AES-256-GCM
- **Safety First** - Dry-run previews, production confirmations, breaking change warnings
- **Responsive UI** - Works on desktop and mobile
- **Supabase Auth** - Secure authentication with email/password
- **Rate Limiting** - Built-in API protection
- **Scheduled Syncs** - Cron-like scheduling support

---

## Quick Start

### Option 1: Local Development

```bash
# Clone repository
git clone https://github.com/WOLFIEEEE/Supabase-Syncer.git
cd Supabase-Syncer

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# Then run development server
npm run dev
```

### Option 2: Docker

```bash
# Clone repository
git clone https://github.com/WOLFIEEEE/Supabase-Syncer.git
cd Supabase-Syncer

# Create .env file with your external service URLs
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
ENCRYPTION_KEY=$(openssl rand -hex 16)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional: Add if you have external Redis
# REDIS_URL=redis://your-redis-host:6379
EOF

# Build and run
docker-compose up -d
```

> **Note**: Supabase and Redis are expected to be hosted externally. Just provide their URLs in the environment variables.

### Option 3: Coolify (Recommended for Production)

See [Coolify Deployment](#coolify-deployment) section below.

---

## Supabase Database Setup

**Important**: Before using the application, you need to create the required tables in your Supabase project.

### Create Tables

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Copy and paste the contents of `supabase/migrations/001_create_tables.sql`
5. Click **Run** to execute

This creates the following tables with Row Level Security (RLS):

| Table | Description |
|-------|-------------|
| `connections` | Stores encrypted database connection strings |
| `sync_jobs` | Tracks synchronization jobs and progress |
| `sync_logs` | Stores detailed logs for each sync job |
| `user_settings` | User preferences and settings |

All tables include RLS policies so users can only access their own data.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Your Supabase anon/public API key |
| `ENCRYPTION_KEY` | **Yes** | 32-character key for AES-256-GCM encryption |
| `NEXT_PUBLIC_APP_URL` | No | Application URL (for OAuth callbacks) |
| `DATABASE_URL` | No | PostgreSQL URL for persistent storage |
| `REDIS_URL` | No | Redis URL for background job processing |

### Generating Secure Keys

```bash
# Generate ENCRYPTION_KEY (32 hex characters = 16 bytes)
openssl rand -hex 16

# Example output: a1b2c3d4e5f6789012345678abcdef12
```

---

## Coolify Deployment

Coolify is a self-hosted Heroku/Netlify alternative. This application is fully optimized for Coolify deployment.

### Prerequisites

1. A running Coolify instance (v4.x recommended)
2. A Supabase project with credentials
3. A domain (optional, Coolify can generate one)

### Step 1: Create New Service

1. Log into your Coolify dashboard
2. Go to **Projects** → Select or create a project
3. Click **+ Add Resource** → **Application**
4. Select **GitHub** (or GitLab/Custom Git)
5. Connect your repository: `WOLFIEEEE/Supabase-Syncer`
6. Select branch: `main`

### Step 2: Configure Build Settings

In the application settings:

| Setting | Value |
|---------|-------|
| Build Pack | **Dockerfile** |
| Dockerfile Location | `./Dockerfile` |
| Port | `3000` |

### Step 3: Set Environment Variables

Go to **Environment Variables** and add your external service URLs:

```env
# Required: Your externally hosted Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Required: Encryption key (generate with: openssl rand -hex 16)
ENCRYPTION_KEY=your_32_character_hex_key

# Recommended: Your Coolify domain
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: External Redis for background jobs
REDIS_URL=redis://your-redis-host:6379

# Environment
NODE_ENV=production
```

> **Note**: Supabase and Redis should be hosted on external cloud services (Supabase Cloud, Upstash, Redis Cloud, etc.). This application only needs their connection URLs.

> **Security Tip**: Mark `ENCRYPTION_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `REDIS_URL` as "Secret" in Coolify

### Step 4: Configure Domain

1. Go to **Domains** in your application settings
2. Add your domain (e.g., `syncer.yourdomain.com`)
3. Enable **HTTPS** (Let's Encrypt)

### Step 5: Deploy

1. Click **Deploy** button
2. Wait for build to complete (3-5 minutes first time)
3. Access your application at your configured domain

### Step 6: Configure Supabase Redirect

After deployment, add your Coolify URL to Supabase:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your domain to **Site URL**: `https://your-domain.com`
3. Add to **Redirect URLs**: `https://your-domain.com/**`

### Coolify Health Checks

The application includes a built-in health check endpoint:

- **Endpoint**: `/api/status`
- **Method**: GET
- **Success**: Returns system health status

Coolify automatically uses this for container health monitoring.

### Scaling on Coolify

For high availability:

1. Go to **Advanced** settings
2. Increase **Replicas** (e.g., 2-3)
3. Coolify handles load balancing automatically

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to **Project Settings > API** to get credentials

### 2. Enable Email Authentication

In **Authentication > Providers**:
- Email/Password is enabled by default
- Configure email templates if desired

### 3. Database Tables (Optional)

For persistent storage, create these tables:

```sql
-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_url TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('production', 'development')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for connections
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON connections
  FOR DELETE USING (auth.uid() = user_id);

-- Sync jobs table
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  target_connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('one_way', 'two_way')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  tables_config JSONB NOT NULL,
  progress JSONB,
  checkpoint JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for sync_jobs
CREATE POLICY "Users can view own sync_jobs" ON sync_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync_jobs" ON sync_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync_jobs" ON sync_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sync_jobs" ON sync_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Sync logs table
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for sync_logs
CREATE POLICY "Users can view own sync_logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sync_jobs 
      WHERE sync_jobs.id = sync_logs.sync_job_id 
      AND sync_jobs.user_id = auth.uid()
    )
  );
```

---

## Usage

### 1. Create an Account

1. Go to `/signup` to create a new account
2. Verify your email (if email confirmation is enabled)

### 2. Add Database Connections

1. Click **Manage Connections**
2. Add your source and target database URLs
3. Select environment type (production/development)
4. Test connection to verify

### 3. Schema Sync

1. Click **Schema Sync** from dashboard
2. Select source (reference) and target databases
3. Click **Compare Schemas**
4. Review differences by severity
5. Generate and execute fix scripts

### 4. Data Sync

1. Click **New Sync Job**
2. Select source and target connections
3. Choose tables to sync
4. Validate schema compatibility
5. Preview changes with dry-run
6. Execute sync

---

## Pages

| Path | Description | Auth Required |
|------|-------------|---------------|
| `/landing` | Public landing page | No |
| `/guide` | Documentation & guides | No |
| `/status` | System health status | No |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/forgot-password` | Password reset | No |
| `/` | Dashboard | Yes |
| `/connections` | Manage databases | Yes |
| `/schema-sync` | Schema synchronization | Yes |
| `/sync/create` | Create sync job | Yes |
| `/sync/history` | View past syncs | Yes |
| `/settings` | User settings | Yes |

---

## API Endpoints

### Public Endpoints

```
GET  /api/status              - System health check
GET  /auth/callback           - OAuth callback handler
```

### Protected Endpoints (Require Authentication)

```
GET  /api/connections              - List user's connections
POST /api/connections              - Create connection
GET  /api/connections/:id          - Get connection details
DELETE /api/connections/:id        - Delete connection
GET  /api/connections/:id/schema   - Get full schema
POST /api/connections/:id/test     - Test connection
POST /api/connections/:id/execute  - Execute SQL

POST /api/sync/validate            - Validate schema compatibility
POST /api/sync/generate-migration  - Generate migration script
GET  /api/sync                     - List user's sync jobs
POST /api/sync                     - Create sync job
GET  /api/sync/:id                 - Get sync job details
POST /api/sync/:id/start           - Start sync job
POST /api/sync/:id/pause           - Pause sync job
```

### Rate Limits

| Operation | Limit |
|-----------|-------|
| Read (GET) | 100 requests/minute |
| Write (POST, PUT, DELETE) | 20 requests/minute |
| Sync operations | 10 requests/minute |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Chakra UI)                               │
│  ├── Dashboard, Connections, Schema Sync, Data Sync         │
│  └── Real-time status updates, responsive design            │
├─────────────────────────────────────────────────────────────┤
│  Security Layer                                              │
│  ├── Rate Limiting (in-memory, per-user)                    │
│  ├── Input Validation (Zod schemas)                         │
│  └── SSL enforcement for database connections               │
├─────────────────────────────────────────────────────────────┤
│  Authentication (Supabase Auth)                              │
│  ├── Email/Password authentication                          │
│  ├── Session management with SSR                            │
│  └── Row Level Security (RLS) ready                         │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                  │
│  ├── User-scoped data access                                │
│  ├── Connection management (CRUD)                           │
│  ├── Schema inspection & validation                         │
│  └── Sync job management                                    │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  ├── Drizzle Factory (dynamic DB connections)               │
│  ├── Schema Inspector (table/column analysis)               │
│  ├── Schema Validator (compatibility checks)                │
│  ├── Migration Generator (SQL DDL scripts)                  │
│  ├── Diff Engine (row-level comparisons)                    │
│  ├── Sync Engine (batched UPSERT operations)                │
│  ├── Retry Handler (exponential backoff)                    │
│  └── Scheduler (cron-like scheduling)                       │
├─────────────────────────────────────────────────────────────┤
│  Storage                                                     │
│  ├── In-Memory Store (default, per-user scoped)             │
│  ├── Supabase DB (optional, with RLS)                       │
│  └── Redis (optional, background job queue)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Safety Features

### Encryption
- Database URLs encrypted with AES-256-GCM before storage
- Encryption key never logged or exposed

### User Isolation
- All data scoped by authenticated user ID
- Row Level Security (RLS) ready for Supabase DB
- Cannot access other users' connections or jobs

### Production Safeguards
- Visual warnings for production databases
- Type-to-confirm for destructive operations
- Cannot accidentally sync to wrong environment

### Schema Validation
- Automatic detection of breaking changes
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
- Blocks sync for critical schema mismatches

### Dry Run
- Preview all changes before execution
- Shows exact insert/update counts
- Identifies potential issues

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth (@supabase/ssr)
- **Database ORM**: Drizzle ORM + postgres-js
- **UI**: Chakra UI + Framer Motion
- **Validation**: Zod
- **Encryption**: AES-256-GCM
- **Container**: Docker (multi-stage build)

---

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Build Docker image
docker build -t supabase-syncer .

# Run with Docker Compose
docker-compose up -d
```

---

## Troubleshooting

### Coolify Build Fails

**"Cannot find module" errors**
- Ensure all dependencies are in `package.json`
- Check that `.dockerignore` isn't excluding needed files

**Build timeout**
- Increase build timeout in Coolify settings
- First builds may take 5-10 minutes

### Authentication Issues

**"Invalid login credentials"**
- Verify email is confirmed (check spam folder)
- Check Supabase Auth settings

**Session not persisting**
- Verify `NEXT_PUBLIC_APP_URL` matches your domain
- Check Supabase redirect URLs include your domain

### Connection Failed

- Verify PostgreSQL URL format: `postgresql://user:pass@host:5432/db`
- Check if database allows external connections
- Supabase requires SSL - ensure URL has `?sslmode=require`

### Data Not Persisting

- By default, data is stored in memory (lost on restart)
- Set up Supabase database tables for persistent storage
- Or configure `DATABASE_URL` for external PostgreSQL

---

## Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/WOLFIEEEE/Supabase-Syncer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/WOLFIEEEE/Supabase-Syncer/discussions)

---

Built with care for the Supabase community
