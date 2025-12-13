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
import MapSidebarKPIs from '../components/MapSidebarKPIs';
import MapBottomKPIs from '../components/MapBottomKPIs';
import MapChartsSection from '../components/MapChartsSection';
import { mockIncidents } from '../data/mockIncidents';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  
  // Initialize with mock data immediately
  const [incidents, setIncidents] = useState(() => {
    console.log('Initializing with mock data:', mockIncidents.length, 'incidents');
    return mockIncidents;
  });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newIncidentAlert, setNewIncidentAlert] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const user = authAPI.getUser();

  // Log incidents for debugging
  useEffect(() => {
    console.log('Current incidents:', incidents.length);
  }, [incidents]);

  // Fetch incidents from server
  const fetchData = async () => {
    try {
      setLoading(true);
      const incidentsData = await incidentsAPI.getAll();
      
      // If no real data, use mock data for demonstration
      if (!incidentsData || incidentsData.length === 0) {
        console.log('Using mock data for demonstration');
        setIncidents(mockIncidents);
      } else {
        console.log('Using real API data:', incidentsData.length);
        setIncidents(incidentsData);
      }
    } catch (error) {
      console.error('Failed to fetch data, using mock data:', error);
      // Use mock data if API fails
      setIncidents(mockIncidents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Comment out fetchData to use only mock data
    // fetchData();

    console.log('Dashboard mounted with', incidents.length, 'mock incidents');

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
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden" data-theme="aegisDashboardLight">
      {/* Header - Fixed height */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Project Aegis</h1>
              <p className="text-xs text-gray-500 leading-tight">Command Dashboard • Ratnapura</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                view === 'map' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Live Map
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                view === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>

            {/* Total Incidents Badge */}
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              {incidents.length} Incidents
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* User Info */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* New Incident Alert Toast */}
      {newIncidentAlert && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 shadow-lg max-w-sm">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">New Incident!</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {getTypeEmoji(newIncidentAlert.incident_type)} {newIncidentAlert.incident_type?.replace('_', ' ')} - Severity {newIncidentAlert.severity}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Flex 1 to fill remaining space */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {loading && incidents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading incidents...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Live Map View with KPIs */}
            {view === 'map' && (
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Sidebar - Fixed width, no scroll */}
                <MapSidebarKPIs incidents={incidents} />
                
                {/* Center Content - Map */}
                <div className="w-[45%] flex flex-col min-w-0 overflow-hidden border-x border-gray-200 relative">
                  {/* Map */}
                  <div className="flex-1 min-h-0">
                    <IncidentMap 
                      incidents={incidents} 
                      selectedIncident={selectedIncident}
                      onSelectIncident={setSelectedIncident}
                    />
                  </div>
                  
                  {/* Bottom Right KPIs - Overlay on map */}
                  <div className="absolute bottom-3 right-3 z-[1000] max-w-[90%]">
                    <MapBottomKPIs incidents={incidents} />
                  </div>
                </div>
                
                {/* Right Side - Charts */}
                <div className="flex-1 flex flex-col min-w-0 overflow-auto bg-gray-50 p-3">
                  <MapChartsSection incidents={incidents} />
                </div>
              </div>
            )}
            
            {/* Incident List View */}
            {view === 'list' && (
              <div className="flex-1 p-4 overflow-auto">
                <IncidentList 
                  incidents={incidents}
                  onSelectIncident={(incident) => {
                    setSelectedIncident(incident);
                    setView('map');
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
