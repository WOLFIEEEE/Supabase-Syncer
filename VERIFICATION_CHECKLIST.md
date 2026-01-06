# Verification Checklist - Redis Self-Hosting Implementation

Use this checklist to verify everything is working correctly after implementing self-hosted Redis.

## Pre-Deployment Verification

### 1. File Changes Review
- [ ] `docker-compose.yaml` includes Redis service
- [ ] `docker-compose.yaml` sets REDIS_URL automatically
- [ ] `coolify.json` updated to docker-compose type
- [ ] `lib/queue/client.ts` has enhanced retry logic
- [ ] Documentation files created (5 new files)
- [ ] README.md updated with Redis info

### 2. Configuration Check
- [ ] No manual REDIS_URL in docker-compose.yaml environment
- [ ] Redis service uses redis:7-alpine image
- [ ] Volume configured for redis_data
- [ ] Network configured as bridge driver
- [ ] Health checks configured for both services

## Local Testing

### 3. Docker Compose Startup
```bash
docker-compose up -d
```

- [ ] App container starts successfully
- [ ] Redis container starts successfully
- [ ] Both containers show "healthy" status
- [ ] No error messages in startup logs

**Verify**:
```bash
docker-compose ps
# Should show both containers running and healthy
```

### 4. Redis Connection Test
```bash
docker-compose exec redis redis-cli ping
```

- [ ] Returns "PONG"
- [ ] No connection errors
- [ ] Responds quickly (<100ms)

### 5. Redis Info Check
```bash
docker-compose exec redis redis-cli INFO server
```

- [ ] Shows redis_version: 7.x.x
- [ ] Shows correct OS (Alpine Linux)
- [ ] Process is running

### 6. App Connection to Redis
```bash
docker-compose logs app | grep -i redis
```

- [ ] No "connection refused" errors
- [ ] No "connection timeout" errors
- [ ] Shows successful connection (if logged)

### 7. Application Health Check
```bash
curl http://localhost:3000/api/status
```

- [ ] Returns 200 OK
- [ ] Response includes `{"status":"ok"}`
- [ ] Responds quickly (<1s)

### 8. Redis Memory Configuration
```bash
docker-compose exec redis redis-cli CONFIG GET maxmemory
```

- [ ] Returns "268435456" (256MB) or configured value
- [ ] Value is not "0" (unlimited)

### 9. Redis Persistence Check
```bash
docker-compose exec redis redis-cli CONFIG GET appendonly
```

- [ ] Returns "yes"
- [ ] AOF persistence is enabled

### 10. Volume Persistence Test
```bash
# Set a test key
docker-compose exec redis redis-cli SET test_key "test_value"

# Restart Redis
docker-compose restart redis

# Check if key persists
docker-compose exec redis redis-cli GET test_key
```

- [ ] Returns "test_value"
- [ ] Data survives restart

### 11. Network Isolation Verification
```bash
# Try to connect from host (should fail if not exposed)
redis-cli -h localhost -p 6379 ping
```

- [ ] Connection refused (good - Redis is internal only)
- [ ] Only accessible from within Docker network

### 12. Background Job Test

**If you have sync jobs functionality:**

```bash
# Create a test sync job via the UI or API
# Then check Redis queue
docker-compose exec redis redis-cli KEYS "*"
```

- [ ] Shows job-related keys (e.g., bull:sync-jobs:*)
- [ ] Job is processed successfully
- [ ] Job completion logged

## Coolify Deployment Testing

### 13. Git Repository
- [ ] All changes committed to Git
- [ ] Changes pushed to remote repository
- [ ] docker-compose.yaml in repository root
- [ ] coolify.json in repository root

### 14. Coolify Application Setup
- [ ] Application type: Docker Compose
- [ ] Correct repository connected
- [ ] Correct branch selected (main/master)
- [ ] Build pack: Docker Compose

### 15. Environment Variables in Coolify
- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] ENCRYPTION_KEY set
- [ ] NEXT_PUBLIC_APP_URL set
- [ ] REDIS_URL **NOT** set (auto-configured)

### 16. Coolify Deployment
```bash
# In Coolify, click Deploy and monitor logs
```

- [ ] Build starts successfully
- [ ] Both services (app + Redis) are detected
- [ ] Redis image pulls successfully
- [ ] App builds without errors
- [ ] Services start with health checks passing
- [ ] Domain accessible (if configured)

### 17. Production Health Check
```bash
curl https://yourdomain.com/api/status
```

- [ ] Returns 200 OK
- [ ] Response time <2s
- [ ] No server errors

### 18. Coolify Logs Review
```bash
# In Coolify, view application logs
```

- [ ] No Redis connection errors
- [ ] No "ECONNREFUSED" errors
- [ ] No "timeout" errors
- [ ] Application started successfully

## Functionality Testing

### 19. User Authentication
- [ ] Can sign up for new account
- [ ] Can log in
- [ ] Session persists
- [ ] Can log out

### 20. Connection Management
- [ ] Can create database connection
- [ ] Can test connection
- [ ] Can view connection details
- [ ] Can delete connection

### 21. Schema Sync
- [ ] Can compare schemas
- [ ] Can view differences
- [ ] Can generate migration scripts
- [ ] Can execute migrations (if applicable)

### 22. Data Sync
- [ ] Can create sync job
- [ ] Sync job queues successfully
- [ ] Sync job processes
- [ ] Can view sync history
- [ ] Can see sync progress

### 23. Background Jobs
```bash
# In Coolify or local, check Redis
docker-compose exec redis redis-cli INFO stats
```

- [ ] total_commands_processed > 0
- [ ] No rejected connections
- [ ] No failed commands

## Performance Testing

### 24. Redis Performance
```bash
docker-compose exec redis redis-cli --latency
```

- [ ] Average latency <1ms
- [ ] No timeout errors
- [ ] Stable performance

### 25. Memory Usage
```bash
docker-compose exec redis redis-cli INFO memory | grep used_memory_human
```

- [ ] Used memory is reasonable (<256MB)
- [ ] No memory warnings
- [ ] Eviction policy active if needed

### 26. App Response Time
```bash
time curl http://localhost:3000/api/status
```

- [ ] Response time <500ms
- [ ] Consistent response times
- [ ] No timeout errors

## Security Verification

### 27. Redis Network Security
```bash
# From outside Docker, try to connect
telnet localhost 6379
```

- [ ] Connection refused (good - not exposed)
- [ ] Only accessible internally

### 28. Environment Variables Security
```bash
# Check if sensitive vars are exposed
docker-compose exec app env | grep REDIS
```

- [ ] REDIS_URL is set correctly
- [ ] No passwords in plain text (if configured)

### 29. SSL/HTTPS (Production)
```bash
curl -I https://yourdomain.com
```

- [ ] Returns 200 OK
- [ ] Certificate valid
- [ ] HTTPS enforced

## Monitoring Setup

### 30. Logs Accessibility
```bash
docker-compose logs -f
```

- [ ] Logs are readable
- [ ] Timestamps present
- [ ] No excessive error messages

### 31. Health Check Endpoints
```bash
curl http://localhost:3000/api/status
curl http://localhost:3000/api/health
```

- [ ] Both return success
- [ ] Include useful information
- [ ] Response format is JSON

## Documentation Verification

### 32. Documentation Completeness
- [ ] DEPLOYMENT.md exists and is comprehensive
- [ ] DOCKER.md exists with commands and troubleshooting
- [ ] REDIS_SETUP.md explains the setup
- [ ] QUICK_START.md provides quick reference
- [ ] README.md updated with Redis info
- [ ] CHANGES_SUMMARY.md documents all changes

### 33. Documentation Accuracy
- [ ] Environment variable examples are correct
- [ ] Commands work as documented
- [ ] Architecture diagrams match reality
- [ ] Troubleshooting steps are helpful

## Final Verification

### 34. Restart Resilience
```bash
docker-compose down
docker-compose up -d
```

- [ ] All services restart successfully
- [ ] Redis data persists
- [ ] App reconnects to Redis
- [ ] No errors in logs

### 35. Full Integration Test
- [ ] Create account
- [ ] Add database connection
- [ ] Create sync job
- [ ] Monitor job execution
- [ ] Verify sync completes
- [ ] Check sync history

### 36. Error Handling
```bash
# Stop Redis temporarily
docker-compose stop redis

# Try to create sync job (should handle gracefully)
# Then restart Redis
docker-compose start redis
```

- [ ] App handles Redis downtime gracefully
- [ ] Error messages are user-friendly
- [ ] App reconnects automatically after Redis restart

## Success Criteria

✅ **All checkboxes above are checked**  
✅ **No critical errors in logs**  
✅ **Application functions correctly**  
✅ **Redis is accessible only internally**  
✅ **Data persists across restarts**  
✅ **Documentation is complete and accurate**  

## If Any Test Fails

### Debugging Steps
1. Check logs: `docker-compose logs -f`
2. Check Redis: `docker-compose exec redis redis-cli ping`
3. Check network: `docker network inspect supabase-syncer_app_network`
4. Check volumes: `docker volume ls | grep redis`
5. Review [DOCKER.md](./DOCKER.md) troubleshooting section

### Common Issues

**Redis connection refused**:
```bash
docker-compose restart redis
docker-compose logs redis
```

**App can't find Redis**:
```bash
# Check REDIS_URL is set correctly
docker-compose exec app env | grep REDIS_URL
# Should be: redis://redis:6379
```

**Data not persisting**:
```bash
# Check volume
docker volume inspect supabase-syncer_redis_data
```

## Sign-Off

Once all tests pass:

- [ ] **Developer**: All tests passed locally
- [ ] **Developer**: Committed and pushed to Git
- [ ] **Developer**: Deployed to staging/production
- [ ] **Developer**: Verified in production environment
- [ ] **Ready for users**: Documentation shared

---

**Date**: _______________  
**Verified By**: _______________  
**Environment**: _______________  
**Status**: ⬜ Pass | ⬜ Fail | ⬜ With Notes

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

