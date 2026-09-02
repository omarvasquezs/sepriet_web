#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Sepriet en Producción..."

# 1. Verificar .env.production
if [ ! -f ".env.production" ]; then
    echo "⚠️  No se encontró .env.production. Creando a partir de .env.production.example..."
    cp .env.production.example .env.production
    echo "Por favor edita .env.production con tus credenciales seguras antes de continuar."
    exit 1
fi

# 2. Compilar Frontend
echo "📦 Compilando Frontend React / Vite..."
cd frontend
npm ci
npm run build
cd ..

# 3. Levantar contenedores Docker
echo "🐳 Levantando contenedores Docker..."
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 4. Copiar .env y Generar APP_KEY si está vacía
echo "🔑 Verificando archivo .env y APP_KEY de Laravel..."
docker compose --env-file .env.production -f docker-compose.prod.yml cp .env.production backend:/var/www/html/.env
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan key:generate --force
# Copiar de vuelta para guardar la APP_KEY generada en el host
docker compose --env-file .env.production -f docker-compose.prod.yml cp backend:/var/www/html/.env .env.production

# 5. Ejecutar migraciones y seeders
echo "🗄️  Ejecutando migraciones de base de datos..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan db:seed --force

# 6. Optimizar caché de Laravel
echo "⚡ Optimizando caché de producción..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan config:cache
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan route:cache
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan view:cache

echo "✅ ¡Despliegue completado con éxito! Sepriet está activo en el puerto 80."
