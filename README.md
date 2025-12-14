# 🛡️ Project Aegis v2.0

## Real-Time Disaster Response & Emergency Coordination System

A comprehensive disaster response platform designed for Sri Lanka's emergency management. Features real-time emergency SOS with GPS tracking, offline-first architecture, multi-language support, and a command center dashboard for coordination.

---

## 🌐 Production Access

| Service | URL |
|---------|-----|
| **📱 Field App** | http://152.42.185.253/app |
| **🖥️ Dashboard** | http://152.42.185.253/dashboard |
| **🔧 API** | http://152.42.185.253/api |

---

## 🚀 Key Features

### 📱 Field App (PWA)
- **5-Second Emergency SOS** - Hold to activate, sends GPS immediately
- **Continuous Location Tracking** - Real-time updates when emergency active
- **Offline-First** - Works without internet, syncs when connected
- **Multi-Language** - English, Sinhala (සිංහල), Tamil (தமிழ்)
- **Disaster Reporting** - Photos, severity, special needs assessment
- **Safety Advisories** - Context-aware guidance per disaster type
- **Medical ID** - Share blood type, allergies for first responders

### 🖥️ Command Dashboard  
- **Live Emergency Map** - Real-time locations with disaster markers
- **Relief Camp Management** - Track capacity, resources, evacuees
- **Rescue Mission Coordination** - Team dispatch and status tracking
- **Intelligent Alerts** - Auto-generate advisories from reports
- **Device Registry** - Monitor all registered field devices

### 🔧 Technical Architecture
- **UUID Device Authentication** - Persistent device identity
- **JWT Token System** - Secure API access
- **Socket.io Real-Time** - Live updates across dashboards
- **IndexedDB Storage** - Reports stored locally until synced
- **PWA** - Install on home screen, works offline

---

## 📱 Quick Start - Field Users

1. Open **http://152.42.185.253/app** on your phone
2. Tap **"Add to Home Screen"** for offline access
3. Choose **"Quick Access"** to register instantly
4. Or login: `responder1` / `responder123`

---

## 🖥️ Quick Start - Administrators

1. Open **http://152.42.185.253/dashboard**
2. Login: `admin` / `admin123`
3. Monitor emergencies and coordinate relief operations

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm 9+

### Install & Run Locally

```bash
# Clone repository
git clone <repo-url>
cd project-aegis

# Backend API
cd backend
npm install
npm run dev
# → http://localhost:3001

# Field App (new terminal)
cd field-app
npm install
npm run dev
# → http://localhost:5173

# Dashboard (new terminal)  
cd dashboard
npm install
npm run dev
# → http://localhost:5174
```

---

## 🚀 VPS Deployment

### Windows PowerShell
```powershell
cd deploy
.\deploy.ps1
```

### Linux/Mac
```bash
cd deploy
chmod +x deploy.sh
./deploy.sh
```

See [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) for detailed instructions.

---

## 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Responder | responder1 | responder123 |
| Responder | responder2 | responder123 |
| Admin | admin | admin123 |

---

## 📁 Project Structure

```
project-aegis/
├── field-app/          # React PWA for field responders
│   ├── src/
│   │   ├── components/ # EmergencyButton, SafetyAdvisory, etc.
│   │   ├── pages/      # HomePage, ReportPage, LoginPage
│   │   ├── stores/     # Zustand state (auth, emergency, settings)
│   │   ├── hooks/      # useGeolocation, useNetworkStatus
│   │   ├── locales/    # en.json, si.json, ta.json
│   │   └── db/         # Dexie.js IndexedDB
│   └── public/
│
├── dashboard/          # React admin dashboard
│   ├── src/
│   │   ├── components/ # ReliefCampManager, RescueMissionManager
│   │   └── pages/      # DashboardPage, MapView
│
├── backend/            # Node.js Express API
│   ├── src/
│   │   ├── routes/     # auth, emergencies, reports, relief-camps
│   │   ├── middleware/ # JWT auth, validation
│   │   └── db/         # LowDB JSON database
│
└── deploy/             # Deployment configs
    ├── nginx.conf
    ├── ecosystem.config.cjs
    ├── deploy.ps1
    └── deploy.sh
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register-device` - Register device (UUID)
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/validate` - Validate JWT token

### Emergency
- `POST /api/emergency` - Send emergency SOS
- `GET /api/emergencies` - Get all emergencies

### Reports
- `POST /api/reports` - Submit disaster report
- `GET /api/reports` - Get all reports

### Relief Operations
- `GET/POST /api/relief-camps` - Relief camp management
- `GET/POST /api/rescue-missions` - Rescue mission coordination
- `GET/POST /api/alerts` - Alert management

---

## 🌍 Supported Languages

| Code | Language |
|------|----------|
| en | English |
| si | Sinhala (සිංහල) |
| ta | Tamil (தமிழ்) |

---

## 🔧 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, DaisyUI, Zustand
- **i18n**: react-i18next
- **Offline**: Dexie.js (IndexedDB), vite-plugin-pwa
- **Backend**: Node.js, Express, LowDB, Socket.io
- **Auth**: UUID v4, JWT
- **Deploy**: Nginx, PM2, Ubuntu VPS

---

## 📄 License

MIT License - Built for APIIT Sri Lanka

---

<p align="center">
  <strong>🛡️ Project Aegis - Protecting Lives Through Technology</strong>
</p>
