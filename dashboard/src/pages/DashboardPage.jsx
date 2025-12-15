/**
 * PROJECT AEGIS - Command Dashboard
 * 
 * Professional dashboard with 3-column layout for desktop
 * Light theme with KPI sidebar, charts panel, and management tabs
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LogOut, 
  RefreshCw, 
  MapPin,
  List,
  Wifi,
  WifiOff,
  Bell,
  X,
  Clock,
  User,
  Users,
  Play,
  Square,
  Mic,
  AlertTriangle,
  Tent,
  Siren,
  BarChart3,
  Package,
  Sparkles
} from 'lucide-react';
import { authAPI, incidentsAPI } from '../services/api';
import socketService from '../services/socket';
import IncidentMap from '../components/IncidentMap';
import MapSidebarKPIs from '../components/MapSidebarKPIs';
import MapBottomKPIs from '../components/MapBottomKPIs';
import MapChartsSection from '../components/MapChartsSection';
import ReliefCampManager from '../components/ReliefCampManager';
import RescueMissionManager from '../components/RescueMissionManager';
import SupplyNeedsManager from '../components/SupplyNeedsManager';
import TrappedCiviliansManager from '../components/TrappedCiviliansManager';
import BlockedRoadsManager from '../components/BlockedRoadsManager';
import ExtractionDashboard from '../components/ExtractionDashboard';
import { mockIncidents } from '../data/mockIncidents';

function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [blockedRoads, setBlockedRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newIncidentAlert, setNewIncidentAlert] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sosAlerts, setSosAlerts] = useState([]);
  const user = authAPI.getUser();

  // Get API URL dynamically
  const getApiUrl = () => {
    if (import.meta.env.MODE === 'production') {
      return '/api';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  };

  // Fetch incidents
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await incidentsAPI.getAll();
      // Merge API data with mock data - always include mock data for demonstration
      if (data && data.length > 0) {
        // Combine API data with mock data, avoiding duplicates by ID
        const apiIds = new Set(data.map(i => i.id));
        const uniqueMockData = mockIncidents.filter(m => !apiIds.has(m.id));
        setIncidents([...data, ...uniqueMockData]);
      } else {
        // Use mock data if API returns empty or fails
        setIncidents(mockIncidents);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      // Always use mock data as fallback
      setIncidents(mockIncidents);
    } finally {
      setLoading(false);
    }
  };

  // Fetch blocked roads
  const fetchBlockedRoads = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/blocked-roads`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setBlockedRoads(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch blocked roads:', error);
    }
  };

  useEffect(() => {
    // Initialize with mock data immediately for instant display
    setIncidents(mockIncidents);
    // Then fetch from API and merge
    fetchData();
    fetchBlockedRoads();

    const unsubscribe = socketService.subscribe('new-incident', (incident) => {
      setIncidents(prev => [incident, ...prev]);
      setNewIncidentAlert(incident);
      setTimeout(() => setNewIncidentAlert(null), 5000);
      
      // Notification sound
      try {
        new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoXj9Dql30LIYrO6pt9DCKEy+ujfgsnfsbqpX8MKXnC66eADyx0vu2pgA8wbrntr4EQNGa17a+BEDhisvKwgRE8XrD0soISPVuu9LKCE0Faq/azghVEVqj2tIMYSFOk97SEGkxPofm1hRtPTJ76toUcUkmb+7iGHlZFmPu5hx9aQpT8uoggXz+Q/buJImI8jf28iiRlOYn+vYomaDaG/76LKWszgv++jCtrMX//v40tbi1+/8COMG8qe//AjzJyJ3j/wZA0cyV1/8GQNXQic//BkDZ1H2//wZA3dhxs/8GPN3ceav/Bjzl4G2f/wY86ehll/8GPO3oXYv/Bjzt7FV//wI88fBJc/7+PPn0QWf+/jz9+DVb/v49AgApT/76OQYEHTv++jkKCAEv/vo1DgwJI/76NRIMCRf++jESEBEL/voxFhQRA/76MRoUEPv+9i0eFBDz/vYtIhgQ7/72LSYcDOf+9i0qHAzf/vYtLhwM2/7yLS4cDNP+8i0yIAzL/vItNiAMw/7yLTogDLv+8i0+IAy3/u4tQiQMr/7uLUYkDKv+6i1KJAyj/uotTigMn/7qLVIoDJf+5i1WLAyP/uYtWiwMi/7mLV4wDIP+4i1iMAx//uItZjQMd/7iLWo0DHf+3i1uOAxv/t4tcjgMa/7eLXY8DGP+2i16PAx')
          .play().catch(() => {});
      } catch {}
    });

    // Listen for new blocked roads
    const unsubscribeBlockedRoad = socketService.subscribe('new-blocked-road', (road) => {
      console.log('🚧 New blocked road received:', road);
      setBlockedRoads(prev => [road, ...prev]);
    });

    // Listen for SOS alerts
    const unsubscribeSos = socketService.subscribe('sos-alert', (alert) => {
      console.log('🆘 Dashboard received SOS alert:', alert);
      setSosAlerts(prev => [alert, ...prev]);
      
      // Play urgent SOS sound
      try {
        new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoXj9Dql30LIYrO6pt9DCKEy+ujfgsnfsbqpX8MKXnC66eADyx0vu2pgA8wbrntr4EQNGa17a+BEDhisvKwgRE8XrD0soISPVuu9LKCE0Faq/azghVEVqj2tIMYSFOk97SEGkxPofm1hRtPTJ76toUcUkmb+7iGHlZFmPu5hx9aQpT8uoggXz+Q/buJImI8jf28iiRlOYn+vYomaDaG/76LKWszgv++jCtrMX//v40tbi1+/8COMG8qe//AjzJyJ3j/wZA0cyV1/8GQNXQic//BkDZ1H2//wZA3dhxs/8GPN3ceav/Bjzl4G2f/wY86ehll/8GPO3oXYv/Bjzt7FV//wI88fBJc/7+PPn0QWf+/jz9+DVb/v49AgApT/76OQYEHTv++jkKCAEv/vo1DgwJI/76NRIMCRf++jESEBEL/voxFhQRA/76MRoUEPv+9i0eFBDz/vYtIhgQ7/72LSYcDOf+9i0qHAzf/vYtLhwM2/7yLS4cDNP+8i0yIAzL/vItNiAMw/7yLTogDLv+8i0+IAy3/u4tQiQMr/7uLUYkDKv+6i1KJAyj/uotTigMn/7qLVIoDJf+5i1WLAyP/uYtWiwMi/7mLV4wDIP+4i1iMAx//uItZjQMd/7iLWo0DHf+3i1uOAxv/t4tcjgMa/7eLXY8DGP+2i16PAx')
          .play().catch(() => {});
      } catch {}
    });

    socketService.onConnectionChange(setIsConnected);
    
    return () => {
      unsubscribe();
      unsubscribeBlockedRoad();
      unsubscribeSos();
    };
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    onLogout();
    navigate('/login');
  };

  const getTypeIcon = (type) => {
    const icons = { 
      landslide: '⛰️', 
      flood: '🌊',
      road_block: '🚧',
      power_line_down: '⚡'
    };
    return icons[type] || '⚠️';
  };

  const getTypeName = (type) => {
    const names = { 
      landslide: 'Landslide', 
      flood: 'Flood',
      road_block: 'Road Block',
      power_line_down: 'Power Line Down'
    };
    return names[type] || type;
  };

  const getSeverityColor = (severity) => {
    const colors = { 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500', 5: 'bg-gray-500' };
    return colors[severity] || 'bg-gray-500';
  };

  const getSeverityLabel = (severity) => {
    const labels = ['', 'Critical', 'High', 'Medium', 'Low', 'Minimal'];
    return labels[severity] || 'Unknown';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredIncidents = filter === 'all' 
    ? incidents 
    : incidents.filter(i => i.incident_type === filter);

  const tabs = [
    { id: 'map', label: 'Live Map', icon: MapPin },
    { id: 'list', label: 'Incidents', icon: List },
    { id: 'extraction', label: 'Extraction', icon: Sparkles },
    { id: 'trapped', label: 'Trapped Civilians', icon: Users },
    { id: 'blocked', label: 'Blocked Roads', icon: AlertTriangle },
    { id: 'supply', label: 'Supply Needs', icon: Package },
    { id: 'relief', label: 'Relief Camps', icon: Tent },
    { id: 'rescue', label: 'Rescue Missions', icon: Siren }
  ];

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden" data-theme="aegisDashboardLight">
      {/* Header - Fixed height */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">Aegis Command</h1>
              <p className="text-xs text-gray-500">Ratnapura District HQ</p>
            </div>
          </div>

          {/* Navigation Tabs - Desktop */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-3">
            {/* Connection Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isConnected ? 'Connected' : 'Offline'}</span>
            </div>

            {/* Incident Count */}
            <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
              {incidents.length} Active
            </div>

            {/* Refresh */}
            <button 
              onClick={fetchData} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* User */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
            </div>

            {/* Logout */}
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden flex border-t border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors min-w-max px-4 ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' 
                  : 'text-gray-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* New Incident Alert */}
      {newIncidentAlert && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-pulse lg:left-auto lg:right-4 lg:w-96">
          <div className="bg-red-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <Bell className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">New Incident!</p>
              <p className="text-sm opacity-90">
                {getTypeIcon(newIncidentAlert.incident_type)} {getTypeName(newIncidentAlert.incident_type)}
              </p>
            </div>
            <button onClick={() => setNewIncidentAlert(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* SOS Alert - Urgent */}
      {sosAlerts.length > 0 && sosAlerts[0].status === 'active' && (
        <div className="fixed top-20 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-96">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-4 shadow-2xl border-2 border-red-400 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-2xl">🆘</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">SOS EMERGENCY ALERT!</p>
                <p className="text-sm opacity-90">
                  {sosAlerts[0].responder_name} needs immediate help
                </p>
                <p className="text-xs opacity-75 mt-1">
                  📍 {sosAlerts[0].latitude?.toFixed(4)}, {sosAlerts[0].longitude?.toFixed(4)}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('map');
                  setSelectedIncident(null);
                }}
                className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm hover:bg-red-50"
              >
                View
              </button>
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
            {/* Live Map View with KPIs - Matching dashboard_version3 layout */}
            {activeTab === 'map' && (
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Sidebar - Fixed width, no scroll */}
                <MapSidebarKPIs incidents={incidents} />
                
                {/* Center Content - Map */}
                <div className="w-[45%] flex flex-col min-w-0 overflow-hidden border-x border-gray-200 relative">
                  {/* Map */}
                  <div className="flex-1 min-h-0">
                    <IncidentMap 
                      incidents={incidents}
                      blockedRoads={blockedRoads}
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

            {/* List View */}
            {activeTab === 'list' && (
              <div className="p-4 max-w-6xl mx-auto">
                {/* Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {['all', 'flood', 'landslide'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        filter === type 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'all' ? 'All Incidents' : getTypeIcon(type) + ' ' + getTypeName(type)}
                    </button>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[1, 2, 3, 4].map(severity => {
                    const count = incidents.filter(i => i.severity === severity).length;
                    return (
                      <div key={severity} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className={`w-10 h-10 ${getSeverityColor(severity)} rounded-lg flex items-center justify-center text-white font-bold mb-2`}>
                          {severity}
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{count}</p>
                        <p className="text-sm text-gray-500">{getSeverityLabel(severity)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Incident Cards */}
                <div className="space-y-3">
                  {filteredIncidents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No incidents found</p>
                    </div>
                  ) : (
                    filteredIncidents.map(incident => (
                      <IncidentCard 
                        key={incident.id} 
                        incident={incident}
                        onSelect={() => {
                          setSelectedIncident(incident);
                          setActiveTab('map');
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Relief Camps Tab */}
            {activeTab === 'relief' && (
              <div className="pt-4 lg:pt-0">
                <ReliefCampManager />
              </div>
            )}

            {/* Trapped Civilians Tab */}
            {activeTab === 'trapped' && (
              <div className="pt-4 lg:pt-0">
                <TrappedCiviliansManager />
              </div>
            )}

            {/* Blocked Roads Tab */}
            {activeTab === 'blocked' && (
              <div className="pt-4 lg:pt-0">
                <BlockedRoadsManager />
              </div>
            )}

            {/* Supply Needs Tab */}
            {activeTab === 'supply' && (
              <div className="pt-4 lg:pt-0">
                <SupplyNeedsManager />
              </div>
            )}

            {/* Rescue Missions Tab */}
            {activeTab === 'rescue' && (
              <div className="pt-4 lg:pt-0">
                <RescueMissionManager />
              </div>
            )}

            {/* Extraction Tab */}
            {activeTab === 'extraction' && (
              <div className="pt-4 lg:pt-0">
                <ExtractionDashboard incidents={incidents} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Selected Incident Detail Modal */}
      {selectedIncident && activeTab === 'list' && (
        <IncidentDetailModal 
          incident={selectedIncident} 
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}

// Incident Card Component
function IncidentCard({ incident, onSelect }) {
  const getTypeIcon = (type) => {
    const icons = { 
      landslide: '⛰️', 
      flood: '🌊',
      road_block: '🚧',
      power_line_down: '⚡'
    };
    return icons[type] || '⚠️';
  };

  const getTypeName = (type) => {
    const names = { 
      landslide: 'Landslide', 
      flood: 'Flood',
      road_block: 'Road Block',
      power_line_down: 'Power Line Down'
    };
    return names[type] || type;
  };

  const getSeverityColor = (severity) => {
    const colors = { 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500', 5: 'bg-gray-500' };
    return colors[severity] || 'bg-gray-500';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-3xl">{getTypeIcon(incident.incident_type)}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800">{getTypeName(incident.incident_type)}</h3>
            <span className={`px-2 py-0.5 ${getSeverityColor(incident.severity)} rounded text-xs font-bold text-white`}>
              {incident.severity}
            </span>
          </div>
          
          {incident.description && (
            <p className="text-sm text-gray-500 line-clamp-1 mb-2">{incident.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(incident.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {incident.responder_name?.split(' ')[0] || 'Unknown'}
            </span>
            {incident.voice_note && (
              <span className="flex items-center gap-1 text-blue-500">
                <Mic className="w-3 h-3" />
                Voice
              </span>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="flex items-center gap-2">
          {incident.voice_note && (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Mic className="w-4 h-4 text-blue-500" />
            </div>
          )}
          {incident.photo && (
            <img src={incident.photo} alt="" className="w-12 h-12 rounded-lg object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

// Incident Detail Modal
function IncidentDetailModal({ incident, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const getTypeIcon = (type) => {
    const icons = { 
      landslide: '⛰️', 
      flood: '🌊',
      road_block: '🚧',
      power_line_down: '⚡'
    };
    return icons[type] || '⚠️';
  };

  const getTypeName = (type) => {
    const names = { 
      landslide: 'Landslide', 
      flood: 'Flood',
      road_block: 'Road Block',
      power_line_down: 'Power Line Down'
    };
    return names[type] || type;
  };

  const getSeverityColor = (severity) => {
    const colors = { 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500', 5: 'bg-gray-500' };
    return colors[severity] || 'bg-gray-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(incident.incident_type)}</span>
            <div>
              <h2 className="font-bold text-gray-800">{getTypeName(incident.incident_type)}</h2>
              <p className="text-xs text-gray-500">
                {new Date(incident.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Severity */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm">Severity:</span>
            <span className={`px-3 py-1 ${getSeverityColor(incident.severity)} rounded-full text-sm font-bold text-white`}>
              Level {incident.severity}
            </span>
          </div>

          {/* Description */}
          {incident.description && (
            <div>
              <p className="text-gray-500 text-sm mb-1">Description:</p>
              <p className="text-gray-800">{incident.description}</p>
            </div>
          )}

          {/* Location */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Location:</p>
            <p className="text-gray-800 font-mono text-sm">
              {incident.latitude?.toFixed(6)}, {incident.longitude?.toFixed(6)}
            </p>
          </div>

          {/* Responder */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Reported by:</p>
            <p className="text-gray-800">{incident.responder_name || 'Unknown'}</p>
          </div>

          {/* Voice Note */}
          {incident.voice_note && (
            <div>
              <p className="text-gray-500 text-sm mb-2">Voice Message:</p>
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
                <audio
                  ref={audioRef}
                  src={incident.voice_note}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                />
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? (
                    <Square className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-1" />
                  )}
                </button>
                <div className="flex-1">
                  <p className="text-blue-700 font-medium">Voice Note</p>
                  <p className="text-blue-600 text-sm">Tap to {isPlaying ? 'stop' : 'play'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Photo */}
          {incident.photo && (
            <div>
              <p className="text-gray-500 text-sm mb-2">Photo:</p>
              <img 
                src={incident.photo} 
                alt="Incident" 
                className="w-full rounded-xl"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
