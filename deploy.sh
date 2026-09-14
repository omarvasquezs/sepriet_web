#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Sepriet (Producción & Staging)..."

# 1. Verificar .env.production
if [ ! -f ".env.production" ]; then
    echo "⚠️  No se encontró .env.production. Creando a partir de .env.production.example..."
    cp .env.production.example .env.production
    echo "Por favor edita .env.production con tus credenciales seguras antes de continuar."
    exit 1
fi

# 2. Generar APP_KEY en .env.production si no existe
if ! grep -q "^APP_KEY=base64:" .env.production; then
    echo "🔑 Generando APP_KEY segura para Laravel en .env.production..."
    RAND_KEY="base64:$(openssl rand -base64 32)"
    sed -i "s|^APP_KEY=.*|APP_KEY=${RAND_KEY}|" .env.production
fi

# 3. Verificar .env.staging
if [ ! -f ".env.staging" ] && [ -f ".env.staging.example" ]; then
    echo "⚙️  Creando .env.staging a partir de .env.staging.example..."
    cp .env.staging.example .env.staging
fi

if [ -f ".env.staging" ] && ! grep -q "^APP_KEY=base64:" .env.staging; then
    echo "🔑 Generando APP_KEY segura para Laravel en .env.staging..."
    RAND_KEY_STAGE="base64:$(openssl rand -base64 32)"
    sed -i "s|^APP_KEY=.*|APP_KEY=${RAND_KEY_STAGE}|" .env.staging
fi

# 4. Compilar Frontend
echo "📦 Compilando Frontend React / Vite..."
cd frontend
npm ci
npm run build
cd ..

# Activar configuración HTTPS en Nginx
if [ -f "docker/nginx/ssl.conf" ]; then
    echo "🔒 Activando configuración HTTPS / SSL en Nginx..."
    cp docker/nginx/ssl.conf docker/nginx/default.conf
fi

# 5. Levantar contenedores Docker
echo "🐳 Levantando contenedores Docker..."
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 6. Ejecutar migraciones y seeders en Producción
echo "🗄️  Ejecutando migraciones de base de datos en Producción..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan db:seed --force

# 7. Optimizar caché de Producción
echo "⚡ Optimizando caché de Producción..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan config:cache
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan route:cache
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan view:cache

# 8. Si existe staging, ejecutar migraciones y optimizar caché
if docker compose --env-file .env.production -f docker-compose.prod.yml ps | grep -q "sepriet_backend_stage"; then
    echo "🗄️  Ejecutando migraciones en Staging..."
    docker compose --env-file .env.production -f docker-compose.prod.yml exec backend_stage php artisan migrate --force || true
    echo "⚡ Optimizando caché de Staging..."
    docker compose --env-file .env.production -f docker-compose.prod.yml exec backend_stage php artisan config:cache
    docker compose --env-file .env.production -f docker-compose.prod.yml exec backend_stage php artisan route:cache
    docker compose --env-file .env.production -f docker-compose.prod.yml exec backend_stage php artisan view:cache
fi

echo "✅ ¡Despliegue completado con éxito!"
echo "👉 Producción: https://app.sepriet.com"
echo "👉 Staging: https://stage.sepriet.com"
