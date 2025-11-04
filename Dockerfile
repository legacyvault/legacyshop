# ---------- 1) Build frontend (client + SSR) ----------
    FROM node:20-alpine AS nodebuild
    WORKDIR /app
    
    COPY package*.json ./
    COPY vite.config.* ./
    COPY resources ./resources
    COPY public ./public
    
    RUN npm ci
    RUN npm run build && npm run build:ssr
    
    # ---------- 2) Install PHP deps ----------
    FROM composer:2 AS vendor
    WORKDIR /app
    
    COPY composer.json composer.lock ./
    RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-scripts
    
    # ---------- 3) Runtime: Nginx + PHP-FPM + Node (for Inertia SSR) ----------
    FROM webdevops/php-nginx:8.2-alpine
    
    ENV WEB_DOCUMENT_ROOT=/app/public
    WORKDIR /app
    
    RUN apk add --no-cache nodejs npm bash
    
    COPY . .
    COPY --from=vendor /app/vendor ./vendor
    COPY --from=nodebuild /app/public/build ./public/build
    COPY --from=nodebuild /app/bootstrap/ssr ./bootstrap/ssr
    
    RUN mkdir -p storage bootstrap/cache \
     && chown -R root:root storage bootstrap/cache \
     && chmod -R ug+rwX storage bootstrap/cache
    
    EXPOSE 8080
    
    # Laravel will cache config/routes/views at startup
    CMD php artisan migrate --force && \
        php artisan config:cache && \
        php artisan route:cache && \
        php artisan view:cache && \
        /usr/bin/supervisord -c /opt/docker/etc/supervisor.d/supervisord.conf
    