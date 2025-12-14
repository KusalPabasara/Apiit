# ==============================================
# PROJECT AEGIS - WINDOWS DEPLOYMENT SCRIPT
# Run from PowerShell to deploy to VPS
# ==============================================

param(
    [string]$VpsIp = "152.42.185.253",
    [string]$VpsUser = "root",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🛡️ Project Aegis - Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "VPS: $VpsIp"

# Get project root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "Project: $ProjectRoot"
Write-Host ""

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH not found. Please install OpenSSH client." -ForegroundColor Red
    exit 1
}

# Build applications
if (-not $SkipBuild) {
    # Build Field App
    Write-Host "🔨 Building Field App..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\field-app"
    npm install
    npm run build
    
    # Build Dashboard
    Write-Host "🔨 Building Dashboard..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\dashboard"
    npm install
    npm run build
}

# Upload files using SCP
Write-Host ""
Write-Host "📤 Uploading to VPS..." -ForegroundColor Yellow

# Field App
Write-Host "  → Uploading Field App..."
scp -r "$ProjectRoot\field-app\dist\*" "${VpsUser}@${VpsIp}:/var/www/aegis/field-app/"

# Dashboard
Write-Host "  → Uploading Dashboard..."
scp -r "$ProjectRoot\dashboard\dist\*" "${VpsUser}@${VpsIp}:/var/www/aegis/dashboard/"

# Backend (excluding node_modules)
Write-Host "  → Uploading Backend..."
$BackendFiles = @("src", "package.json", "package-lock.json")
foreach ($file in $BackendFiles) {
    scp -r "$ProjectRoot\backend\$file" "${VpsUser}@${VpsIp}:/var/www/aegis/backend/"
}

# Production env
Write-Host "  → Uploading environment config..."
scp "$ProjectRoot\backend\.env.production" "${VpsUser}@${VpsIp}:/var/www/aegis/backend/.env"

# PM2 config
Write-Host "  → Uploading PM2 config..."
scp "$ProjectRoot\deploy\ecosystem.config.cjs" "${VpsUser}@${VpsIp}:/var/www/aegis/"

# Remote setup
Write-Host ""
Write-Host "🔧 Setting up on VPS..." -ForegroundColor Yellow

$RemoteScript = @'
cd /var/www/aegis/backend
npm install --production
mkdir -p data
chown -R www-data:www-data /var/www/aegis
chmod -R 755 /var/www/aegis
cd /var/www/aegis
pm2 delete aegis-api 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
nginx -t && systemctl reload nginx
pm2 status
'@

ssh "${VpsUser}@${VpsIp}" $RemoteScript

Write-Host ""
Write-Host "🎉 Deployment Successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Field App:  http://$VpsIp/app"
Write-Host "  Dashboard:  http://$VpsIp/dashboard"
Write-Host "  API:        http://$VpsIp/api"
Write-Host ""

# Return to project root
Set-Location $ProjectRoot
