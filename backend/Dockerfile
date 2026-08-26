# ==============================================================================
# FordaGo Backend Dockerfile (PHP 8.3 FPM + Extensions + Composer)
# Compatible with Podman & Docker
# ==============================================================================

# --- Stage 1: Get official Composer binary ---
FROM docker.io/library/composer:2.7 AS composer_binary

# --- Stage 2: Main PHP-FPM Application Image ---
FROM php:8.4-fpm-alpine AS base

# Install system dependencies & extension installer
RUN apk add --no-cache \
    bash \
    curl \
    git \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    shadow \
    supervisor \
    nginx \
    mysql-client

# Download helper script for easy PHP extension installation
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions \
    pdo_mysql \
    bcmath \
    ctype \
    curl \
    dom \
    fileinfo \
    filter \
    hash \
    mbstring \
    openssl \
    pcre \
    pdo \
    session \
    tokenizer \
    xml \
    zip \
    gd \
    intl \
    pcntl \
    sockets \
    opcache \
    redis

# Install Composer
COPY --from=composer_binary /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer definition files first for cached dependency installation
COPY composer.json composer.lock ./

# Install production dependencies (can be bypassed if mounting in development)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest of the application code
COPY . .

# Finish composer autoload and package discovery
RUN composer dump-autoload --optimize --no-dev

# Setup directory permissions for Laravel
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

# Copy Entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose PHP-FPM default port (9000)
EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
