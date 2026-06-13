#!/bin/sh
# ============================================================================
# Entrypoint production MyBank (stages prod & render).
#
# 1. Matérialise les clés JWT depuis les variables d'environnement (base64)
#    ou les génère en dernier recours (les tokens seront invalidés à chaque
#    redéploiement — à éviter, voir README_DEPLOYMENT.md).
# 2. Rend la config nginx (stage render uniquement, via envsubst sur $PORT).
# 3. Réchauffe le cache Symfony.
# 4. Applique les migrations Doctrine.
# 5. Démarre le process principal (php-fpm ou supervisord).
# ============================================================================
set -e

cd /var/www/html

# --- 1. Clés JWT -------------------------------------------------------------
mkdir -p config/jwt

if [ -n "${JWT_PRIVATE_KEY_BASE64:-}" ] && [ -n "${JWT_PUBLIC_KEY_BASE64:-}" ]; then
    echo "==> JWT : clés injectées depuis l'environnement."
    echo "$JWT_PRIVATE_KEY_BASE64" | base64 -d > config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_BASE64"  | base64 -d > config/jwt/public.pem
elif [ ! -f config/jwt/private.pem ]; then
    echo "==> JWT : ATTENTION — génération de clés éphémères (les tokens"
    echo "==>       émis seront invalidés au prochain déploiement)."
    PASSPHRASE="${JWT_PASSPHRASE:?JWT_PASSPHRASE est requis}"
    openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa \
        -pkeyopt rsa_keygen_bits:4096 -pass pass:"$PASSPHRASE"
    openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem \
        -pubout -passin pass:"$PASSPHRASE"
fi
chown www-data:www-data config/jwt/private.pem config/jwt/public.pem
chmod 640 config/jwt/private.pem
chmod 644 config/jwt/public.pem

# --- 2. Config nginx (stage render) -----------------------------------------
if [ -f /etc/nginx/templates/default.conf.template ]; then
    echo "==> Nginx : rendu de la configuration (PORT=${PORT:-10000})."
    export PORT="${PORT:-10000}"
    mkdir -p /etc/nginx/http.d /run/nginx
    envsubst '${PORT}' < /etc/nginx/templates/default.conf.template \
        > /etc/nginx/http.d/default.conf
fi

# --- 3. Cache Symfony ---------------------------------------------------------
echo "==> Symfony : warmup du cache (env=prod)."
php bin/console cache:clear --no-interaction
chown -R www-data:www-data var

# --- 4. Migrations Doctrine ----------------------------------------------------
echo "==> Doctrine : attente de la base de données..."
tries=0
until php bin/console dbal:run-sql "SELECT 1" >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
        echo "==> ERREUR : base de données injoignable après 30 tentatives." >&2
        exit 1
    fi
    sleep 2
done
echo "==> Doctrine : exécution des migrations."
if ls migrations/*.php >/dev/null 2>&1; then
    php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
else
    php bin/console doctrine:schema:update --force --complete --no-interaction
fi

# --- 5. Process principal -------------------------------------------------------
echo "==> Démarrage : $*"
exec "$@"
