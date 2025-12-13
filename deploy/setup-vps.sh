#!/bin/bash
# ==============================================
# PROJECT AEGIS - VPS INITIAL SETUP SCRIPT
# Run this ONCE on a fresh VPS
# VPS: 152.42.185.253
# ==============================================

set -e

echo "🛡️ Project Aegis - VPS Setup"
echo "=============================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js
node -v
npm -v

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Create directories
echo "📁 Creating directories..."
mkdir -p /var/www/aegis/{field-app,dashboard,backend}
mkdir -p /var/log/aegis

# Set permissions
chown -R www-data:www-data /var/www/aegis
chmod -R 755 /var/www/aegis

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow 22
ufw allow 3001
ufw --force enable

# Enable Nginx
systemctl enable nginx
systemctl start nginx

# Configure PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ VPS Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Copy Nginx config: cp nginx.conf /etc/nginx/sites-available/aegis"
echo "2. Enable site: ln -s /etc/nginx/sites-available/aegis /etc/nginx/sites-enabled/"
echo "3. Remove default: rm /etc/nginx/sites-enabled/default"
echo "4. Test Nginx: nginx -t"
echo "5. Reload Nginx: systemctl reload nginx"
echo "6. Run deploy.sh to deploy the application"
echo ""
