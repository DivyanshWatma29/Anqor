# 🚀 Deployment Guide - Anqor

## Overview
This document covers the complete CI/CD setup for the Anqor application, including staging, production, rollback procedures, and zero-downtime deployments.

---

## 📋 Table of Contents
1. [Architecture](#architecture)
2. [Staging Environment](#staging-environment)
3. [Production Environment](#production-environment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Zero-Downtime Deployment](#zero-downtime-deployment)
6. [Rollback Procedures](#rollback-procedures)
7. [Environment Variables](#environment-variables)
8. [Monitoring & Health Checks](#monitoring--health-checks)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions (CI/CD)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Test    │→ │  Build   │→ │ Staging  │→ │Production│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │    Staging Server (staging.anqor.com)│
        │    - Separate Supabase project       │
        │    - Same config as production       │
        └─────────────────────────────────────┘
        ┌─────────────────────────────────────┐
        │   Production Server (anqor.com)     │
        │    - PM2 cluster mode                │
        │    - Nginx reverse proxy             │
        │    - SSL/TLS enabled                 │
        └─────────────────────────────────────┘
```

---

## Staging Environment

### Purpose
- Mirror production exactly (same dependencies, same config structure)
- Test deployments before production
- Separate from production data (separate Supabase project)

### Setup

1. **Create staging server** (same specs as production):
   ```bash
   # On staging server
   git clone https://github.com/your-org/anqor.git /opt/anqor-staging
   cd /opt/anqor-staging
   git checkout staging
   ```

2. **Configure environment**:
   ```bash
   cp .env.staging.example .env.staging
   # Edit .env.staging with actual values
   nano .env.staging
   ```

3. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js --env staging
   pm2 save
   pm2 startup  # Follow instructions for auto-start
   ```

4. **Verify**:
   ```bash
   curl http://localhost:8788/health
   ```

### Staging URL
- URL: `https://staging.anqor.com`
- Branch: `staging` or `develop`
- Auto-deploys on push to `staging` branch

---

## Production Environment

### Setup

1. **Create production server**
2. **Configure environment**:
   ```bash
   cp .env.production.example .env.production
   # Edit with production values
   nano .env.production
   ```

3. **Start with PM2 (cluster mode for zero-downtime)**:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx** (see `nginx/nginx.conf`)
5. **Setup SSL** with certbot:
   ```bash
   certbot --nginx -d anqor.com -d www.anqor.com
   ```

---

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main`, `develop`, `staging` branches
- Pull requests to `main`, `develop`

**Jobs:**
1. **Test** - Runs on every PR/push
   - Linter (`bun run lint`)
   - Type check (`bunx tsc --noEmit`)
   - Unit tests with coverage (`bun run test -- --coverage`)

2. **Build** - After tests pass
   - Builds for production
   - Uploads artifacts

3. **Deploy Staging** - Auto on `staging`/`develop` branch
   - Uses `staging` environment
   - Deploys via SSH
   - Runs health check

4. **Deploy Production** - Auto on `main` branch
   - Requires `production` environment approval (optional)
   - Deploys with zero-downtime
   - Runs health check
   - Auto-rollbacks on failure

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**:

#### Staging:
- `STAGING_SUPABASE_URL` - Staging Supabase URL
- `STAGING_SUPABASE_SERVICE_ROLE_KEY` - Staging service role key
- `STAGING_SSH_HOST` - Staging server IP/hostname
- `STAGING_SSH_USER` - SSH username
- `STAGING_SSH_KEY` - SSH private key (entire key content)

#### Production:
- `VITE_SUPABASE_URL` - Production Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Production anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
- `PRODUCTION_SSH_HOST` - Production server IP/hostname
- `PRODUCTION_SSH_USER` - SSH username
- `PRODUCTION_SSH_KEY` - SSH private key

#### Optional:
- `SENTRY_AUTH_TOKEN` - For source map uploads
- `POSTHOG_API_KEY` - For analytics

### Required GitHub Variables

Go to **Settings → Secrets and variables → Actions → Variables**:

- `STAGING_URL` - `https://staging.anqor.com`
- `PRODUCTION_URL` - `https://anqor.com`

---

## Zero-Downtime Deployment

### Strategy
We use **PM2 cluster mode** with **Nginx reverse proxy** for zero-downtime deployments.

### How it works:
1. **PM2 cluster mode** - Multiple instances run simultaneously
2. **Rolling restart** - PM2 restarts instances one at a time
3. **Nginx health checks** - Stops sending traffic to unhealthy instances
4. **Docker healthcheck** - Container-level health monitoring

### Deployment Flow:
```bash
# 1. Deploy new code
git pull origin main
bun install --frozen-lockfile
bun run build

# 2. Reload with zero-downtime (PM2 sends SIGUSR1 to reload cluster)
pm2 reload anqor --update-env

# 3. Wait for health check
sleep 10
curl -f http://localhost:8787/health

# 4. If health check fails, rollback automatically
if [ $? -ne 0 ]; then
    pm2 rollback anqor
fi
```

### Nginx Configuration
The `nginx/nginx.conf` handles:
- SSL termination
- Rate limiting (API: 10r/s, Auth: 5r/s)
- Health check bypass (no rate limiting on `/health`)
- Failover to healthy instances only

---

## Rollback Procedures

### Automated Rollback (CI/CD)
The GitHub Actions workflow automatically rolls back if:
- Health check fails after deployment
- Exit code is non-zero

### Manual Rollback

#### Option 1: Quick Rollback (Previous Version)
```bash
# On production server
pm2 rollback anqor
```

#### Option 2: Rollback to Specific Version
```bash
# Using the rollback script
./scripts/rollback.sh production v1.2.3

# Or manually:
cd /opt/anqor
git checkout v1.2.3
bun install --frozen-lockfile
bun run build
pm2 restart anqor --update-env
```

#### Option 3: Rollback Staging
```bash
./scripts/rollback.sh staging
```

### Rollback Verification
After rollback, always verify:
```bash
# Check PM2 status
pm2 status

# Check health
curl http://localhost:8787/health

# Check logs
pm2 logs anqor --lines 50
```

---

## Environment Variables

### Management Strategy
- **Never commit** actual `.env` files (excluded in `.gitignore`)
- Use `.env.example` and `.env.*.example` as templates
- Store secrets in GitHub Secrets for CI/CD
- Use separate values for staging and production

### Staging vs Production

| Variable | Staging | Production |
|----------|---------|------------|
| `NODE_ENV` | `staging` | `production` |
| `SUPABASE_URL` | Separate project | Production project |
| `SESSION_SECRET` | Different secret | Different secret |
| `VITE_API_BASE_URL` | `https://staging.anqor.com` | `https://anqor.com` |

### Client-Side Variables (VITE_)
Client-side environment variables must be:
1. Prefixed with `VITE_`
2. Set at build time (not runtime)
3. Injected via build command in CI/CD

---

## Monitoring & Health Checks

### Health Check Endpoints

#### `/health` - Detailed Health Check
```bash
curl https://anqor.com/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-08T18:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.2.3",
  "supabase": "connected"
}
```

#### `/healthz` - Simple Health Check (Docker/Load Balancer)
```bash
curl https://anqor.com/healthz
# Response: OK
```

### Monitoring Tools
- **Sentry** - Error tracking (`@sentry/react`, `@sentry/node`)
- **PostHog** - User analytics
- **Vercel Speed Insights** - Performance monitoring
- **PM2** - Process monitoring (`pm2 monit`)

### Log Locations
- PM2 logs: `~/.pm2/logs/`
- Application logs: `./logs/`
- Nginx logs: `/var/log/nginx/`

---

## Quick Reference

### Deploy to Staging
```bash
git push origin staging
# GitHub Actions automatically deploys
```

### Deploy to Production
```bash
git push origin main
# GitHub Actions automatically deploys
```

### Check Deployment Status
```bash
# PM2 status
pm2 status

# Health check
curl https://anqor.com/health

# View logs
pm2 logs anqor
```

### Emergency Rollback
```bash
./scripts/rollback.sh production
```

---

## Troubleshooting

### Deployment Failed
1. Check GitHub Actions logs
2. SSH to server and check: `pm2 logs anqor`
3. Verify environment: `cat .env.production`
4. Run rollback: `./scripts/rollback.sh production`

### Health Check Failing
1. Check if server is running: `pm2 status`
2. Check port: `curl http://localhost:8787/health`
3. Check Supabase connection
4. Review logs: `pm2 logs anqor --err`

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew

# Verify Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Security Notes
- ✅ No hardcoded secrets (all via env vars)
- ✅ Separate staging/production environments
- ✅ Rate limiting on auth endpoints
- ✅ HTTPS enforced (via Nginx + server middleware)
- ✅ Security headers set (CSP, X-Frame-Options, etc.)
- ✅ Health check endpoint doesn't expose sensitive data

---

**Last Updated:** May 8, 2026
