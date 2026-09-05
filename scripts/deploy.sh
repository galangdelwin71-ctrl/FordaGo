#!/usr/bin/env bash
# ==============================================================================
# FordaGO Podman Deployment Script for Cloud Server (Linux VPS)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "========================================================"
echo " 🚀 FordaGO Podman Cloud Deployment"
echo "========================================================"
echo ""

# 1. Detect podman compose or podman-compose
COMPOSE_CMD=""
if command -v podman &> /dev/null && podman compose version &> /dev/null; then
    COMPOSE_CMD="podman compose"
elif command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Neither 'podman compose', 'podman-compose', nor Docker was found."
    echo "👉 Please install podman & podman-compose on your Linux server."
    exit 1
fi

echo "✅ Using container orchestrator: $COMPOSE_CMD"

# 2. Check backend .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found! Creating from backend/.env.production.example..."
    cp backend/.env.production.example backend/.env
    echo "❗ IMPORTANT: Please edit 'backend/.env' with your real production database password, APP_URL, and mail keys!"
fi

# 3. Choose compose file
COMPOSE_FILE=""
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="-f docker-compose.prod.yml"
fi

# 4. Pull / Build images
echo ""
echo "📦 Building FordaGO containers..."
$COMPOSE_CMD $COMPOSE_FILE build

# 5. Start all services in detached mode
echo ""
echo "🚀 Starting FordaGO services (db, backend, reverb, queue, frontend, gateway)..."
$COMPOSE_CMD $COMPOSE_FILE up -d

# 6. Show container status
echo ""
echo "🔍 Container Status:"
$COMPOSE_CMD $COMPOSE_FILE ps

echo ""
echo "========================================================"
echo " 🎉 FordaGO is now running!"
echo " 🌐 Web App / API : http://<YOUR_SERVER_IP>"
echo " ⚡ Reverb WS     : ws://<YOUR_SERVER_IP>/app"
echo "========================================================"
echo ""
echo "Tip: Run '$COMPOSE_CMD logs -f' to view live application logs."
