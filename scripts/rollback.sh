#!/bin/bash
# ==========================================
# ROLLBACK SCRIPT - Automated Rollback
# Usage: ./scripts/rollback.sh [production|staging] [version]
# ==========================================

set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-previous}

echo "🔄 Starting rollback for $ENVIRONMENT (target: $VERSION)"

# Configuration
if [ "$ENVIRONMENT" = "staging" ]; then
    APP_DIR="/opt/anqor-staging"
    APP_NAME="anqor-staging"
    HEALTH_URL="http://localhost:8788/health"
    BRANCH="staging"
else
    APP_DIR="/opt/anqor"
    APP_NAME="anqor"
    HEALTH_URL="http://localhost:8787/health"
    BRANCH="main"
fi

cd "$APP_DIR"

# Get list of recent deployments
echo "📋 Recent deployments:"
ls -lt /opt/deployments/ 2>/dev/null | head -10 || echo "No deployment history found"

# Rollback to specific version or previous
if [ "$VERSION" = "previous" ]; then
    # Get previous version using PM2
    echo "⏪ Rolling back to previous version..."
    pm2 rollback "$APP_NAME"
else
    # Rollback to specific git commit/tag
    echo "⏪ Rolling back to version: $VERSION"
    git checkout "$VERSION"
    bun install --frozen-lockfile
    bun run build
    pm2 restart "$APP_NAME" --update-env
fi

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🏥 Running health check..."
for i in {1..30}; do
    if curl -f "$HEALTH_URL" 2>/dev/null; then
        echo "✅ Health check passed!"
        echo "📊 Current status:"
        pm2 status "$APP_NAME"
        exit 0
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

echo "❌ Health check failed after rollback!"
echo "📋 Recent logs:"
pm2 logs "$APP_NAME" --lines 50 --nostream
exit 1
