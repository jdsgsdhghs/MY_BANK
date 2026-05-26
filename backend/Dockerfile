# Symfony backend - PHP 8.2 + FPM
FROM php:8.2-fpm-alpine AS base

RUN apk add --no-cache \
    git \
    unzip \
    icu-dev \
    libzip-dev \
    postgresql-dev \
    oniguruma-dev \
    autoconf \
    g++ \
    make \
    linux-headers \
  && docker-php-ext-install \
    intl \
    pdo \
    pdo_pgsql \
    opcache \
    zip \
  && pecl install apcu \
  && docker-php-ext-enable apcu \
  && apk del autoconf g++ make linux-headers

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dev stage
FROM base AS dev
ENV APP_ENV=dev
COPY composer.json composer.lock* symfony.lock* ./
RUN composer install --no-interaction --no-scripts --no-progress || true
COPY . .
RUN composer dump-autoload --optimize || true
CMD ["php-fpm"]

# Prod stage
FROM base AS prod
ENV APP_ENV=prod
COPY composer.json composer.lock* symfony.lock* ./
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts --no-progress
COPY . .
RUN composer dump-autoload --no-dev --optimize \
  && mkdir -p var/cache var/log \
  && chown -R www-data:www-data var
CMD ["php-fpm"]
