# Project Aegis v2.0 - Production Deployment Plan

## 🎯 Overview
Deploy Project Aegis disaster response system to VPS (152.42.185.253) for real-world usage.

---

## 📱 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VPS: 152.42.185.253                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Nginx     │    │   Node.js   │    │   LowDB     │         │
│  │   (Proxy)   │───▶│   Backend   │───▶│   (JSON DB) │         │
│  │   :80/:443  │    │   :3001     │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                  │                                    │
│         │           Socket.io (Real-time)                       │
│         │                  │                                    │
│  ┌──────┴──────┐    ┌──────┴──────┐                            │
│  │ Field App   │    │  Dashboard  │                            │
│  │ (Static)    │    │  (Static)   │                            │
│  │ /app        │    │ /dashboard  │                            │
│  └─────────────┘    └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication System

### Device-Based UUID + JWT Hybrid

1. **First Launch (Field App)**:
   - Generate UUID v4 on device
   - Store in localStorage (persistent)
   - Register device with backend
   - Receive JWT token

2. **Subsequent Launches**:
   - Retrieve stored UUID
   - Auto-login with device ID
   - Refresh JWT if expired

3. **Admin Dashboard**:
   - Username/Password login
   - JWT with role-based access

---

## 🌐 Access URLs

| Service       | URL                                    |
|---------------|----------------------------------------|
| Field App     | http://152.42.185.253/app              |
| Dashboard     | http://152.42.185.253/dashboard        |
| API           | http://152.42.185.253/api              |
| WebSocket     | ws://152.42.185.253/socket.io          |

---

## 📋 Deployment Steps

### Phase 1: Local Preparation
- [x] Update authentication system
- [x] Redesign UI/UX for mobile
- [x] Improve i18n language switching
- [x] Build production bundles

### Phase 2: VPS Setup
- [ ] SSH into VPS
- [ ] Install Node.js, Nginx, PM2
- [ ] Clone/Upload project
- [ ] Configure environment variables
- [ ] Setup Nginx reverse proxy
- [ ] Start services with PM2

### Phase 3: Testing
- [ ] Test field app from mobile
- [ ] Test dashboard from desktop
- [ ] Verify real-time updates
- [ ] Test offline functionality

---

## 🎨 UI/UX Design Principles

### Field App (Mobile-First)
- **Font**: Inter (clean, readable)
- **Colors**: Red emergency theme with calming blues
- **Layout**: Large touch targets, minimal text
- **Navigation**: Bottom tab bar, gesture-friendly

### Dashboard (Desktop)
- **Font**: Inter + JetBrains Mono (data)
- **Layout**: Sidebar navigation, data-dense
- **Theme**: Dark mode default, professional

---

## 🌍 i18n Language Support

| Code | Language | Status |
|------|----------|--------|
| en   | English  | ✅     |
| si   | සිංහල    | ✅     |
| ta   | தமிழ்    | ✅     |

---

## 📦 Tech Stack

- **Frontend**: React 18 + Vite + DaisyUI + TailwindCSS
- **Backend**: Node.js + Express + LowDB
- **Real-time**: Socket.io
- **PWA**: Vite PWA Plugin
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx

---

## 🚀 Commands Reference

```bash
# Build Field App
cd field-app && npm run build

# Build Dashboard  
cd dashboard && npm run build

# Start Backend with PM2
pm2 start backend/src/index.js --name aegis-backend

# Nginx reload
sudo nginx -t && sudo systemctl reload nginx
```
