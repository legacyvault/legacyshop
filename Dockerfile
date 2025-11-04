# ---------- 1) PHP deps (Composer) ----------
    FROM composer:2 AS vendor
    WORKDIR /app
    
    # Copy only what Composer needs for good cache
    COPY composer.json composer.lock ./
    RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-scripts
    
    # ---------- 2) Frontend build (has vendor copied in) ----------
    FROM node:20-alpine AS nodebuild
    WORKDIR /app
    
    # Copy only what's needed for Node install & build
    COPY package*.json ./
    COPY vite.config.* ./
    COPY resources ./resources
    COPY public ./public
    
    # Make PHP vendor available for Vite (for your ziggy alias)
    COPY --from=vendor /app/vendor ./vendor
    
    RUN npm ci
    RUN npm run build && npm run build:ssr
    
    # ---------- 3) Runtime: Nginx + PHP-FPM + Node (for Inertia SSR) ----------
    FROM webdevops/php-nginx:8.2-alpine
    
    ENV WEB_DOCUMENT_ROOT=/app/public
    WORKDIR /app
    
    # Node is required at runtime for Inertia SSR (executes bootstrap/ssr/ssr.mjs)
    RUN apk add --no-cache nodejs npm bash
    
    # Copy full app (for php files, routes, etc.)
    COPY . .
    
    # Use Composer deps from vendor stage
    COPY --from=vendor /app/vendor ./vendor
    
    # Use built assets + SSR from nodebuild stage
    COPY --from=nodebuild /app/public/build ./public/build
    COPY --from=nodebuild /app/bootstrap/ssr ./bootstrap/ssr
    
    # Writable dirs
    RUN mkdir -p storage bootstrap/cache \
     && chown -R root:root storage bootstrap/cache \
     && chmod -R ug+rwX storage bootstrap/cache
    
    EXPOSE 8080
    
    # Cache config/routes/views at container start (after env vars are present)
    CMD php artisan migrate --force && \
        php artisan config:cache && \
        php artisan route:cache && \
        php artisan view:cache && \
        /usr/bin/supervisord -c /opt/docker/etc/supervisor.d/supervisord.conf
    