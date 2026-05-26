#!/bin/sh
set -e

# Install Composer deps if vendor is missing (handy in dev when the volume is empty)
if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
    echo "==> Installing Composer dependencies..."
    composer install --no-interaction --no-progress
fi

# Generate JWT keypair if missing
if [ ! -f config/jwt/private.pem ]; then
    echo "==> Generating JWT keys..."
    mkdir -p config/jwt
    PASSPHRASE="${JWT_PASSPHRASE:-mybank_jwt_passphrase}"
    openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -pass pass:"$PASSPHRASE"
    openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout -passin pass:"$PASSPHRASE"
fi

# Wait for the DB and run migrations (skip in test, the test bootstrap handles it)
if [ "${APP_ENV}" != "test" ]; then
    echo "==> Waiting for database..."
    until php bin/console dbal:run-sql "SELECT 1" >/dev/null 2>&1; do
        sleep 1
    done
    echo "==> Database ready."

    php bin/console doctrine:database:create --if-not-exists --no-interaction || true
    if [ -n "$(ls migrations/*.php 2>/dev/null)" ]; then
        php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration || true
    else
        php bin/console doctrine:schema:update --force --no-interaction || true
    fi
fi

exec "$@"
