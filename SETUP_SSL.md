# 🔐 Complete SSL Setup for Project Aegis PWA

## The Problem
Service Workers (required for offline PWA) only work with:
- `localhost`
- **Valid HTTPS certificate** (NOT self-signed)

Your VPS uses a self-signed certificate, which browsers reject for Service Workers.

## The Solution: Free Domain + Let's Encrypt

### Step 1: Get a Free Domain (Choose ONE)

#### Option A: Freenom (Free .tk, .ml, .ga, .cf, .gq)
1. Go to https://www.freenom.com
2. Search for a domain (e.g., "aegis-disaster")
3. Select a free TLD (.tk, .ml, etc.)
4. Register (free for 1 year)

#### Option B: No-IP (Free Dynamic DNS)
1. Go to https://www.noip.com
2. Create account
3. Get a free subdomain (e.g., aegis.ddns.net)

#### Option C: Use Your Own Domain
If you already have a domain, use that.

### Step 2: Point Domain to VPS

In your DNS settings, add an A record:
```
Type: A
Host: @ (or "aegis" for subdomain)
Value: 152.42.185.253
TTL: 300 (or Auto)
```

Wait 2-5 minutes for DNS to propagate.

### Step 3: Update Nginx Configuration

SSH to the VPS and update nginx to use your domain:

```bash
ssh root@152.42.185.253

# Edit nginx config
nano /etc/nginx/sites-available/aegis
```

Find the `server_name` line and change it:
```nginx
server_name your-domain.tk;  # Replace with your actual domain
```

Test and reload nginx:
```bash
nginx -t
systemctl reload nginx
```

### Step 4: Get Let's Encrypt Certificate

```bash
# Get the certificate (replace with your domain)
certbot --nginx -d your-domain.tk

# Follow the prompts:
# - Enter email for urgent notices
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 5: Verify SSL

Visit: `https://your-domain.tk/app/`

You should see:
- ✅ Green padlock in browser
- ✅ No certificate warning
- ✅ Console shows: "Service Worker registered successfully!"

### Step 6: Test Offline Mode

1. Open the app: `https://your-domain.tk/app/`
2. Login and create some reports
3. Check console for: "✅ App ready to work offline!"
4. Enable airplane mode ✈️
5. Refresh the page
6. ✅ App should load from cache!
7. ✅ You can create reports offline
8. ✅ Reports sync when back online

## Quick Commands Reference

```bash
# SSH to VPS
ssh root@152.42.185.253

# Get SSL certificate
certbot --nginx -d YOUR_DOMAIN

# Renew certificate (automatic, but can do manually)
certbot renew

# Check certificate status
certbot certificates

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx
```

## Troubleshooting

### "Domain not pointing to server"
- Wait 5-10 minutes for DNS propagation
- Test with: `ping your-domain.tk`
- Should return 152.42.185.253

### "Certificate verification failed"
- Make sure port 80 is open
- Make sure domain points to VPS
- Try: `certbot --nginx -d your-domain.tk --dry-run`

### "Service Worker still not working"
- Clear browser cache completely
- Open in incognito mode
- Check console for SW registration message

## Alternative: Use ngrok (Quick Demo)

If you can't get a domain, use ngrok for a quick demo:

```bash
# On the VPS
apt install snapd
snap install ngrok

# Login to ngrok (free account)
ngrok authtoken YOUR_NGROK_TOKEN

# Start tunnel
ngrok http 80
```

This gives you a temporary HTTPS URL like `https://abc123.ngrok.io`

## Summary

| Solution | Time | Permanent? | Works Offline? |
|----------|------|------------|----------------|
| Self-signed cert | N/A | Yes | ❌ NO |
| Free domain + Let's Encrypt | 10 min | Yes (renew every 90 days) | ✅ YES |
| ngrok | 5 min | No (temp URL) | ✅ YES |
| localhost | 2 min | No | ✅ YES |

**For hackathon demo**: Free domain + Let's Encrypt is the BEST solution!

