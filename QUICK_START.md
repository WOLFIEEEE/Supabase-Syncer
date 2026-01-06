# Quick Start Guide - Supabase Syncer with Self-Hosted Redis

## 🎯 TL;DR

Your app now includes Redis automatically. No external Redis service needed. No manual configuration required.

## 📋 What You Need

### Required Environment Variables (Only 4!)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ENCRYPTION_KEY=<generate with: openssl rand -hex 16>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### What You DON'T Need
- ❌ External Redis service (Upstash, Redis Cloud, etc.)
- ❌ REDIS_URL environment variable
- ❌ Manual Redis configuration

## 🚀 Deploy in 3 Steps

### Step 1: Create `.env` File
```bash
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ENCRYPTION_KEY=$(openssl rand -hex 16)
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

### Step 2: Start with Docker
```bash
docker-compose up -d
```

### Step 3: Access Application
```bash
open http://localhost:3000
```

That's it! Redis is automatically running and connected.

## 🎮 Common Commands

### Start Application
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Application
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

### Test Redis Connection
```bash
docker-compose exec redis redis-cli ping
```

## 🌐 Deploy to Coolify

### Step 1: Set Environment Variables in Coolify
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ENCRYPTION_KEY=your-encryption-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 2: Deploy
Click "Deploy" in Coolify. That's it!

Coolify will automatically:
- Detect `docker-compose.yaml`
- Build app container
- Pull Redis image
- Connect services via internal network
- Set REDIS_URL automatically
- Start with health checks

## ✅ Verify Deployment

### Check Health
```bash
curl https://yourdomain.com/api/status
```

### Check Redis (locally)
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Check App Logs
```bash
docker-compose logs app | grep -i redis
# Should show: Connected to Redis
```

## 📊 Services Running

When you run `docker-compose up -d`, you get:

1. **App Container** (supabase-syncer)
   - Next.js application
   - Port: 3000
   - Connects to: Redis (internal) + Supabase (external)

2. **Redis Container** (supabase-syncer-redis)
   - Redis 7 Alpine
   - Internal only (not exposed)
   - Persistent storage via Docker volume

## 🔧 Customization

### Increase Redis Memory
Edit `docker-compose.yaml`:
```yaml
services:
  redis:
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Add Redis Password (Optional)
Edit `docker-compose.yaml`:
```yaml
services:
  redis:
    command: redis-server --appendonly yes --requirepass YOUR_PASSWORD
  app:
    environment:
      - REDIS_URL=redis://:YOUR_PASSWORD@redis:6379
```

## 🐛 Troubleshooting

### Problem: App won't start
```bash
# Check logs
docker-compose logs app

# Common fixes:
# 1. Check environment variables
# 2. Verify Supabase URL is correct
# 3. Restart: docker-compose restart
```

### Problem: Redis connection error
```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis health
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

### Problem: Data not persisting
```bash
# Check volume exists
docker volume ls | grep redis_data

# Recreate volume
docker-compose down -v
docker-compose up -d
```

## 📖 More Information

- **Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Docker Details**: [DOCKER.md](./DOCKER.md)
- **Redis Setup**: [REDIS_SETUP.md](./REDIS_SETUP.md)
- **General Documentation**: [README.md](./README.md)

## 💰 Costs

| Service | Cost |
|---------|------|
| Supabase Free Tier | $0/month |
| Redis (Self-Hosted) | $0/month |
| **Total** | **$0/month** |

Only server costs (which you're already paying for).

## 🎉 Success Indicators

You know everything is working when:

✅ `docker-compose ps` shows both containers healthy  
✅ `curl localhost:3000/api/status` returns `{"status":"ok"}`  
✅ `docker-compose exec redis redis-cli ping` returns `PONG`  
✅ App logs show "Connected to Redis"  
✅ You can create sync jobs and they process  

## 🤝 Need Help?

1. Check the [troubleshooting section](#-troubleshooting) above
2. View logs: `docker-compose logs -f`
3. Check [DOCKER.md](./DOCKER.md) for detailed troubleshooting
4. Open an issue on GitHub

---

**Remember**: No REDIS_URL needed! It's automatically configured by docker-compose! 🚀

