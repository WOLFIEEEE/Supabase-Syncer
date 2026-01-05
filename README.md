# suparbase

A powerful, self-hosted tool for synchronizing database schemas and data between Supabase environments (development, staging, production). Keep your databases alive and in sync with suparbase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Coolify](https://img.shields.io/badge/Coolify-Compatible-blueviolet)

## ✨ Features

### Core Functionality
- **One-Click Sync** - Synchronize data between databases with a single click
- **Schema Comparison** - Compare table structures and detect differences
- **Migration Generator** - Auto-generate SQL scripts to fix schema mismatches
- **Direct Execution** - Run migrations from the UI (with production safeguards)
- **Keep-Alive Service** - Prevent Supabase free tier databases from pausing
- **Data Explorer** - Browse and manage database tables with read/write operations

### Security & Safety
- **Encrypted Storage** - Database URLs encrypted with AES-256-GCM
- **Production Safeguards** - Dry-run previews, production confirmations, breaking change warnings
- **Rate Limiting** - Built-in API protection (100 reads/min, 20 writes/min)
- **User Isolation** - Row Level Security (RLS) with per-user data scoping
- **Schema Validation** - Automatic detection of breaking changes before sync

### Usage Management
- **Usage Limits** - Track and enforce limits on connections, sync jobs, and data transfer
- **Usage Dashboard** - Monitor your usage statistics via `/api/usage` endpoint
- **Monthly Resets** - Automatic monthly usage reset for fair usage tracking

### Notifications
- **Email Notifications** - Get notified when syncs start, complete, or fail
- **Usage Warnings** - Receive alerts when approaching usage limits
- **Configurable** - Enable/disable email notifications per user

### User Experience
- **Responsive UI** - Works beautifully on desktop and mobile
- **Modern Design** - Built with Chakra UI and Framer Motion
- **Public Pages** - Landing, Features, Pricing, About, Contact, FAQ, Guide, Status
- **Consistent Branding** - Logo header on all pages (auth and public)

### Authentication
- **Supabase Auth** - Secure authentication with email/password
- **Session Management** - Server-side session handling with SSR
- **Password Reset** - Forgot password flow with email verification

---

## 🚀 Quick Start

### Option 1: Local Development

```bash
# Clone repository
git clone https://github.com/WOLFIEEEE/Supabase-Syncer.git
cd Supabase-Syncer

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - ENCRYPTION_KEY (generate with: openssl rand -hex 16)

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

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

## 📊 Supabase Database Setup

**Important**: Before using the application, you need to create the required tables in your Supabase project.

### Step 1: Create Base Tables

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

### Step 2: Create Usage Limits Tables

1. In the same SQL Editor, create a new query
2. Copy and paste the contents of `supabase/migrations/004_add_usage_limits.sql`
3. Click **Run** to execute

This creates:
- `usage_limits` - Tracks user limits and current usage
- `usage_history` - Historical usage data for analytics
- `email_notifications` - Email notification logs

**Alternative**: Use the migration script:
```bash
DATABASE_URL="postgresql://..." npx tsx scripts/apply-usage-limits-migration.ts
```

All tables include RLS policies so users can only access their own data.

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Your Supabase anon/public API key |
| `ENCRYPTION_KEY` | **Yes** | 32-character key for AES-256-GCM encryption |
| `NEXT_PUBLIC_APP_URL` | **Recommended** | Application URL (for OAuth callbacks and email links) |
| `DATABASE_URL` | No | PostgreSQL URL for persistent storage (uses Supabase by default) |
| `REDIS_URL` | No | Redis URL for background job processing |

### Generating Secure Keys

```bash
# Generate ENCRYPTION_KEY (32 hex characters = 16 bytes)
openssl rand -hex 16

# Example output: a1b2c3d4e5f6789012345678abcdef12
```

---

## 🐳 Coolify Deployment

Coolify is a self-hosted Heroku/Netlify alternative. This application is fully optimized for Coolify deployment.

### Prerequisites

1. A running Coolify instance (v4.x recommended)
2. A Supabase project with credentials
3. A domain name (required for proper OAuth callbacks)

### Step 1: Create New Application

1. Log into your Coolify dashboard
2. Go to **Projects** → Select or create a project
3. Click **+ Add Resource** → **Application**
4. Select **GitHub** (or GitLab/Custom Git)
5. Connect your repository: `WOLFIEEEE/Supabase-Syncer`
6. Select branch: `main`

### Step 2: Configure Build Settings

In the application settings, configure the following:

| Setting | Value |
|---------|-------|
| **Build Pack** | `Dockerfile` |
| **Dockerfile Location** | `./Dockerfile` |
| **Port** | `3000` |
| **Build Command** | (leave empty, handled by Dockerfile) |
| **Start Command** | (leave empty, handled by Dockerfile) |

**Important**: Make sure the Dockerfile path is exactly `./Dockerfile` (relative to repository root).

### Step 3: Configure Domain

**This is critical for OAuth to work properly!**

1. Go to **Domains** section in your application settings
2. Click **+ Add Domain**
3. Enter your domain (e.g., `suparbase.yourdomain.com` or `syncer.yourdomain.com`)
4. **Enable HTTPS** (Let's Encrypt) - this is required
5. Wait for SSL certificate to be issued

**Note**: If you don't have a domain, Coolify can generate a subdomain, but you'll need to configure it properly in Supabase redirect URLs.

### Step 4: Set Environment Variables

Go to **Environment Variables** and add the following:

#### Required Variables

```env
# Your Supabase project (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Encryption key (REQUIRED - generate with: openssl rand -hex 16)
ENCRYPTION_KEY=your_32_character_hex_key

# Your application URL (REQUIRED - must match your domain)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Build Arguments (for Docker build)

These are passed during build time. In Coolify, add them as environment variables with the same names:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Optional Variables

```env
# External PostgreSQL (if not using Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db

# External Redis for background jobs
REDIS_URL=redis://your-redis-host:6379

# Node environment
NODE_ENV=production
```

**Security Tip**: Mark sensitive variables (`ENCRYPTION_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `REDIS_URL`) as **"Secret"** in Coolify to prevent them from being logged.

### Step 5: Deploy

1. Click **Deploy** button
2. Wait for build to complete (first build may take 5-10 minutes)
3. Monitor the build logs for any errors
4. Once deployed, access your application at your configured domain

### Step 6: Configure Supabase Redirect URLs

After deployment, add your domain to Supabase:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your domain to **Site URL**: `https://your-domain.com`
3. Add to **Redirect URLs**: `https://your-domain.com/**`
4. Save changes

### Step 7: Verify Deployment

1. Visit your domain - you should see the landing page
2. Test `/api/status` endpoint - should return health status
3. Try signing up - should work with email verification
4. Check application logs in Coolify for any errors

### Coolify Health Checks

The application includes a built-in health check endpoint:

- **Endpoint**: `/api/status`
- **Method**: GET
- **Success**: Returns `{ "status": "ok", ... }`

Coolify automatically uses this for container health monitoring. The health check is configured in the Dockerfile.

### Troubleshooting Coolify Build

**Build fails with "Cannot find module" errors:**
- Ensure all dependencies are in `package.json`
- Check that `.dockerignore` isn't excluding `package.json` or `package-lock.json`
- Verify Node.js version in Dockerfile matches your requirements (currently Node 20)

**Build fails with "NEXT_PUBLIC_* variables not found":**
- Make sure build arguments are set in Coolify environment variables
- Variables must be set before build starts
- Check that variable names match exactly (case-sensitive)

**Application starts but shows errors:**
- Check application logs in Coolify
- Verify all required environment variables are set
- Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain
- Check Supabase redirect URLs are configured correctly

**Domain not working:**
- Verify domain DNS is pointing to your Coolify server
- Check SSL certificate is issued (should show green lock in browser)
- Ensure domain is added in Coolify Domains section
- Wait a few minutes for DNS propagation

### Scaling on Coolify

For high availability:

1. Go to **Advanced** settings
2. Increase **Replicas** (e.g., 2-3)
3. Coolify handles load balancing automatically
4. Note: Each replica needs access to the same Supabase database

---

## 📖 Usage

### 1. Create an Account

1. Go to `/signup` to create a new account
2. Verify your email (if email confirmation is enabled)
3. Log in at `/login`

### 2. Add Database Connections

1. Click **Manage Connections** from dashboard
2. Click **Add Connection**
3. Enter connection name and PostgreSQL URL
4. Select environment type (production/development)
5. Test connection to verify
6. Save connection

**Note**: Connection limits apply (default: 5 connections per user).

### 3. Schema Sync

1. Click **Schema Sync** from dashboard
2. Select source (reference) and target databases
3. Click **Compare Schemas**
4. Review differences by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
5. Generate migration script
6. Review and execute fix scripts

### 4. Data Sync

1. Click **New Sync Job** from dashboard
2. Select source and target connections
3. Choose tables to sync
4. Validate schema compatibility
5. Preview changes with dry-run
6. Execute sync

**Note**: Monthly sync job limits apply (default: 10 sync jobs per month).

### 5. Monitor Usage

1. Check usage statistics via `/api/usage` endpoint
2. View usage percentages and warnings
3. Monitor approaching limits

---

## 📄 Pages & Routes

### Public Pages (No Auth Required)

| Path | Description |
|------|-------------|
| `/` or `/landing` | Landing page with features and CTA |
| `/features` | Detailed features page |
| `/pricing` | Pricing information (currently free in beta) |
| `/about` | About page with mission and values |
| `/contact` | Contact information and support channels |
| `/faq` | Frequently asked questions |
| `/guide` | Documentation and user guides |
| `/status` | System health status |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/login` | Sign in page |
| `/signup` | Create account page |
| `/forgot-password` | Password reset request |
| `/reset-password` | Set new password |

### Protected Pages (Auth Required)

| Path | Description |
|------|-------------|
| `/` | Dashboard (redirects to landing if not authenticated) |
| `/connections` | Manage database connections |
| `/schema-sync` | Schema synchronization tool |
| `/sync/create` | Create new sync job |
| `/sync/history` | View past sync jobs |
| `/sync/[id]` | View sync job details |
| `/settings` | User settings and preferences |
| `/explorer` | Database explorer (browse tables) |

---

## 🔌 API Endpoints

### Public Endpoints

```
GET  /api/status              - System health check
GET  /api/version             - Application version
GET  /api/features            - List of features
GET  /auth/callback           - OAuth callback handler
```

### Protected Endpoints (Require Authentication)

#### Connections
```
GET    /api/connections              - List user's connections
POST   /api/connections              - Create connection
GET    /api/connections/:id          - Get connection details
DELETE /api/connections/:id         - Delete connection
GET    /api/connections/:id/schema   - Get full schema
POST   /api/connections/:id/test     - Test connection
POST   /api/connections/:id/execute  - Execute SQL
POST   /api/connections/:id/keep-alive - Ping database
```

#### Sync Jobs
```
GET    /api/sync                     - List user's sync jobs
POST   /api/sync                     - Create sync job
GET    /api/sync/:id                 - Get sync job details
POST   /api/sync/:id/start           - Start sync job
POST   /api/sync/:id/pause           - Pause sync job
POST   /api/sync/:id/stop            - Stop sync job
POST   /api/sync/validate            - Validate schema compatibility
POST   /api/sync/generate-migration  - Generate migration script
```

#### Usage
```
GET    /api/usage                    - Get usage statistics
```

### Rate Limits

| Operation | Limit |
|-----------|-------|
| Read (GET) | 100 requests/minute |
| Write (POST, PUT, DELETE) | 20 requests/minute |
| Sync operations | 10 requests/minute |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Chakra UI)                               │
│  ├── Dashboard, Connections, Schema Sync, Data Sync         │
│  ├── Public Pages (Landing, Features, Pricing, etc.)       │
│  └── Real-time status updates, responsive design            │
├─────────────────────────────────────────────────────────────┤
│  Security Layer                                              │
│  ├── Rate Limiting (in-memory, per-user)                    │
│  ├── Input Validation (Zod schemas)                         │
│  ├── Usage Limits Enforcement                               │
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
│  ├── Sync job management                                    │
│  └── Usage tracking and limits                              │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  ├── Drizzle Factory (dynamic DB connections)               │
│  ├── Schema Inspector (table/column analysis)               │
│  ├── Schema Validator (compatibility checks)                │
│  ├── Migration Generator (SQL DDL scripts)                  │
│  ├── Diff Engine (row-level comparisons)                    │
│  ├── Sync Engine (batched UPSERT operations)                │
│  ├── Retry Handler (exponential backoff)                    │
│  ├── Scheduler (cron-like scheduling)                       │
│  ├── Usage Limits Service                                   │
│  └── Email Notification Service                             │
├─────────────────────────────────────────────────────────────┤
│  Storage                                                     │
│  ├── In-Memory Store (default, per-user scoped)             │
│  ├── Supabase DB (optional, with RLS)                       │
│  └── Redis (optional, background job queue)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Safety Features

### Encryption
- Database URLs encrypted with AES-256-GCM before storage
- Encryption key never logged or exposed
- Per-user encryption scoping

### User Isolation
- All data scoped by authenticated user ID
- Row Level Security (RLS) enabled on all tables
- Cannot access other users' connections or jobs
- Usage limits enforced per user

### Production Safeguards
- Visual warnings for production databases
- Type-to-confirm for destructive operations
- Cannot accidentally sync to wrong environment
- Dry-run previews before execution

### Schema Validation
- Automatic detection of breaking changes
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
- Blocks sync for critical schema mismatches
- Detailed difference reports

### Usage Limits
- Connection limits (default: 5 per user)
- Monthly sync job limits (default: 10 per month)
- Data transfer limits (default: 1000 MB per month)
- Automatic monthly reset
- Usage warnings at 80% threshold

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth (@supabase/ssr)
- **Database ORM**: Drizzle ORM + postgres-js
- **UI**: Chakra UI + Framer Motion
- **Validation**: Zod
- **Encryption**: AES-256-GCM
- **Container**: Docker (multi-stage build)
- **Deployment**: Coolify, Vercel, or any Docker-compatible platform

---

## 💻 Development

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

# Apply database migrations
DATABASE_URL="postgresql://..." npx tsx scripts/apply-usage-limits-migration.ts
```

---

## 🐛 Troubleshooting

### Coolify Build Fails

**"Cannot find module" errors**
- Ensure all dependencies are in `package.json`
- Check that `.dockerignore` isn't excluding needed files
- Verify `package-lock.json` is committed

**Build timeout**
- Increase build timeout in Coolify settings (default: 10 minutes)
- First builds may take 5-10 minutes
- Check build logs for specific errors

**"NEXT_PUBLIC_* variables not found"**
- Ensure build arguments are set in Coolify environment variables
- Variables must be available during build time
- Check variable names match exactly (case-sensitive)

**Domain not working / OAuth fails**
- Verify domain DNS is pointing to your Coolify server
- Check SSL certificate is issued (Let's Encrypt)
- Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain exactly
- Add domain to Supabase redirect URLs
- Wait for DNS propagation (can take up to 24 hours)

### Authentication Issues

**"Invalid login credentials"**
- Verify email is confirmed (check spam folder)
- Check Supabase Auth settings
- Ensure email provider is enabled in Supabase

**Session not persisting**
- Verify `NEXT_PUBLIC_APP_URL` matches your domain
- Check Supabase redirect URLs include your domain with `/**` wildcard
- Clear browser cookies and try again

### Connection Failed

- Verify PostgreSQL URL format: `postgresql://user:pass@host:5432/db`
- Check if database allows external connections
- Supabase requires SSL - ensure URL has `?sslmode=require`
- Test connection in Supabase dashboard first

### Data Not Persisting

- By default, data is stored in memory (lost on restart)
- Set up Supabase database tables for persistent storage
- Run migrations: `001_create_tables.sql` and `004_add_usage_limits.sql`
- Or configure `DATABASE_URL` for external PostgreSQL

### Usage Limits Issues

- Check `/api/usage` endpoint for current usage
- Limits reset automatically at start of each month
- Verify `usage_limits` table exists in Supabase
- Check RLS policies are enabled

---

## 📝 Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/WOLFIEEEE/Supabase-Syncer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/WOLFIEEEE/Supabase-Syncer/discussions)
- **Website**: [suparbase.com](https://suparbase.com)
- **Documentation**: [suparbase.com/guide](https://suparbase.com/guide)

---

Built with care for the Supabase community ❤️
