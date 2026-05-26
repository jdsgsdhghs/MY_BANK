#!/usr/bin/env bash
# Bootstrap the dev environment: build images, install deps, generate JWT keys, migrate DB.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building Docker images..."
docker compose build

echo "==> Starting database..."
docker compose up -d db
sleep 4

echo "==> Installing Composer dependencies..."
docker compose run --rm backend composer install --no-interaction

echo "==> Generating JWT keys..."
docker compose run --rm backend sh -c '
  mkdir -p config/jwt
  if [ ! -f config/jwt/private.pem ]; then
    openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -pass pass:mybank_jwt_passphrase
    openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout -passin pass:mybank_jwt_passphrase
  fi
'

echo "==> Creating database & running migrations..."
docker compose run --rm backend php bin/console doctrine:database:create --if-not-exists --no-interaction || true
docker compose run --rm backend php bin/console doctrine:schema:create --no-interaction || \
  docker compose run --rm backend php bin/console doctrine:schema:update --force --no-interaction

echo "==> Installing Node dependencies..."
docker compose run --rm frontend npm install

echo "==> Starting full stack..."
docker compose up -d

echo "==> Done. Frontend: http://localhost:5173 — Backend API: http://localhost:8080/api/health"
