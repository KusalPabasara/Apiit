# Project Aegis - Offline-First Disaster Response System

A comprehensive disaster management platform designed for emergency response coordination, featuring real-time incident reporting, relief camp management, rescue mission tracking, and intelligent alert systems.

##  Overview

Project Aegis is a full-stack disaster response system built for the Ratnapura District disaster scenario. It consists of three main components:

- **Backend API** - Node.js/Express server with Socket.io for real-time communication
- **Dashboard** - Command center interface for HQ operations
- **Field App** - Progressive Web App (PWA) for field responders with offline-first capabilities

##  Features

### Backend API
- RESTful API with Express.js
- Real-time communication via Socket.io
- JWT-based authentication
- LowDB for lightweight data persistence
- File upload support
- CORS-enabled for cross-origin requests

### Dashboard (HQ Interface)
- **Incident Management** - View and manage all reported incidents
- **Interactive Map** - Real-time incident visualization using Leaflet
- **Relief Camp Manager** - Manage relief camps, resources, and capacity
- **Rescue Mission Manager** - Coordinate and track rescue operations
- **Intelligent Alert System** - Automated alerts and notifications
- **Statistics Panel** - Real-time analytics and metrics
- **Real-time Updates** - Live data synchronization via WebSocket

### Field App (PWA)
- **Offline-First Architecture** - Works without internet connection
- **Auto-Registration** - Device auto-registers with UUID (no login required)
- **Disaster Reporting** - Report incidents with photos and location data
- **Emergency SOS Button** - Quick emergency alert functionality
- **Emergency Contacts** - Access to emergency services
- **Safety Advisories** - Real-time safety information
- **Multi-language Support** - English, Sinhala (si), Tamil (ta)
- **History Tracking** - View past reports and incidents
- **Geolocation Support** - Automatic location capture
- **Network Status Monitoring** - Offline/online detection
- **Data Synchronization** - Automatic sync when connection is restored

##  Architecture

```
project-aegis/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/ # Auth middleware
│   │   └── db/       # Database setup
│   └── data/        # JSON database storage
├── dashboard/        # React dashboard (HQ)
│   └── src/
│       ├── components/ # UI components
│       ├── pages/     # Page components
│       └── services/  # API & Socket services
├── field-app/        # React PWA (Field)
│   └── src/
│       ├── components/ # UI components
│       ├── pages/     # Page components
│       ├── hooks/     # Custom hooks
│       ├── stores/    # State management
│       └── services/  # API & Sync services
└── deploy/          # Deployment scripts
```

##  Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KusalPabasara/Apiit.git
   cd ApiitHachathon
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   
   Or install individually:
   ```bash
   # Root dependencies
   npm install
   
   # Backend
   cd backend && npm install && cd ..
   
   # Dashboard
   cd dashboard && npm install && cd ..
   
   # Field App
   cd field-app && npm install && cd ..
   ```

### Running the Application

#### Development Mode

From the root directory, run each service:

```bash
# Terminal 1 - Backend API (Port 3001)
npm run backend

# Terminal 2 - Dashboard (Port 5173)
npm run dashboard

# Terminal 3 - Field App (Port 5174)
npm run field-app
```

Or run individually:

```bash
# Backend
cd backend
npm run dev

# Dashboard
cd dashboard
npm run dev

# Field App
cd field-app
npm run dev
```

#### Production Mode

```bash
# Backend
cd backend
npm start

# Dashboard & Field App (build first)
cd dashboard
npm run build
npm run preview

cd field-app
npm run build
npm run preview
```

##  Project Structure

### Backend Routes

- `/api/auth` - Authentication endpoints
- `/api/incidents` - Incident management
- `/api/relief-camps` - Relief camp operations
- `/api/rescue-missions` - Rescue mission coordination
- `/api/alerts` - Alert system
- `/api/emergency` - Emergency endpoints
- `/api/health` - Health check endpoint

### Dashboard Pages

- `/dashboard/login` - Admin login
- `/dashboard/` - Main dashboard with all features

### Field App Pages

- `/app/` - Home page with emergency button
- `/app/report` - Incident reporting form
- `/app/history` - Report history

##  Technologies Used

### Backend
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **LowDB** - Lightweight JSON database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Dashboard
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time updates
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **DaisyUI** - UI components

### Field App
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Dexie** - IndexedDB wrapper (offline storage)
- **i18next** - Internationalization
- **Zustand** - State management
- **PWA Plugin** - Progressive Web App support
- **Tailwind CSS** - Styling
- **DaisyUI** - UI components

##  Deployment

The project includes deployment scripts for VPS deployment:

- **PM2** - Process management
- **Nginx** - Reverse proxy and static file serving
- **Deployment scripts** - PowerShell and Shell scripts

See `deploy/` directory for deployment configurations.

### Environment Variables

Backend environment variables (set in `deploy/ecosystem.config.cjs`):
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - Token expiration
- `CORS_ORIGIN` - Allowed CORS origins
- `DB_PATH` - Database file path

##  Authentication

- **Dashboard**: Requires login credentials
- **Field App**: Auto-registers device with UUID (no login required)

##  Progressive Web App (PWA)

The field app is a fully functional PWA that can be installed on mobile devices:
- Works offline
- Installable on home screen
- Service worker for caching
- Background sync capabilities

##  Internationalization

The field app supports multiple languages:
- English (en)
- Sinhala (si)
- Tamil (ta)

Language files are located in `field-app/src/locales/` and `field-app/public/locales/`.

## Real-time Features

- Live incident updates
- Real-time responder location tracking
- Instant alert notifications
- Live dashboard statistics

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  License

This project is private and proprietary.


##  Acknowledgments

Built for the APIIT Hackathon - Disaster Response System Challenge.

---

**Note**: This is an offline-first system designed to work in disaster scenarios where network connectivity may be unreliable. The field app prioritizes offline functionality and syncs data when connectivity is restored.

