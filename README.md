# Supabase Database Syncer

A powerful, self-hosted tool for synchronizing database schemas and data between Supabase environments (development, staging, production).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

- **One-Click Sync** - Synchronize data between databases with a single click
- **Schema Comparison** - Compare table structures and detect differences
- **Migration Generator** - Auto-generate SQL scripts to fix schema mismatches
- **Direct Execution** - Run migrations from the UI (with production safeguards)
- **Encrypted Storage** - Database URLs encrypted with AES-256-GCM
- **Safety First** - Dry-run previews, production confirmations, breaking change warnings
- **Responsive UI** - Works on desktop and mobile
- **Supabase Auth** - Secure authentication with email/password, Google, GitHub

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/supabase-syncer.git
cd supabase-syncer
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Project Settings > API** to get your credentials
3. Enable authentication providers in **Authentication > Providers**:
   - Email/Password (enabled by default)
   - Google OAuth (optional)
   - GitHub OAuth (optional)

### 3. Configure Environment

Create a `.env.local` file:

```env
# ============================================
# SUPABASE CONFIGURATION (REQUIRED)
# ============================================

# Your Supabase project URL
# Found in: Project Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anon/public key
# Found in: Project Settings > API > Project API keys > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ============================================
# ENCRYPTION (REQUIRED)
# ============================================

# Encryption key for storing database URLs securely
# Generate with: openssl rand -hex 16
ENCRYPTION_KEY=your_32_character_secret_key_here

# ============================================
# OPTIONAL CONFIGURATION
# ============================================

# Persistent database for storing connections and sync jobs
# If not set, data is stored in memory (lost on restart)
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis for background job processing
# If not set, sync jobs run synchronously
# REDIS_URL=redis://localhost:6379
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public API key |
| `ENCRYPTION_KEY` | Yes | 32-character key for AES-256-GCM encryption |
| `DATABASE_URL` | No | PostgreSQL URL for persistent storage |
| `REDIS_URL` | No | Redis URL for background job processing |

### Generating Secure Keys

```bash
# Generate ENCRYPTION_KEY (32 hex characters = 16 bytes)
openssl rand -hex 16
```

## Supabase Setup

### 1. Authentication Providers

In your Supabase Dashboard, go to **Authentication > Providers**:

#### Email/Password
- Enabled by default
- Users can sign up with email and password
- Email confirmation can be enabled/disabled

#### Google OAuth (Optional)
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
3. Enter Client ID and Secret in Supabase Dashboard

#### GitHub OAuth (Optional)
1. Create OAuth App in [GitHub Developer Settings](https://github.com/settings/developers)
2. Add callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
3. Enter Client ID and Secret in Supabase Dashboard

### 2. Database Tables (Optional)

For persistent storage, create these tables in your Supabase project:

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

-- RLS Policy for sync_logs (inherit from parent job)
CREATE POLICY "Users can view own sync_logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sync_jobs 
      WHERE sync_jobs.id = sync_logs.sync_job_id 
      AND sync_jobs.user_id = auth.uid()
    )
  );
```

## Usage

### 1. Create an Account

1. Go to `/signup` to create a new account
2. Or sign in with Google/GitHub if configured
3. Verify your email (if email confirmation is enabled)

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

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Chakra UI)                               │
│  ├── Dashboard, Connections, Schema Sync, Data Sync         │
│  └── Real-time status updates, responsive design            │
├─────────────────────────────────────────────────────────────┤
│  Authentication (Supabase Auth)                              │
│  ├── Email/Password, Google, GitHub OAuth                   │
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
│  └── Sync Engine (batched UPSERT operations)                │
├─────────────────────────────────────────────────────────────┤
│  Storage                                                     │
│  ├── In-Memory Store (default, per-user scoped)             │
│  ├── Supabase DB (optional, with RLS)                       │
│  └── Redis (optional, background job queue)                 │
└─────────────────────────────────────────────────────────────┘
```

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

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth (@supabase/ssr)
- **Database ORM**: Drizzle ORM + postgres-js
- **UI**: Chakra UI + Framer Motion
- **Encryption**: AES-256-GCM

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
```

## Troubleshooting

### Authentication Issues

**"Invalid login credentials"**
- Verify email is confirmed (check spam folder)
- For OAuth, ensure redirect URL is configured correctly in Supabase

**OAuth not working**
- Check that provider is enabled in Supabase Dashboard
- Verify client ID and secret are correct
- Ensure callback URL matches: `https://your-project.supabase.co/auth/v1/callback`

### Connection Failed
- Verify PostgreSQL URL format: `postgresql://user:pass@host:5432/db`
- Check if database allows external connections
- Supabase requires SSL - ensure URL has `?sslmode=require`

### Schema Loading Slow
- System uses estimated row counts for performance
- Large databases may take longer on first load
- Check network latency to database

### Data Not Persisting
- By default, data is stored in memory (lost on restart)
- Set up Supabase database tables for persistent storage
- Or configure `DATABASE_URL` for external PostgreSQL

## Contributing

Contributions welcome! Please read our contributing guidelines first.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with care for the Supabase community
