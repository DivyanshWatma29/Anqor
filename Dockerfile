# Multi-stage Dockerfile for Anqor Application
# Stage 1: Build the application
FROM oven/bun:1.3.13 AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ARG NODE_ENV=production
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL

ENV NODE_ENV=${NODE_ENV}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN bun run build

# Stage 2: Production server
FROM oven/bun:1.3.13 AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Copy necessary config files
COPY ecosystem.config.js ./
COPY .env.example ./

# Set environment
ENV NODE_ENV=production
ENV PORT=8787

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run healthcheck || exit 1

# Expose port
EXPOSE 8787

# Run with PM2 for zero-downtime restarts
CMD ["bun", "run", "server/bff.js"]
