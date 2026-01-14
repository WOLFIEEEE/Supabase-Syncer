# =========================================
# Supabase Syncer Backend - Production Dockerfile
# Optimized for Coolify deployment
# =========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
# Increase Node.js heap size (default is ~512MB, set to 768MB to leave room for other memory)
ENV NODE_OPTIONS=--max-old-space-size=768

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built files
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/package.json ./

# Switch to non-root user
USER fastify

# Expose port
EXPOSE 3001

# Health check - use /health/live for basic liveness check
# /health/ready depends on Redis and may fail during startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health/live || exit 1

# Start the application
CMD ["node", "dist/index.js"]

