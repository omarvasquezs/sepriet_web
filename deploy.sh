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

# 2. Generar APP_KEY en .env.production si no existe
if ! grep -q "^APP_KEY=base64:" .env.production; then
    echo "🔑 Generando APP_KEY segura para Laravel en .env.production..."
    RAND_KEY="base64:$(openssl rand -base64 32)"
    sed -i "s|^APP_KEY=.*|APP_KEY=${RAND_KEY}|" .env.production
fi

# 3. Compilar Frontend
echo "📦 Compilando Frontend React / Vite..."
cd frontend
npm ci
npm run build
cd ..

# 4. Levantar contenedores Docker
echo "🐳 Levantando contenedores Docker..."
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 5. Ejecutar migraciones y seeders
echo "🗄️  Ejecutando migraciones de base de datos..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan db:seed --force

# 6. Optimizar caché de Laravel
echo "⚡ Optimizando caché de producción..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan config:cache
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan route:cache
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan view:cache

echo "✅ ¡Despliegue completado con éxito! Sepriet está activo en producción."
