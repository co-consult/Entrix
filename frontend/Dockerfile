# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install ALL dependencies (including dev dependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Bake public env vars at build time (Next.js requirement)
ARG NEXT_PUBLIC_API_URL=https://preprod.css.cloud.ms2tech.fr/api/v1
ARG NEXT_PUBLIC_APP_URL=https://preprod.css.cloud.ms2tech.fr
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Create necessary directories
RUN mkdir -p /app/.next/cache /app/temp && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1 