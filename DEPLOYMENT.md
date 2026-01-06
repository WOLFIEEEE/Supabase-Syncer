# Deployment Guide - Supabase Syncer

## Architecture Overview

This application uses a **self-hosted architecture** with minimal external dependencies:

### Services
- **App (Next.js)**: Main application container
- **Redis**: Self-hosted queue and caching service (managed by Docker)
- **Supabase**: External service for database and authentication

### Why This Setup?

- ✅ **No manual Redis configuration** - Automatically managed by Docker
- ✅ **Single network** - All services communicate internally
- ✅ **Cost-effective** - Only pay for Supabase, Redis is free and self-hosted
- ✅ **Easy deployment** - One-click deploy on Coolify
- ✅ **Scalable** - Redis persistence with volume mounts

---

## Deployment on Coolify

### Prerequisites
1. A Coolify instance (self-hosted or cloud)
2. A Supabase project ([sign up free](https://supabase.com))
3. Your encryption key for database credentials

### Step 1: Create Application in Coolify

1. Go to your Coolify dashboard
2. Click **"New Resource"** → **"Application"**
3. Choose **"Docker Compose"** as the deployment type
4. Connect your Git repository

### Step 2: Configure Environment Variables

Set only these required variables in Coolify (Redis is auto-configured):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here

# App URL (Coolify auto-sets this usually)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: External PostgreSQL (leave empty to use Supabase)
DATABASE_URL=
```

### Step 3: Deploy

1. Coolify will automatically detect `docker-compose.yaml`
2. It will build and deploy both the app and Redis
3. Redis will be accessible at `redis://redis:6379` within the Docker network
4. No manual Redis configuration needed!

### Step 4: Verify Deployment

Check these endpoints:
- Health: `https://yourdomain.com/api/status`
- Version: `https://yourdomain.com/api/version`

---

## Local Development

### With Docker Compose

```bash
# 1. Create environment file (copy from example)
cp .env.example .env

# 2. Fill in your Supabase credentials in .env
# Note: Do NOT set REDIS_URL - it's auto-configured

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

### Without Docker (Development)

```bash
# 1. Install Redis locally
brew install redis  # macOS
# or
sudo apt install redis-server  # Ubuntu

# 2. Start Redis
redis-server

# 3. Install dependencies
npm install

# 4. Set environment variables
cp .env.example .env
# Edit .env and set:
# REDIS_URL=redis://localhost:6379

# 5. Run development server
npm run dev
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `ENCRYPTION_KEY` | 32-character encryption key | Generate with: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | `https://yourdomain.com` |

### Auto-Configured Variables (Docker)

| Variable | Value | Notes |
|----------|-------|-------|
| `REDIS_URL` | `redis://redis:6379` | Auto-set by docker-compose |
| `NODE_ENV` | `production` | Auto-set by Dockerfile |
| `PORT` | `3000` | App listening port |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | External PostgreSQL URL | Uses Supabase if not set |

---

## Redis Configuration

### Storage & Persistence

Redis data is persisted using Docker volumes:

```yaml
volumes:
  redis_data:
    driver: local
```

### Memory Limits

Redis is configured with sensible defaults:
- **Max Memory**: 256MB
- **Eviction Policy**: `allkeys-lru` (removes least recently used keys)
- **Persistence**: AOF (Append Only File) enabled

### Scaling Redis

To increase Redis memory limit, edit `docker-compose.yaml`:

```yaml
services:
  redis:
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

---

## Monitoring

### Health Checks

Both services have automatic health checks:

**App:**
- Endpoint: `/api/status`
- Interval: 30s
- Timeout: 10s

**Redis:**
- Command: `redis-cli ping`
- Interval: 10s
- Timeout: 5s

### Logs

View logs in Coolify UI or via Docker:

```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Redis only
docker-compose logs -f redis
```

### Redis Monitoring

Connect to Redis CLI:

```bash
docker-compose exec redis redis-cli

# Check memory usage
> INFO memory

# Monitor commands
> MONITOR

# Check connected clients
> CLIENT LIST
```

---

## Troubleshooting

### Issue: App can't connect to Redis

**Solution:**
1. Check if Redis container is running: `docker-compose ps`
2. Check Redis health: `docker-compose exec redis redis-cli ping`
3. Verify `REDIS_URL` is set to `redis://redis:6379` in docker-compose

### Issue: Redis data lost after restart

**Solution:**
Make sure volume is properly mounted:
```bash
docker volume ls | grep redis_data
```

If volume doesn't exist, recreate with:
```bash
docker-compose down -v
docker-compose up -d
```

### Issue: Out of memory errors

**Solution:**
Increase Redis memory limit in `docker-compose.yaml`:
```yaml
command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

---

## Security Best Practices

1. **Encryption Key**: Generate a strong key:
   ```bash
   openssl rand -base64 32
   ```

2. **Redis Access**: Redis is only accessible within the Docker network (not exposed externally)

3. **Environment Variables**: Never commit `.env` files to Git

4. **Supabase**: Use Row Level Security (RLS) policies

5. **HTTPS**: Always use HTTPS in production (Coolify handles this automatically)

---

## Backup & Recovery

### Backup Redis Data

```bash
# Backup Redis AOF file
docker-compose exec redis redis-cli BGSAVE
docker cp supabase-syncer-redis:/data/dump.rdb ./backup-$(date +%Y%m%d).rdb
```

### Restore Redis Data

```bash
# Stop Redis
docker-compose stop redis

# Copy backup to volume
docker cp backup-20240101.rdb supabase-syncer-redis:/data/dump.rdb

# Start Redis
docker-compose start redis
```

---

## Cost Comparison

### With Self-Hosted Redis (Current Setup)
- **Supabase Free Tier**: $0/month
- **Coolify (Self-hosted)**: $0/month
- **Redis (Self-hosted)**: $0/month
- **Total**: **$0/month** 🎉

### With External Redis (e.g., Upstash)
- **Supabase Free Tier**: $0/month
- **Coolify**: $0/month
- **Upstash Free Tier**: $0/month (with limits)
- **Upstash Paid**: ~$10/month
- **Total**: **$0-10/month**

---

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review Docker logs: `docker-compose logs -f`
3. Check Redis status: `docker-compose exec redis redis-cli ping`
4. Open an issue on GitHub

---

## Maintenance

### Update Redis Version

Edit `docker-compose.yaml`:
```yaml
services:
  redis:
    image: redis:7-alpine  # Change to desired version
```

Then rebuild:
```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

### Update Application

Coolify will automatically rebuild when you push to Git. Or manually:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

