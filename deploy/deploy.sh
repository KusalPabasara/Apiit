#!/bin/bash
# ==============================================
# PROJECT AEGIS - DEPLOYMENT SCRIPT
# Run from local machine to deploy to VPS
# ==============================================

set -e

# Configuration
VPS_IP="152.42.185.253"
VPS_USER="root"
REMOTE_PATH="/var/www/aegis"
LOCAL_PROJECT_PATH="$(dirname "$(dirname "$(readlink -f "$0")")")"

echo "🛡️ Project Aegis - Deployment"
echo "=============================="
echo "VPS: $VPS_IP"
echo "Local: $LOCAL_PROJECT_PATH"
echo ""

# Build Field App
echo "🔨 Building Field App..."
cd "$LOCAL_PROJECT_PATH/field-app"
npm install
npm run build

# Build Dashboard
echo "🔨 Building Dashboard..."
cd "$LOCAL_PROJECT_PATH/dashboard"
npm install
npm run build

# Prepare Backend
echo "📦 Preparing Backend..."
cd "$LOCAL_PROJECT_PATH/backend"
npm install --production

echo ""
echo "📤 Uploading to VPS..."

# Upload Field App
echo "  → Uploading Field App..."
scp -r "$LOCAL_PROJECT_PATH/field-app/dist/"* "$VPS_USER@$VPS_IP:$REMOTE_PATH/field-app/"

# Upload Dashboard
echo "  → Uploading Dashboard..."
scp -r "$LOCAL_PROJECT_PATH/dashboard/dist/"* "$VPS_USER@$VPS_IP:$REMOTE_PATH/dashboard/"

# Upload Backend (excluding node_modules, upload separately)
echo "  → Uploading Backend..."
rsync -avz --exclude 'node_modules' --exclude '.env' \
    "$LOCAL_PROJECT_PATH/backend/" "$VPS_USER@$VPS_IP:$REMOTE_PATH/backend/"

# Upload production env file
echo "  → Uploading environment config..."
scp "$LOCAL_PROJECT_PATH/backend/.env.production" "$VPS_USER@$VPS_IP:$REMOTE_PATH/backend/.env"

# Upload PM2 ecosystem config
echo "  → Uploading PM2 config..."
scp "$LOCAL_PROJECT_PATH/deploy/ecosystem.config.cjs" "$VPS_USER@$VPS_IP:$REMOTE_PATH/"

# Remote setup
echo ""
echo "🔧 Setting up on VPS..."
ssh "$VPS_USER@$VPS_IP" << 'REMOTE_SCRIPT'
    cd /var/www/aegis/backend
    
    # Install dependencies
    echo "Installing backend dependencies..."
    npm install --production
    
    # Initialize data directory
    mkdir -p data
    
    # Set permissions
    chown -R www-data:www-data /var/www/aegis
    chmod -R 755 /var/www/aegis
    
    # Restart API with PM2
    cd /var/www/aegis
    pm2 delete aegis-api 2>/dev/null || true
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    
    # Reload Nginx
    nginx -t && systemctl reload nginx
    
    echo ""
    echo "✅ Deployment complete!"
    pm2 status
REMOTE_SCRIPT

echo ""
echo "🎉 Deployment Successful!"
echo ""
echo "Access URLs:"
echo "  Field App:  http://$VPS_IP/app"
echo "  Dashboard:  http://$VPS_IP/dashboard"
echo "  API:        http://$VPS_IP/api"
echo ""
