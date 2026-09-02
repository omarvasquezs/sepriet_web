#!/bin/bash
set -e

EMAIL=$1

if [ -z "$EMAIL" ]; then
    echo "Uso: ./setup-ssl.sh tu-correo@ejemplo.com"
    exit 1
fi

echo "🔒 Iniciando configuración de SSL / HTTPS con Let's Encrypt para app.sepriet.com y sepriet.com..."

# 1. Instalar certbot si no está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# 2. Detener temporalmente el contenedor web para liberar el puerto 80
echo "⏸️  Deteniendo contenedor Nginx temporalmente..."
docker compose -f docker-compose.prod.yml stop web

# 3. Solicitar el certificado con Certbot standalone
echo "📜 Solicitando certificado SSL gratuito..."
sudo certbot certonly --standalone \
    -d app.sepriet.com \
    -d sepriet.com \
    --agree-tos \
    --email "$EMAIL" \
    --non-interactive

# 4. Activar configuración SSL en Nginx
echo "⚙️  Activando configuración SSL en Nginx..."
cp docker/nginx/ssl.conf docker/nginx/default.conf

# 5. Actualizar APP_URL a https:// en .env.production
if [ -f ".env.production" ]; then
    sed -i 's|APP_URL=http://|APP_URL=https://|g' .env.production
fi

# 6. Levantar Nginx con SSL
echo "🚀 Levantando Nginx con HTTPS..."
docker compose -f docker-compose.prod.yml up -d web

# 7. Actualizar caché de Laravel
echo "⚡ Actualizando caché de Laravel..."
docker compose -f docker-compose.prod.yml exec backend php artisan config:cache

# 8. Configurar auto-renovación
RENEW_HOOK='docker compose -f '"$(pwd)"'/docker-compose.prod.yml exec web nginx -s reload'
sudo certbot renew --dry-run || true

echo "✅ ¡Certificado SSL activado con éxito! Tu aplicación está protegida en https://app.sepriet.com"
