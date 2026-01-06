# Docker Setup Guide

## Quick Start

### Environment Variables Template

Create a `.env` file with these variables:

```bash
# =========================================
# REQUIRED: Supabase Configuration
# =========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# =========================================
# REQUIRED: Security
# =========================================
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-32-character-encryption-key-here

# =========================================
# REQUIRED: Application URL
# =========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =========================================
# OPTIONAL: External PostgreSQL
# =========================================
DATABASE_URL=

# =========================================
# REDIS - AUTO CONFIGURED (DO NOT SET)
# =========================================
# Automatically set to: redis://redis:6379
# Only change if using external Redis service
```

### Start Application

```bash
docker-compose up -d
```

That's it! Redis is automatically configured and connected.

## Services

### Application (Port 3000)
- Next.js web application
- Connects to Supabase for data
- Connects to Redis for background jobs

### Redis (Internal Only)
- Background job queue
- Session caching
- Rate limiting
- NOT exposed externally (secure by default)

## Architecture

```
┌─────────────────────────────────────────────┐
│               Docker Network                 │
│  ┌────────────┐         ┌─────────────┐    │
│  │    App     │────────▶│   Redis     │    │
│  │  (Port     │         │ (Internal)  │    │
│  │   3000)    │         │             │    │
│  └─────┬──────┘         └─────────────┘    │
│        │                                     │
└────────┼─────────────────────────────────────┘
         │
         │ (External Connection)
         │
         ▼
   ┌──────────────┐
   │   Supabase   │
   │   (Cloud)    │
   └──────────────┘
```

## Why This Setup?

### Self-Hosted Redis Benefits
✅ **Zero Configuration** - Automatic connection via Docker network  
✅ **Cost Savings** - No monthly Redis hosting fees  
✅ **Security** - Redis not exposed to internet  
✅ **Performance** - Low latency (same machine)  
✅ **Persistence** - Data survives container restarts  

### Simplified Deployment
- One `docker-compose up` command
- No manual Redis URL configuration
- No external Redis service signup
- Works identically in development and production

## Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Redis only
docker-compose logs -f redis
```

### Stop Services
```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers (data persists in volumes)
docker-compose down

# Stop and remove EVERYTHING including data
docker-compose down -v
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart app only
docker-compose restart app

# Restart redis only
docker-compose restart redis
```

### Check Status
```bash
# List running containers
docker-compose ps

# Check health
docker-compose ps

# Check app health endpoint
curl http://localhost:3000/api/status
```

## Redis Management

### Connect to Redis CLI
```bash
docker-compose exec redis redis-cli
```

### Useful Redis Commands
```bash
# Test connection
redis-cli ping
# Output: PONG

# Check memory usage
redis-cli INFO memory

# List all keys
redis-cli KEYS "*"

# Get queue stats
redis-cli INFO stats

# Monitor real-time commands
redis-cli MONITOR
```

### Backup Redis Data
```bash
# Create backup
docker-compose exec redis redis-cli BGSAVE
docker cp supabase-syncer-redis:/data/dump.rdb ./redis-backup.rdb

# Restore backup
docker-compose stop redis
docker cp redis-backup.rdb supabase-syncer-redis:/data/dump.rdb
docker-compose start redis
```

## Troubleshooting

### Redis Connection Issues

**Symptom**: App can't connect to Redis

**Check**:
```bash
# Is Redis running?
docker-compose ps redis

# Is Redis healthy?
docker-compose exec redis redis-cli ping

# Check app logs
docker-compose logs app | grep -i redis

# Check Redis logs
docker-compose logs redis
```

**Fix**:
```bash
# Restart Redis
docker-compose restart redis

# If still broken, recreate containers
docker-compose down
docker-compose up -d
```

### App Won't Start

**Check**:
```bash
# View app logs
docker-compose logs app

# Check if Redis is ready
docker-compose ps redis

# Rebuild app
docker-compose up -d --build app
```

### Redis Out of Memory

**Check Memory**:
```bash
docker-compose exec redis redis-cli INFO memory
```

**Increase Limit** (edit `docker-compose.yaml`):
```yaml
services:
  redis:
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

**Apply Changes**:
```bash
docker-compose down
docker-compose up -d
```

### Data Persistence Issues

**Check Volume**:
```bash
docker volume ls | grep redis
docker volume inspect supabase-syncer_redis_data
```

**Recreate Volume**:
```bash
docker-compose down -v
docker-compose up -d
```

## Development vs Production

### Development (Local)
```yaml
# docker-compose.yaml already configured
services:
  app:
    ports:
      - "3000:3000"  # Accessible at localhost:3000
  redis:
    # Not exposed externally (secure)
```

### Production (Coolify)
- Coolify automatically uses `docker-compose.yaml`
- Redis URL is auto-set to `redis://redis:6379`
- Redis is NOT exposed to internet
- Volumes are managed by Coolify
- Health checks ensure reliability

## Security

### Redis Security Features
1. **Not Externally Exposed**: No port mapping to host
2. **Internal Network**: Only accessible to app container
3. **Authentication**: Can add with `--requirepass` if needed
4. **Encryption**: Add TLS if required (advanced)

### Add Redis Password (Optional)

**Edit `docker-compose.yaml`**:
```yaml
services:
  redis:
    command: redis-server --appendonly yes --requirepass YOUR_PASSWORD
  app:
    environment:
      - REDIS_URL=redis://:YOUR_PASSWORD@redis:6379
```

## Performance Tuning

### Redis Configuration

Edit `docker-compose.yaml` command:

```yaml
services:
  redis:
    command: |
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
```

### App Concurrency

Edit `lib/queue/client.ts` to adjust worker concurrency:

```typescript
export function createSyncWorker(processor) {
  return new Worker('sync-jobs', processor, {
    connection: getRedisConnection(),
    concurrency: 5,  // Increase for more parallel jobs
    limiter: {
      max: 20,        // Max jobs per duration
      duration: 1000, // Duration in ms
    },
  });
}
```

## Monitoring

### Docker Stats
```bash
# Real-time resource usage
docker stats supabase-syncer supabase-syncer-redis

# Container details
docker inspect supabase-syncer
docker inspect supabase-syncer-redis
```

### Health Checks
```bash
# App health
curl http://localhost:3000/api/health

# Redis health
docker-compose exec redis redis-cli ping
```

### Logs
```bash
# Follow logs (Ctrl+C to exit)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Since timestamp
docker-compose logs --since 2024-01-07T10:00:00
```

## Scaling

### Horizontal Scaling (Multiple App Instances)

```yaml
services:
  app:
    deploy:
      replicas: 3  # Run 3 app instances
    # ... rest of config
  
  redis:
    # Single Redis instance shared by all app instances
```

### Vertical Scaling (More Resources)

```yaml
services:
  redis:
    command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## Migration from External Redis

If you were previously using Upstash, Redis Cloud, or another external Redis:

### Before
```bash
REDIS_URL=redis://user:pass@external-redis.com:6379
```

### After (with Docker)
```bash
# Remove REDIS_URL from your .env file
# It's automatically set to: redis://redis:6379
```

That's it! Your existing queue data will start fresh (which is usually fine for job queues).

## FAQ

**Q: Do I need to install Redis on my machine?**  
A: No, Redis runs in Docker. You don't need Redis installed locally.

**Q: Can I use external Redis instead?**  
A: Yes, just set `REDIS_URL` in your environment variables and remove Redis from docker-compose.

**Q: Is Redis data lost when I restart?**  
A: No, data is persisted in Docker volumes and survives restarts.

**Q: Can I access Redis from outside Docker?**  
A: By default no (secure). To expose, add port mapping: `ports: - "6379:6379"` to Redis service.

**Q: How do I backup my data?**  
A: Use `docker-compose exec redis redis-cli BGSAVE` and copy the dump file.

**Q: What if Redis fills up?**  
A: Redis uses LRU eviction policy - automatically removes old keys when full.

## Next Steps

1. ✅ Set up environment variables
2. ✅ Run `docker-compose up -d`
3. ✅ Check health: `curl localhost:3000/api/status`
4. ✅ Deploy to Coolify (see DEPLOYMENT.md)

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

