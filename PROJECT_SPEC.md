# Project Aegis v2.0 - Complete Disaster Response System

## 📋 Executive Summary

A comprehensive offline-first disaster response system for Sri Lanka, designed to work in the most challenging network conditions. Features an emergency SOS system, intelligent alert propagation, relief camp management, and rescue mission coordination.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT AEGIS v2.0                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐ │
│  │   FIELD APP (PWA)   │    │   COMMAND DASHBOARD │    │  RELIEF CAMP    │ │
│  │   - Emergency SOS   │    │   - KPIs & Maps     │    │  MOBILE APP     │ │
│  │   - Disaster Report │    │   - Alert System    │    │  - Camp Data    │ │
│  │   - Offline First   │    │   - Rescue Mgmt     │    │  - Supplies     │ │
│  │   - Multi-language  │    │   - Report Gen      │    │  - Evacuees     │ │
│  └──────────┬──────────┘    └──────────┬──────────┘    └────────┬────────┘ │
│             │                          │                        │          │
│             └──────────────────────────┼────────────────────────┘          │
│                                        │                                   │
│                          ┌─────────────▼─────────────┐                     │
│                          │      BACKEND API          │                     │
│                          │   - REST + WebSocket      │                     │
│                          │   - Offline Sync Queue    │                     │
│                          │   - Alert Engine          │                     │
│                          │   - Geo Intelligence      │                     │
│                          └─────────────┬─────────────┘                     │
│                                        │                                   │
│                          ┌─────────────▼─────────────┐                     │
│                          │      DATABASE             │                     │
│                          │   PostgreSQL + PostGIS    │                     │
│                          └───────────────────────────┘                     │
│                                                                             │
│  VPS: 152.42.185.253                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend (PWA & Dashboard)

| Component | Technology | Justification |
|-----------|------------|---------------|
| Framework | **React 18** | Component-based, large ecosystem, excellent PWA support |
| Build Tool | **Vite** | Fast HMR, optimized builds, PWA plugin |
| UI Library | **DaisyUI + TailwindCSS** | Beautiful components, dark mode, mobile-first |
| State Management | **Zustand** | Lightweight, works offline, persistent middleware |
| Offline Storage | **Dexie.js (IndexedDB)** | Powerful queries, reactive, handles large data |
| PWA | **vite-plugin-pwa** | Service worker generation, precaching |
| Maps | **Leaflet + React-Leaflet** | Free, offline tile caching possible |
| i18n | **i18next** | Multi-language (Sinhala, Tamil, English) |
| Data Compression | **lz-string** | Compress data before storage/transmission |
| UUID | **uuid** | Offline-safe unique IDs |

### Backend

| Component | Technology | Justification |
|-----------|------------|---------------|
| Runtime | **Node.js 20 LTS** | Fast, JavaScript ecosystem |
| Framework | **Express.js** | Mature, middleware ecosystem |
| Real-time | **Socket.IO** | WebSocket with fallback to polling |
| Database | **PostgreSQL + PostGIS** | Geospatial queries, reliable |
| ORM | **Prisma** | Type-safe, migrations, easy queries |
| Auth | **JWT + bcrypt** | Stateless, offline-compatible |
| File Storage | **Local + S3 compatible** | Photos, documents |
| Queue | **BullMQ + Redis** | Background jobs, alert processing |
| Compression | **compression middleware** | Gzip responses |

### DevOps & Deployment

| Component | Technology | Justification |
|-----------|------------|---------------|
| Server | **VPS 152.42.185.253** | Your provided server |
| Reverse Proxy | **Nginx** | SSL, static files, load balancing |
| SSL | **Let's Encrypt** | Free SSL certificates |
| Process Manager | **PM2** | Auto-restart, clustering |
| Containerization | **Docker + Docker Compose** | Easy deployment |

---

## 📱 Field App (PWA) - Detailed Specs

### 1. Emergency SOS Mode (CRITICAL PRIORITY)

```
┌────────────────────────────────────────┐
│                                        │
│         🆘 EMERGENCY BUTTON            │
│                                        │
│    ┌────────────────────────────┐      │
│    │                            │      │
│    │     HOLD FOR 5 SECONDS     │      │
│    │                            │      │
│    │    [████████░░] 80%        │      │
│    │                            │      │
│    └────────────────────────────┘      │
│                                        │
│    Progress indicator + vibration      │
│                                        │
└────────────────────────────────────────┘
```

**Behavior:**
1. User holds emergency button for 5 seconds
2. Vibration feedback during hold
3. On activation:
   - Capture GPS immediately
   - Try to send to server
   - If fails → store locally
   - Continue tracking location (battery-optimized intervals)
   - When internet available → send most recent location instantly
4. If stable connection after emergency:
   - Optionally send Medical ID (if configured)
   - Send accumulated location history

**Battery Optimization:**
- Emergency mode: Location every 30 seconds
- Moving detection: If location changes significantly → increase frequency
- Stationary: Reduce to every 2 minutes
- Use `navigator.geolocation.watchPosition` with appropriate options

### 2. Normal Disaster Reporting Mode

**Required Fields (Must work offline):**
- Disaster Type (Flood, Landslide, Road Block, Power Line, Building Collapse, Fire, Other)
- Danger Level (1-5 Critical to Minimal)
- People Count (approximate)
- GPS Location (auto-captured)
- Timestamp

**Optional Fields (Send when connection stable):**
- Photos (compressed before storage)
- Description/Notes
- Specific needs (Medical, Food, Rescue)
- Contact number

### 3. Multi-Language Support

```javascript
// Supported Languages
const languages = {
  en: 'English',
  si: 'සිංහල', // Sinhala
  ta: 'தமிழ்'  // Tamil
};
```

**Safety Advisories (Hardcoded, works offline):**

| Disaster Type | English | Sinhala | Tamil |
|---------------|---------|---------|-------|
| Flood | Move to higher ground... | ඉහළ බිමකට යන්න... | உயர்ந்த நிலத்திற்கு செல்லுங்கள்... |
| Landslide | Evacuate immediately... | වහාම ඉවත් වන්න... | உடனடியாக வெளியேறுங்கள்... |
| etc. | ... | ... | ... |

### 4. Emergency Contact Information (Always Available Offline)

- National Emergency: 119
- Disaster Management Center: 117
- Police Emergency: 118/119
- Fire & Rescue: 110
- Ambulance: 1990
- District-specific numbers (cached on first load)

### 5. UI States

```
┌─────────────────────────────────────────────────────────┐
│  NORMAL STATE                                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │  🆘 EMERGENCY (Hold 5s)                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📋 Report Disaster                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Secondary features (load if connection allows):        │
│  • My Reports                                           │
│  • Emergency Contacts                                   │
│  • Settings                                             │
│  • Relief Camp Info                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  LOW SIGNAL STATE                                       │
├─────────────────────────────────────────────────────────┤
│  ⚠️ Limited connectivity - Core features only          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🆘 EMERGENCY (Hold 5s)                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📋 Report Disaster                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Other features hidden]                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🖥️ Command Dashboard - Detailed Specs

### 1. KPI Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 DISASTER RESPONSE DASHBOARD - Ratnapura District                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   247    │ │    89    │ │   156    │ │    12    │ │     3    │  │
│  │ Reports  │ │ Rescued  │ │ Pending  │ │  Camps   │ │ Missions │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Interactive Map Features

- **Incident markers** with severity colors
- **Relief camp locations** with capacity info
- **Flood zones** (generated from reports)
- **Landslide risk areas**
- **Rescue mission routes**
- **Heatmap of incidents**
- **Real-time responder locations**

### 3. Intelligent Alert System

```
┌─────────────────────────────────────────────────────────────────────┐
│  🚨 INTELLIGENT ALERT ENGINE                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  IF: Flood reported in Kiriella (upstream)                         │
│  THEN: Auto-alert Ratnapura town (downstream) + Eheliyagoda         │
│                                                                     │
│  IF: Landslide in Kuruwita                                          │
│  THEN: Alert adjacent areas + road users on A4                      │
│                                                                     │
│  Alert Channels:                                                    │
│  • Push notifications to PWA users in affected areas                │
│  • SMS gateway integration (optional)                               │
│  • Dashboard notifications for authorities                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Relief Camp Management

**Camp Data Entry (Mobile-Optimized):**
- Camp name & location
- Capacity / Current occupancy
- Evacuee categories:
  - Children (0-12)
  - Elderly (65+)
  - Pregnant women
  - Disabled/Special needs
  - Infants with mothers
  - Regular adults
- Supply inventory:
  - Food (rice, dry rations, etc.)
  - Water
  - Medicine (with specific needs)
  - Clothing
  - Bedding
- Staff assigned:
  - Medical officers
  - Nurses
  - Army personnel
  - Volunteers
- Special requirements list

### 5. Rescue Mission Management

```
┌─────────────────────────────────────────────────────────────────────┐
│  🚁 RESCUE MISSION #RM-2024-047                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Status: IN PROGRESS                                                │
│  Priority: CRITICAL                                                 │
│                                                                     │
│  Location: Kahawatta, 6.6234°N, 80.4521°E                          │
│  Reported: 23 people trapped                                        │
│                                                                     │
│  Resources Deployed:                                                │
│  ┌────────────────────────────────────────────────────┐            │
│  │ 🚤 Boat x2 (Navy)                                  │            │
│  │ 🚁 Helicopter x1 (Air Force)                       │            │
│  │ 👥 Personnel: 12 (Army: 8, Navy: 4)               │            │
│  │ 🏥 Medical Team: 2 paramedics                      │            │
│  └────────────────────────────────────────────────────┘            │
│                                                                     │
│  Timeline:                                                          │
│  • 09:15 - Mission initiated                                        │
│  • 09:45 - Team departed base                                       │
│  • 10:30 - Arrived at location                                      │
│  • 11:00 - 8 people rescued                                         │
│  • ...                                                              │
│                                                                     │
│  [Update Status] [Add Resources] [Mark Complete]                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access |
| **District Admin** | Manage district, all reports, camps, missions |
| **Grama Niladari** | View/update local area, relief camps |
| **Army Officer** | Rescue missions, camp management |
| **Medical Officer** | Medical data, patient tracking |
| **Relief Camp Manager** | Own camp data only |
| **Field Responder** | Submit reports, view assignments |

---

## 🔌 Offline & Network Strategy

### 1. Data Sync Queue

```javascript
// Sync Queue Priority
const SYNC_PRIORITY = {
  EMERGENCY_SOS: 1,      // Highest - send immediately
  LOCATION_UPDATE: 2,    // High - emergency location tracking
  DISASTER_REPORT: 3,    // High - new incident reports
  REPORT_UPDATE: 4,      // Medium - updates to existing
  PHOTOS: 5,             // Lower - large payloads
  OPTIONAL_DATA: 6       // Lowest - medical ID, extra details
};
```

### 2. Network Detection & Adaptation

```javascript
// Network quality detection
const getNetworkQuality = () => {
  const connection = navigator.connection;
  if (!connection) return 'unknown';
  
  if (connection.effectiveType === '4g' && connection.downlink > 5) {
    return 'good';      // All features
  } else if (connection.effectiveType === '3g' || connection.downlink > 1) {
    return 'moderate';  // Core + some optional
  } else {
    return 'poor';      // Core features only
  }
};
```

### 3. Data Compression

```javascript
// Compress before storage/transmission
import LZString from 'lz-string';

const compressData = (data) => {
  return LZString.compressToUTF16(JSON.stringify(data));
};

const decompressData = (compressed) => {
  return JSON.parse(LZString.decompressFromUTF16(compressed));
};

// Image compression
const compressImage = async (file, maxWidth = 800, quality = 0.7) => {
  // Canvas-based compression
};
```

### 4. Offline Authentication

```javascript
// UUID-based device identification
const getDeviceId = () => {
  let deviceId = localStorage.getItem('aegis_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('aegis_device_id', deviceId);
  }
  return deviceId;
};

// Offline session persistence
const AUTH_STORAGE = {
  token: 'aegis_auth_token',
  user: 'aegis_user_data',
  expiry: 'aegis_token_expiry' // 30 days for offline use
};
```

---

## 📁 Project Structure

```
project-aegis/
├── apps/
│   ├── field-app/              # PWA for field responders
│   │   ├── public/
│   │   │   ├── locales/        # Translation files
│   │   │   │   ├── en.json
│   │   │   │   ├── si.json
│   │   │   │   └── ta.json
│   │   │   └── offline-tiles/  # Cached map tiles
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── EmergencyButton.jsx
│   │   │   │   ├── DisasterReportForm.jsx
│   │   │   │   ├── SafetyAdvisory.jsx
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   │   ├── useEmergencyMode.js
│   │   │   │   ├── useGeolocation.js
│   │   │   │   ├── useNetworkStatus.js
│   │   │   │   └── useSync.js
│   │   │   ├── stores/
│   │   │   │   ├── authStore.js
│   │   │   │   ├── reportStore.js
│   │   │   │   └── emergencyStore.js
│   │   │   ├── db/
│   │   │   │   └── database.js   # Dexie.js setup
│   │   │   ├── services/
│   │   │   │   ├── api.js
│   │   │   │   ├── syncService.js
│   │   │   │   └── compressionService.js
│   │   │   └── i18n/
│   │   │       └── config.js
│   │   └── package.json
│   │
│   └── dashboard/              # Command center dashboard
│       ├── src/
│       │   ├── components/
│       │   │   ├── Map/
│       │   │   ├── KPIs/
│       │   │   ├── ReliefCamps/
│       │   │   ├── RescueMissions/
│       │   │   └── Alerts/
│       │   ├── pages/
│       │   └── ...
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, utils
│       ├── types/
│       ├── constants/
│       └── utils/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── alertEngine.js  # Intelligent alerts
│   │   │   ├── geoService.js   # Geospatial queries
│   │   │   └── syncService.js
│   │   ├── middleware/
│   │   └── index.js
│   └── package.json
│
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## 🚀 Deployment Guide

### VPS Setup (152.42.185.253)

```bash
# 1. SSH into server
ssh root@152.42.185.253

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin

# 3. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Install Nginx
apt install nginx certbot python3-certbot-nginx

# 5. Clone and deploy
git clone <repo> /opt/project-aegis
cd /opt/project-aegis
docker compose up -d

# 6. Setup SSL (replace with your domain)
certbot --nginx -d aegis.yourdomain.com
```

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://aegis:password@db:5432/aegis
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgis/postgis:15-3.3
    environment:
      - POSTGRES_USER=aegis
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=aegis
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./apps/field-app/dist:/usr/share/nginx/field-app
      - ./apps/dashboard/dist:/usr/share/nginx/dashboard

volumes:
  pgdata:
  redisdata:
```

---

## 📊 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  username      String    @unique
  password      String
  fullName      String
  phone         String?
  role          Role      @default(RESPONDER)
  district      String?
  createdAt     DateTime  @default(now())
  
  reports       Report[]
  emergencies   Emergency[]
  assignments   CampAssignment[]
  rescueMissions RescueMission[]
}

enum Role {
  SUPER_ADMIN
  DISTRICT_ADMIN
  GRAMA_NILADARI
  ARMY_OFFICER
  MEDICAL_OFFICER
  CAMP_MANAGER
  RESPONDER
}

model Report {
  id              String      @id @default(uuid())
  localId         String?     // Client-generated UUID
  type            DisasterType
  severity        Int         // 1-5
  peopleCount     Int?
  latitude        Float
  longitude       Float
  description     String?
  photos          String[]    // URLs
  specialNeeds    String?
  contactNumber   String?
  status          ReportStatus @default(PENDING)
  
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  createdAt       DateTime    @default(now())
  syncedAt        DateTime    @default(now())
  
  @@index([latitude, longitude])
  @@index([type, severity])
}

enum DisasterType {
  FLOOD
  LANDSLIDE
  ROAD_BLOCK
  POWER_LINE
  BUILDING_COLLAPSE
  FIRE
  OTHER
}

enum ReportStatus {
  PENDING
  ACKNOWLEDGED
  IN_PROGRESS
  RESOLVED
}

model Emergency {
  id              String    @id @default(uuid())
  localId         String?
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  // Location tracking
  locations       Json      // Array of {lat, lng, timestamp}
  currentLat      Float
  currentLng      Float
  
  // Medical ID (optional)
  medicalId       Json?
  
  status          EmergencyStatus @default(ACTIVE)
  createdAt       DateTime  @default(now())
  resolvedAt      DateTime?
  
  @@index([currentLat, currentLng])
}

enum EmergencyStatus {
  ACTIVE
  RESPONDING
  RESOLVED
}

model ReliefCamp {
  id              String    @id @default(uuid())
  name            String
  latitude        Float
  longitude       Float
  address         String?
  capacity        Int
  currentOccupancy Int      @default(0)
  
  // Demographics
  children        Int       @default(0)
  elderly         Int       @default(0)
  pregnant        Int       @default(0)
  disabled        Int       @default(0)
  infants         Int       @default(0)
  
  // Supplies
  supplies        Json?     // {food: {rice: 100, ...}, water: 500, ...}
  medicineNeeds   Json?     // [{name, quantity, urgency}]
  
  // Staff
  assignments     CampAssignment[]
  
  status          CampStatus @default(ACTIVE)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum CampStatus {
  ACTIVE
  FULL
  CLOSED
}

model CampAssignment {
  id          String      @id @default(uuid())
  campId      String
  camp        ReliefCamp  @relation(fields: [campId], references: [id])
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  role        String      // Doctor, Nurse, Army, Volunteer
  startDate   DateTime    @default(now())
  endDate     DateTime?
}

model RescueMission {
  id              String    @id @default(uuid())
  priority        Int       // 1-5
  status          MissionStatus @default(PLANNED)
  
  // Location
  latitude        Float
  longitude       Float
  locationDesc    String?
  
  // People
  reportedTrapped Int?
  rescued         Int       @default(0)
  
  // Resources
  resources       Json?     // [{type: 'boat', count: 2, unit: 'Navy'}]
  personnel       Json?     // [{name, role, contact}]
  
  // Timeline
  timeline        Json?     // [{time, event, by}]
  
  leaderId        String?
  leader          User?     @relation(fields: [leaderId], references: [id])
  
  createdAt       DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
}

enum MissionStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Alert {
  id              String    @id @default(uuid())
  type            AlertType
  severity        Int
  title           String
  message         String
  
  // Target area (polygon or radius)
  targetArea      Json      // GeoJSON or {center, radius}
  
  // Source
  sourceReportId  String?
  
  sentAt          DateTime  @default(now())
  expiresAt       DateTime?
}

enum AlertType {
  FLOOD_WARNING
  LANDSLIDE_WARNING
  EVACUATION_ORDER
  RELIEF_INFO
  GENERAL
}
```

---

## 🔐 Security Considerations

1. **JWT tokens** with 30-day expiry for offline use
2. **Device UUID** binding for additional security
3. **HTTPS everywhere** (SSL via Let's Encrypt)
4. **Input validation** with Zod
5. **Rate limiting** on API endpoints
6. **Role-based access control** (RBAC)
7. **Data encryption** at rest for sensitive medical data

---

## 📈 Performance Optimizations

1. **Service Worker** caches all static assets
2. **IndexedDB** for large offline data
3. **Image compression** before storage (max 800px, 70% quality)
4. **Data compression** with lz-string
5. **Lazy loading** for non-critical features
6. **Code splitting** per route
7. **Background sync** API where supported

---

## 🧪 Testing Strategy

1. **Offline testing**: Chrome DevTools → Network → Offline
2. **Low signal simulation**: Network throttling to "Slow 3G"
3. **GPS testing**: Chrome DevTools → Sensors → Geolocation
4. **PWA audit**: Lighthouse PWA audit
5. **Load testing**: k6 for API endpoints

---

## 📋 Implementation Phases

### Phase 1: Core MVP (Current Sprint)
- [x] Basic PWA structure
- [x] Offline data storage
- [x] Basic report submission
- [ ] Emergency SOS button
- [ ] Multi-language support
- [ ] Basic dashboard

### Phase 2: Enhanced Features
- [ ] Intelligent alert system
- [ ] Relief camp management
- [ ] Rescue mission tracking
- [ ] Report generation

### Phase 3: Advanced Features
- [ ] Predictive alerts
- [ ] SMS gateway integration
- [ ] Offline map tiles
- [ ] Advanced analytics

---

## 📞 Emergency Contact Numbers (Sri Lanka)

| Service | Number |
|---------|--------|
| National Emergency | 119 |
| Disaster Management Center | 117 |
| Police Emergency | 118/119 |
| Fire & Rescue | 110 |
| Ambulance/Suwa Seriya | 1990 |
| Coast Guard | 118 |
| Electricity Emergency | 1987 |

---

*Document Version: 2.0*
*Last Updated: December 13, 2025*
