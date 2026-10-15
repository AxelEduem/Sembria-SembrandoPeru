FROM php:8.3-fpm

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        mbstring \
        bcmath \
        intl \
        opcache \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiamos primero los archivos necesarios para Composer
COPY composer.json composer.lock artisan ./

# Copiamos los directorios necesarios para que
# los scripts de Composer de Laravel puedan ejecutarse
COPY bootstrap ./bootstrap
COPY app ./app
COPY config ./config
COPY routes ./routes

# Instalamos dependencias PHP de producción
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# Ahora copiamos el resto del proyecto
COPY . .

# Permisos de Laravel
RUN chown -R www-data:www-data \
    storage \
    bootstrap/cache

RUN chmod -R ug+rwx \
    storage \
    bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]