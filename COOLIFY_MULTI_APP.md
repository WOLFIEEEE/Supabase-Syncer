# Coolify Multi-Application Setup Guide

## Understanding Ports in Coolify

### How Coolify Works

Coolify uses **Traefik** as a reverse proxy that automatically routes traffic to your applications based on **domain names**, not ports. This means:

✅ **No port conflicts** - Multiple apps can use the same internal port (3000)  
✅ **No manual port mapping** - Coolify handles routing automatically  
✅ **Domain-based access** - Each app accessed via its own domain  
✅ **Automatic SSL** - HTTPS certificates managed automatically  

### Architecture

```
Internet
   │
   ▼
┌─────────────────────────────────────┐
│     Coolify Traefik (Port 80/443)   │
│     (Reverse Proxy)                 │
└─────────────────────────────────────┘
   │                    │
   │                    │
   ▼                    ▼
┌──────────┐      ┌──────────┐
│  App 1   │      │  App 2   │
│ :3000    │      │ :3000    │
│          │      │          │
│ Domain:  │      │ Domain:  │
│ app1.com │      │ app2.com │
└──────────┘      └──────────┘
```

**Key Point**: Both apps use port 3000 internally, but Traefik routes based on domain names.

## Current Configuration

### For Coolify (Production)

Your `docker-compose.yaml` is configured correctly:

```yaml
services:
  app:
    expose:
      - "3000"  # Internal port - Traefik discovers this
    # ports:    # NOT needed - commented out
    #   - "3000:3000"
```

**Why this works:**
- `expose: 3000` tells Docker the container listens on port 3000
- Coolify's Traefik automatically discovers this port
- Traefik routes traffic from your domain to port 3000
- No public port mapping needed

### For Local Development

If you need to test locally with port access:

1. **Option A: Use override file** (Recommended)
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   docker-compose up -d
   # Access at: http://localhost:3000
   ```

2. **Option B: Uncomment ports in docker-compose.yaml**
   ```yaml
   ports:
     - "3000:3000"
   ```

## Multiple Applications on Same Coolify Server

### Example Setup

You can run multiple applications on the same Coolify server:

**App 1: Supabase Syncer**
- Domain: `suparbase.com`
- Internal Port: `3000`
- Coolify Route: `suparbase.com` → Container Port 3000

**App 2: Another Next.js App**
- Domain: `myapp.com`
- Internal Port: `3000` (same port, no conflict!)
- Coolify Route: `myapp.com` → Container Port 3000

**App 3: Python API**
- Domain: `api.example.com`
- Internal Port: `8000`
- Coolify Route: `api.example.com` → Container Port 8000

### How Coolify Routes

1. **Request comes in**: `https://suparbase.com/api/status`
2. **Traefik receives**: Request on port 443 (HTTPS)
3. **Traefik checks**: Which container has domain `suparbase.com`?
4. **Traefik routes**: To that container's internal port 3000
5. **Response**: Container responds, Traefik forwards to client

**No port conflicts because routing is domain-based!**

## Configuration Best Practices

### ✅ DO (For Coolify)

```yaml
services:
  app:
    expose:
      - "3000"  # Internal port only
    # No ports mapping needed
```

### ❌ DON'T (For Coolify)

```yaml
services:
  app:
    ports:
      - "3000:3000"  # Not needed, can cause conflicts
```

### Why Avoid Port Mapping in Coolify?

1. **Port Conflicts**: If multiple apps try to use port 3000 on host, Docker will error
2. **Unnecessary**: Traefik handles routing automatically
3. **Security**: Exposing ports directly is less secure than using reverse proxy
4. **Flexibility**: Domain-based routing is more flexible

## Coolify Configuration

### coolify.json

Your `coolify.json` correctly specifies the port for Coolify to know:

```json
{
  "services": {
    "app": {
      "ports": {
        "3000": "3000"  // This tells Coolify which port to route to
      }
    }
  }
}
```

**Note**: This is different from Docker's `ports` mapping. This tells Coolify's Traefik which port to route to inside the container.

## Troubleshooting

### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**: 
- Remove `ports` mapping from `docker-compose.yaml`
- Use `expose` instead (already configured)
- Coolify doesn't need port mapping

### Issue: Can't Access App

**Check**:
1. Domain is configured in Coolify
2. SSL certificate is issued
3. Container is running: `docker ps`
4. Health check passes: Check Coolify logs

### Issue: Multiple Apps Conflict

**Solution**: 
- Each app should have its own domain
- No port mapping needed in docker-compose.yaml
- Coolify routes based on domain, not port

## Local Development vs Coolify

### Local Development

```yaml
# docker-compose.override.yml (for local only)
services:
  app:
    ports:
      - "3000:3000"  # Expose for localhost access
```

**Access**: `http://localhost:3000`

### Coolify Production

```yaml
# docker-compose.yaml (for Coolify)
services:
  app:
    expose:
      - "3000"  # Internal only, Traefik routes
```

**Access**: `https://suparbase.com` (via Traefik)

## Summary

✅ **Port 3000 is NOT exposed publicly in Coolify**  
✅ **Multiple apps can use port 3000 internally**  
✅ **Coolify routes based on domain names**  
✅ **No port conflicts possible**  
✅ **Traefik handles all routing automatically**  

Your current configuration is correct for Coolify! The `expose: 3000` tells Coolify which port to route to, and Traefik handles the rest.

---

**For local development**, use `docker-compose.override.yml` to expose ports.  
**For Coolify**, your current setup is perfect - no changes needed!

