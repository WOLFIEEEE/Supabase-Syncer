# Redis Self-Hosting Setup - Summary

## What Changed?

Your Supabase Syncer application now includes a **self-hosted Redis instance** managed entirely by Docker. This eliminates the need for external Redis services like Upstash or Redis Cloud.

## Architecture

```
┌─────────────────────────────────────────┐
│           Docker Environment             │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Next.js    │───▶│    Redis     │  │
│  │     App      │    │   (7-alpine)  │  │
│  │  (Port 3000) │    │  (Internal)   │  │
│  └──────┬───────┘    └──────────────┘  │
│         │                                │
└─────────┼────────────────────────────────┘
          │
          ▼
  ┌──────────────┐
  │   Supabase   │ (External - Only service you pay for)
  │    Cloud     │
  └──────────────┘
```

## Key Benefits

✅ **Zero Configuration** - Redis URL is automatically set by docker-compose  
✅ **Cost Savings** - No monthly Redis hosting fees  
✅ **Security** - Redis runs only in private Docker network  
✅ **Persistence** - Data survives container restarts via volumes  
✅ **Coolify Compatible** - Works seamlessly with Coolify deployment  

## Files Modified

### 1. `docker-compose.yaml`
- Added Redis service (redis:7-alpine)
- Configured automatic connection via Docker network
- Added health checks and persistence
- Set memory limits and eviction policies

### 2. `coolify.json`
- Updated to use docker-compose deployment type
- Configured services: app + redis
- Added volume management
- Set REDIS_URL to auto-connect

### 3. `lib/queue/client.ts`
- Enhanced Redis connection logic
- Added retry strategies
- Improved error handling

### 4. Documentation
- Created `DEPLOYMENT.md` - Full deployment guide
- Created `DOCKER.md` - Docker usage guide
- Created `.dockerignore` - Build optimization
- Updated `README.md` - Reflects new Redis setup

## Environment Variables

### Required (Same as Before)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ENCRYPTION_KEY=your-32-char-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Auto-Configured (NEW)
```bash
REDIS_URL=redis://redis:6379  # Automatically set by docker-compose
```

**Important**: Do NOT manually set `REDIS_URL` when using Docker. It's automatically configured.

## How to Use

### Local Development
```bash
# 1. Create .env file (without REDIS_URL)
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ENCRYPTION_KEY=$(openssl rand -hex 16)
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 2. Start everything
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Access app
open http://localhost:3000
```

### Coolify Deployment

1. **Push your code to Git** (all changes are committed)

2. **Create application in Coolify**:
   - Type: Docker Compose
   - Repository: Your Git repo
   - Branch: main

3. **Set environment variables** (only these):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ENCRYPTION_KEY=your-encryption-key
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
   
   **Do NOT set REDIS_URL** - Coolify will use docker-compose.yaml

4. **Deploy** - Coolify will:
   - Build both app and Redis containers
   - Create Docker network
   - Set up volumes for persistence
   - Start services with health checks

## Redis Configuration

### Default Settings
- **Image**: redis:7-alpine (lightweight, production-ready)
- **Memory Limit**: 256MB
- **Eviction Policy**: allkeys-lru (auto-removes old keys when full)
- **Persistence**: AOF (Append Only File) enabled
- **Network**: Internal only (not exposed to internet)

### Scaling Redis
To increase memory, edit `docker-compose.yaml`:
```yaml
services:
  redis:
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Monitoring

### Check Redis Health
```bash
# Test connection
docker-compose exec redis redis-cli ping
# Output: PONG

# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Monitor commands in real-time
docker-compose exec redis redis-cli MONITOR
```

### Check App Connection to Redis
```bash
# View app logs
docker-compose logs app | grep -i redis

# Should see: "Connected to Redis at redis://redis:6379"
```

## Troubleshooting

### Issue: App can't connect to Redis
```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Issue: Redis data lost
```bash
# Check volume exists
docker volume ls | grep redis

# Inspect volume
docker volume inspect supabase-syncer_redis_data
```

### Issue: Out of memory
```bash
# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Clear all keys (careful!)
docker-compose exec redis redis-cli FLUSHALL

# Or increase limit in docker-compose.yaml
```

## Migration from External Redis

If you were previously using an external Redis service:

### Before
```env
REDIS_URL=redis://user:pass@external-host.com:6379
```

### After
```env
# Remove REDIS_URL entirely from .env
# It's now automatically set by docker-compose
```

Your existing queue data will start fresh (which is fine for background jobs).

## Security

### What's Secure
- Redis is NOT exposed to the internet
- Only accessible within Docker network
- No port mapping to host machine
- Runs in isolated container

### Optional: Add Password Protection
Edit `docker-compose.yaml`:
```yaml
services:
  redis:
    command: redis-server --appendonly yes --requirepass YOUR_STRONG_PASSWORD
  app:
    environment:
      - REDIS_URL=redis://:YOUR_STRONG_PASSWORD@redis:6379
```

## Cost Analysis

### Old Setup (External Redis)
- Supabase Free: $0/month
- Upstash Free Tier: $0/month (with limits)
- Upstash Paid: ~$10/month

### New Setup (Self-Hosted Redis)
- Supabase Free: $0/month
- Redis (Docker): **$0/month** ✅
- **Total: $0/month**

The only cost is your server resources (which you're already paying for).

## Next Steps

1. ✅ Test locally: `docker-compose up -d`
2. ✅ Verify Redis connection: `docker-compose logs app | grep redis`
3. ✅ Push to Git: `git push origin main`
4. ✅ Deploy to Coolify (follows docker-compose.yaml automatically)
5. ✅ Monitor in production: Check Coolify logs

## Documentation

- **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Docker usage**: See [DOCKER.md](./DOCKER.md)
- **General setup**: See [README.md](./README.md)

## Support

If you encounter issues:
1. Check the [DOCKER.md](./DOCKER.md) troubleshooting section
2. View Docker logs: `docker-compose logs -f`
3. Test Redis: `docker-compose exec redis redis-cli ping`
4. Open an issue on GitHub

---

**Summary**: Your app now runs Redis internally via Docker. No external Redis service needed. No manual REDIS_URL configuration required. Just deploy and it works! 🚀

