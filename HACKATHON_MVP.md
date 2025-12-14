# PROJECT AEGIS - Offline-First Disaster Response System

**24-Hour Hackathon MVP** | Built for Ratnapura District Disaster Scenario

---

## 🎯 Core Problem
> "Disaster hits an area with unreliable network coverage. Field responders need to report incidents (landslides, floods, road blocks, power lines down) even without internet. Data must be stored locally and automatically sync when connectivity returns. Zero data loss is non-negotiable."

---

## ✅ MVP Features

### 📱 Field Responder App (PWA)
1. **Offline-First Data Collection**
   - Works completely in Airplane Mode
   - Stores all data in IndexedDB (using Dexie.js)
   - Required fields: Incident Type, Severity (1-5), GPS, Timestamp, Photo (optional)

2. **Auto-Sync Engine**
   - Detects when network returns automatically
   - Uploads all local reports without user intervention
   - Shows sync status indicator

3. **Persistent Offline Authentication**
   - Login once while online at HQ
   - Stay logged in even when offline
   - Reopen app hours later - still authenticated

### 🖥️ Command Dashboard (Web)
1. **Live Map** - Leaflet + OpenStreetMap (free, no API key!)
2. **Real-Time List** - Auto-updates as data syncs via Socket.IO

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

### 2. Start Field App (PWA)
```bash
cd field-app
npm install
npm run dev
# App runs on http://localhost:5173
```

### 3. Start Dashboard
```bash
cd dashboard
npm install
npm run dev
# Dashboard runs on http://localhost:5174
```

---

## 👤 Demo Credentials

**Field Responders:**
- `responder1` / `responder123`
- `responder2` / `responder123`
- `responder3` / `responder123`

**Command Dashboard:**
- `admin` / `admin123`

---

## 📋 Incident Types (4 Required)
| Type | Icon | Description |
|------|------|-------------|
| Landslide | ⛰️ | Earth/rock movements blocking paths |
| Flood | 🌊 | Water overflow in areas |
| Road Block | 🚧 | Roads obstructed by debris |
| Power Line Down | ⚡ | Electrical hazards |

## 📊 Severity Scale
| Level | Label | Color | Description |
|-------|-------|-------|-------------|
| 1 | Critical | 🔴 | Immediate rescue needed |
| 2 | High | 🟠 | Urgent attention |
| 3 | Medium | 🟡 | Important but stable |
| 4 | Low | 🟢 | Minor issue |
| 5 | Minimal | ⚪ | Information only |

---

## 🧪 How to Demo Offline Functionality

1. **Login Online** at HQ (wifi connected)
2. **Enable Airplane Mode** on device
3. **Create several reports** - all saved locally
4. **Turn off Airplane Mode**
5. **Watch auto-sync** - reports upload automatically!
6. **Verify on Dashboard** - incidents appear in real-time

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Field App | React + Vite + TailwindCSS |
| Offline Storage | Dexie.js (IndexedDB wrapper) |
| State Management | Zustand (with persist middleware) |
| Maps | Leaflet + OpenStreetMap |
| Backend | Node.js + Express |
| Database | LowDB (JSON file) |
| Real-time | Socket.IO |
| Auth | JWT tokens |

---

## 📁 Project Structure
```
project-aegis/
├── field-app/          # PWA for field responders
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── db/         # Dexie.js database
│   │   ├── hooks/      # Custom hooks (GPS, network)
│   │   ├── pages/      # App pages
│   │   ├── services/   # API + Sync Engine
│   │   └── stores/     # Zustand stores
├── dashboard/          # Command center web app
│   ├── src/
│   │   ├── components/ # Map, List components
│   │   └── pages/      # Dashboard pages
├── backend/            # API server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── middleware/ # Auth middleware
│   │   └── db/         # LowDB setup
└── HACKATHON_MVP.md
```

---

## 🔑 Key Code Files

### Sync Engine
**[field-app/src/services/syncEngine.js](field-app/src/services/syncEngine.js)**
- Auto-detects connectivity changes
- Uploads pending reports on network restore
- No user intervention needed

### Offline Database
**[field-app/src/db/database.js](field-app/src/db/database.js)**
- Dexie.js IndexedDB wrapper
- Stores reports, auth, sync queue
- `getUnsyncedReports()` & `markReportSynced()`

### Persistent Auth
**[field-app/src/stores/authStore.js](field-app/src/stores/authStore.js)**
- Zustand store with persist middleware
- Stores token in localStorage
- `autoLogin()` restores session offline

### Live Map
**[dashboard/src/components/IncidentMap.jsx](dashboard/src/components/IncidentMap.jsx)**
- Leaflet + OpenStreetMap tiles
- Real-time incident markers
- Popup with incident details

---

## ⚠️ Out of Scope (24h Hackathon)
- ❌ Emergency SOS features
- ❌ Relief camp management
- ❌ Rescue missions tracking
- ❌ Multi-language support
- ❌ Complex offline maps
- ❌ Payment gateways

---

**Built for:** APIIT Hackathon  
**Team:** Project Aegis  
**Focus:** Offline-First, Zero Data Loss
