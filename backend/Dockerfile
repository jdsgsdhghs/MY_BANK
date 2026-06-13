# ============================================================================
# MyBank backend — Symfony 7.3 / PHP 8.2
#
# Stages :
#   base   : PHP-FPM Alpine + extensions + OPcache (socle commun)
#   dev    : développement local (docker-compose.yml, code monté en volume)
#   prod   : PHP-FPM seul, optimisé — pour docker-compose.prod.yml (nginx séparé)
#   render : nginx + PHP-FPM + supervisord dans UN conteneur, écoute sur $PORT.
#            Dernier stage => cible par défaut d'un `docker build` (Render).
# ============================================================================

FROM php:8.2-fpm-alpine AS base

RUN apk add --no-cache \
    git \
    unzip \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    autoconf \
    g++ \
    make \
    linux-headers \
  && docker-php-ext-install -j"$(nproc)" \
    intl \
    pdo \
    pdo_mysql \
    opcache \
    zip \
  && pecl install apcu \
  && docker-php-ext-enable apcu \
  && apk del autoconf g++ make linux-headers

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/html

# ---------------------------------------------------------------------------
# Dev — code monté en volume par docker-compose.yml, Xdebug non inclus.
# ---------------------------------------------------------------------------
FROM base AS dev
ENV APP_ENV=dev
COPY composer.json composer.lock* symfony.lock* ./
RUN composer install --no-interaction --no-scripts --no-progress
COPY . .
RUN composer dump-autoload --optimize
CMD ["php-fpm"]

# ---------------------------------------------------------------------------
# Prod — PHP-FPM seul (utilisé par docker-compose.prod.yml avec nginx dédié).
# ---------------------------------------------------------------------------
FROM base AS prod
ENV APP_ENV=prod \
    APP_DEBUG=0

COPY docker/php-prod.ini /usr/local/etc/php/conf.d/zz-prod.ini
COPY docker/www-prod.conf /usr/local/etc/php-fpm.d/zz-www.conf

# Dépendances d'abord (cache de layer Docker), code ensuite.
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-interaction --no-dev --no-scripts --no-progress --prefer-dist

COPY . .
RUN composer dump-autoload --no-dev --classmap-authoritative \
  && mkdir -p var/cache var/log config/jwt \
  && chown -R www-data:www-data var config/jwt \
  && rm -rf tests .phpunit.cache

ENTRYPOINT ["/bin/sh", "/var/www/html/docker/entrypoint-prod.sh"]
CMD ["php-fpm"]

# ---------------------------------------------------------------------------
# Render — image autonome : nginx (HTTP sur $PORT) + PHP-FPM + supervisord.
# Dernier stage du fichier => construit par défaut par Render.
# ---------------------------------------------------------------------------
FROM prod AS render

RUN apk add --no-cache nginx supervisor gettext

COPY docker/nginx-render.conf.template /etc/nginx/templates/default.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf

# Render injecte PORT (10000 par défaut).
ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" | grep -q '"ok"' || exit 1

ENTRYPOINT ["/bin/sh", "/var/www/html/docker/entrypoint-prod.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
