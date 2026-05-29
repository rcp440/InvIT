#!/bin/bash
# =============================================================================
# setup-debian.sh — Instala y configura InventarioIT SaaS en Debian
# Ejecutar como root o con sudo: bash setup-debian.sh
# =============================================================================
set -euo pipefail

APP_DIR="/opt/inventarioit"
APP_USER="inventarioit"
NODE_VERSION="20"

echo "=== [1/7] Actualizando sistema ==="
apt-get update -qq && apt-get upgrade -y -qq

echo "=== [2/7] Instalando dependencias del sistema ==="
apt-get install -y -qq curl git nginx

echo "=== [3/7] Instalando Node.js $NODE_VERSION (via NodeSource) ==="
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

echo "=== [4/7] Instalando PM2 globalmente ==="
npm install -g pm2
pm2 --version

echo "=== [5/7] Creando usuario de sistema '$APP_USER' ==="
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -m -d "$APP_DIR" -s /bin/bash "$APP_USER"
    echo "  Usuario $APP_USER creado."
else
    echo "  Usuario $APP_USER ya existe."
fi

echo "=== [6/7] Preparando directorio de la aplicación ==="
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "=== [7/7] Configurando Nginx ==="
cp "$(dirname "$0")/../nginx/inventarioit.conf" /etc/nginx/sites-available/inventarioit

# Deshabilitar default si existe
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/inventarioit /etc/nginx/sites-enabled/

nginx -t && systemctl enable nginx && systemctl restart nginx
echo "  Nginx configurado."

echo ""
echo "============================================================"
echo " Setup base completado."
echo " Próximos pasos manuales:"
echo ""
echo " 1. Como usuario $APP_USER, clonar/copiar el código:"
echo "    su - $APP_USER"
echo "    git clone <tu-repo> $APP_DIR  (o copiar archivos)"
echo ""
echo " 2. Crear el archivo de entorno:"
echo "    cp $APP_DIR/.env.example $APP_DIR/.env.production"
echo "    nano $APP_DIR/.env.production   # completar valores reales"
echo ""
echo " 3. Instalar dependencias:"
echo "    cd $APP_DIR && npm ci --omit=dev"
echo ""
echo " 4. Crear la base de datos y usuario PostgreSQL:"
echo "    Ver sección PostgreSQL en DEPLOY.md"
echo ""
echo " 5. Ejecutar migraciones y seed:"
echo "    NODE_ENV=production node database/migrate.js"
echo "    NODE_ENV=production node database/seed.js"
echo ""
echo " 6. Iniciar la app:"
echo "    pm2 start ecosystem.config.js --env production"
echo "    pm2 save"
echo "    pm2 startup  # seguir instrucciones que muestra"
echo "============================================================"
