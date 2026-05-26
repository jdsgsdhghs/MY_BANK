#!/usr/bin/env bash
# Pull latest images from GHCR and restart the production stack
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "==> Restarting services with zero-downtime intent..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "==> Pruning unused images..."
docker image prune -f

echo "==> Deployment complete."
docker compose -f docker-compose.prod.yml ps
