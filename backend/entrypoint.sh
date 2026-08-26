#!/usr/bin/env bash
set -e

# Check if vendor dependencies are present (handles cases where host volume is mounted over /var/www/html)
if [ ! -f "/var/www/html/vendor/autoload.php" ]; then
    echo "📦 vendor/autoload.php not found. Installing composer dependencies..."
    composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
fi

# Ensure writable permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache} /var/www/html/storage/logs /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "⚡ APP_KEY is empty, generating one..."
    php artisan key:generate --force || true
fi

# Ensure storage link exists
php artisan storage:link --force 2>/dev/null || true

# If running the main API / web service, optionally perform migrations and optimize
if [ "$1" = "php-fpm" ] || [ "$1" = "php" ]; then
    echo "🚀 Running Laravel optimizations..."
    if [ "$APP_ENV" = "production" ]; then
        php artisan config:cache || true
        php artisan route:cache || true
        php artisan view:cache || true
        php artisan event:cache || true
    fi

    if [ "$RUN_MIGRATIONS" = "true" ]; then
        echo "🗄️ Running database migrations..."
        php artisan migrate --force || true
        echo "🌱 Seeding default accounts (if not already seeded)..."
        php artisan db:seed --force || true
    fi
fi

exec "$@"
