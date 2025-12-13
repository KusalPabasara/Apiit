/**
 * PROJECT AEGIS - Command Dashboard
 * 
 * Hackathon MVP: Simple dashboard with Live Map + Real-Time List
 * Built for Ratnapura District disaster response
 * 
 * Uses: Leaflet + OpenStreetMap (free, no API key!)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LogOut, 
  RefreshCw, 
  MapPin,
  List,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react';
import { authAPI, incidentsAPI } from '../services/api';
import socketService from '../services/socket';
import IncidentMap from '../components/IncidentMap';
import IncidentList from '../components/IncidentList';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newIncidentAlert, setNewIncidentAlert] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const user = authAPI.getUser();

  // Fetch incidents from server
  const fetchData = async () => {
    try {
      setLoading(true);
      const incidentsData = await incidentsAPI.getAll();
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates (Socket.IO)
    const unsubscribe = socketService.subscribe('new-incident', (incident) => {
      setIncidents(prev => [incident, ...prev]);
      
      // Show notification toast
      setNewIncidentAlert(incident);
      setTimeout(() => setNewIncidentAlert(null), 5000);
      
      // Play notification sound
      try {
        new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoXj9Dql30LIYrO6pt9DCKEy+ujfgsnfsbqpX8MKXnC66eADyx0vu2pgA8wbrntr4EQNGa17a+BEDhisvKwgRE8XrD0soISPVuu9LKCE0Faq/azghVEVqj2tIMYSFOk97SEGkxPofm1hRtPTJ76toUcUkmb+7iGHlZFmPu5hx9aQpT8uoggXz+Q/buJImI8jf28iiRlOYn+vYomaDaG/76LKWszgv++jCtrMX//v40tbi1+/8COMG8qe//AjzJyJ3j/wZA0cyV1/8GQNXQic//BkDZ1H2//wZA3dhxs/8GPN3ceav/Bjzl4G2f/wY86ehll/8GPO3oXYv/Bjzt7FV//wI88fBJc/7+PPn0QWf+/jz9+DVb/v49AgApT/76OQYEHTv++jkKCAEv/vo1DgwJI/76NRIMCRf++jESEBEL/voxFhQRA/76MRoUEPv+9i0eFBDz/vYtIhgQ7/72LSYcDOf+9i0qHAzf/vYtLhwM2/7yLS4cDNP+8i0yIAzL/vItNiAMw/7yLTogDLv+8i0+IAy3/u4tQiQMr/7uLUYkDKv+6i1KJAyj/uotTigMn/7qLVIoDJf+5i1WLAyP/uYtWiwMi/7mLV4wDIP+4i1iMAx//uItZjQMd/7iLWo0DHf+3i1uOAxv/t4tcjgMa/7eLXY8DGP+2i16PAx')
          .play()
          .catch(() => {});
      } catch {}
    });

    // Track connection status
    socketService.onConnectionChange?.(setIsConnected);

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    onLogout();
    navigate('/login');
  };

  // Get incident type emoji
  const getTypeEmoji = (type) => {
    const types = {
      'landslide': '🏔️',
      'flood': '🌊',
      'road_block': '🚧',
      'power_line': '⚡'
    };
    return types[type] || '⚠️';
  };

  return (
    <div className="min-h-screen bg-base-100" data-theme="aegisDashboard">
      {/* Header */}
      <header className="navbar bg-base-200 border-b border-base-300 px-6">
        <div className="navbar-start">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-error rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Project Aegis</h1>
              <p className="text-sm text-base-content/60">Command Dashboard • Ratnapura District</p>
            </div>
          </div>
        </div>
        
        <div className="navbar-center">
          {/* Map / List Toggle */}
          <div className="join">
            <button
              onClick={() => setView('map')}
              className={`btn join-item gap-2 ${view === 'map' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <MapPin className="w-4 h-4" />
              Live Map
            </button>
            <button
              onClick={() => setView('list')}
              className={`btn join-item gap-2 ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <List className="w-4 h-4" />
              Incident List
            </button>
          </div>
        </div>

        <div className="navbar-end">
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`badge gap-2 ${isConnected ? 'badge-success' : 'badge-error'}`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>

            {/* Total Incidents Badge */}
            <div className="badge badge-error badge-lg">
              {incidents.length} Incidents
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="btn btn-ghost btn-sm btn-circle"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* User & Logout */}
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-8">
                  <span>{user?.full_name?.charAt(0) || 'A'}</span>
                </div>
              </div>
              <span className="font-medium">{user?.full_name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="btn btn-error btn-sm gap-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* New Incident Alert Toast */}
      {newIncidentAlert && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-error">
            <Bell className="w-5 h-5" />
            <div>
              <p className="font-medium">New Incident Reported!</p>
              <p className="text-sm">
                {getTypeEmoji(newIncidentAlert.incident_type)} {newIncidentAlert.incident_type?.replace('_', ' ')} - Severity {newIncidentAlert.severity}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {loading && incidents.length === 0 ? (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-base-content/60 mt-4">Loading incidents...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Live Map View */}
            {view === 'map' && (
              <IncidentMap 
                incidents={incidents} 
                selectedIncident={selectedIncident}
                onSelectIncident={setSelectedIncident}
              />
            )}
            
            {/* Real-Time List View */}
            {view === 'list' && (
              <IncidentList 
                incidents={incidents}
                onSelectIncident={(incident) => {
                  setSelectedIncident(incident);
                  setView('map');
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
