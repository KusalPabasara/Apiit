import React, { useState, useEffect } from 'react';
import { 
  Construction, MapPin, Clock, User, Check, X,
  AlertTriangle, Truck, CheckCircle, RefreshCw, Navigation,
  TreeDeciduous, Mountain, Waves, Car, Building
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socketService from '../services/socket';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Use relative URL for API
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const SEVERITY_CONFIG = {
  blocked: { label: 'Completely Blocked', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-300' },
  restricted: { label: 'Restricted Access', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-300' },
  hazardous: { label: 'Hazardous', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-300' },
  minor: { label: 'Minor Obstruction', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-300' }
};

const OBSTRUCTION_CONFIG = {
  debris: { label: 'Debris', icon: Building, color: 'text-gray-600' },
  landslide: { label: 'Landslide', icon: Mountain, color: 'text-amber-600' },
  flood: { label: 'Flooding', icon: Waves, color: 'text-blue-600' },
  fallen_tree: { label: 'Fallen Tree', icon: TreeDeciduous, color: 'text-green-600' },
  collapsed_bridge: { label: 'Collapsed Bridge', icon: Building, color: 'text-red-600' },
  accident: { label: 'Vehicle Accident', icon: Car, color: 'text-orange-600' },
  other: { label: 'Other', icon: AlertTriangle, color: 'text-gray-500' }
};

const STATUS_CONFIG = {
  reported: { label: 'Reported', icon: AlertTriangle, color: 'bg-gray-100 text-gray-700' },
  acknowledged: { label: 'Acknowledged', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  clearance_dispatched: { label: 'Team Dispatched', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  clearing_in_progress: { label: 'Clearing In Progress', icon: Construction, color: 'bg-orange-100 text-orange-700' },
  cleared: { label: 'Cleared', icon: Check, color: 'bg-green-100 text-green-700' },
  alternative_route: { label: 'Alternative Route', icon: Navigation, color: 'bg-cyan-100 text-cyan-700' }
};

// Mock data for demonstration
const mockBlockedRoads = [
  {
    id: 'blocked-001',
    device_id: 'device-123',
    responder_name: 'Kusal Pabasara',
    start_lat: 6.6828,
    start_lng: 80.3992,
    end_lat: 6.6850,
    end_lng: 80.4012,
    obstruction_type: 'landslide',
    severity: 'blocked',
    affected_length: 150,
    clearance_estimate: '4-6 hours',
    description: 'Major landslide blocking both lanes. Heavy machinery required.',
    status: 'reported',
    clearance_team: null,
    created_at: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'blocked-002',
    device_id: 'device-456',
    responder_name: 'Team Alpha',
    start_lat: 6.7123,
    start_lng: 80.4156,
    end_lat: null,
    end_lng: null,
    obstruction_type: 'flood',
    severity: 'restricted',
    affected_length: 200,
    clearance_estimate: 'Depends on water level',
    description: 'Road partially flooded. Small vehicles cannot pass.',
    status: 'clearance_dispatched',
    clearance_team: 'Road Crew Delta',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'blocked-003',
    device_id: 'device-789',
    responder_name: 'Field Unit B',
    start_lat: 6.6456,
    start_lng: 80.3678,
    end_lat: 6.6470,
    end_lng: 80.3700,
    obstruction_type: 'fallen_tree',
    severity: 'hazardous',
    affected_length: 30,
    clearance_estimate: '1-2 hours',
    description: 'Large tree fallen across road. Chainsaw needed.',
    status: 'clearing_in_progress',
    clearance_team: 'Road Crew Bravo',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'blocked-004',
    device_id: 'device-321',
    responder_name: 'Volunteer C',
    start_lat: 6.7456,
    start_lng: 80.3234,
    end_lat: null,
    end_lng: null,
    obstruction_type: 'debris',
    severity: 'minor',
    affected_length: 20,
    clearance_estimate: '30 minutes',
    description: 'Minor debris on road. Can be cleared manually.',
    status: 'cleared',
    clearance_team: 'Road Crew Alpha',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString()
  }
];

export const BlockedRoadsManager = () => {
  const [reports, setReports] = useState(mockBlockedRoads);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [clearanceTeamInput, setClearanceTeamInput] = useState('');
  const [activeAssignModal, setActiveAssignModal] = useState(null);

  // Fetch reports from API
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/blocked-roads`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setReports(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch blocked road reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    fetchReports();

    const unsubscribeNew = socketService.subscribe('new-blocked-road', (report) => {
      console.log('🚧 New blocked road report received:', report);
      setReports(prev => [report, ...prev]);
    });

    const unsubscribeUpdate = socketService.subscribe('blocked-road-updated', (updated) => {
      console.log('🚧 Blocked road report updated:', updated);
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, []);

  // Update report status
  const updateStatus = async (id, newStatus, clearanceTeam = null) => {
    try {
      const body = { status: newStatus };
      if (clearanceTeam) body.clearance_team = clearanceTeam;

      const response = await fetch(`${getApiUrl()}/blocked-roads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const updated = await response.json();
        setReports(prev => prev.map(r => r.id === id ? updated : r));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      // Update locally anyway for demo
      setReports(prev => prev.map(r => 
        r.id === id ? { 
          ...r, 
          status: newStatus, 
          clearance_team: clearanceTeam || r.clearance_team,
          updated_at: new Date().toISOString() 
        } : r
      ));
    }
    setActiveAssignModal(null);
    setClearanceTeamInput('');
  };

  // Format time
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter reports
  const filteredReports = filter === 'all' 
    ? reports 
    : filter === 'active'
    ? reports.filter(r => !['cleared', 'alternative_route'].includes(r.status))
    : reports.filter(r => r.status === filter);

  // Stats
  const totalBlocked = reports.filter(r => r.severity === 'blocked' && r.status !== 'cleared').length;
  const activeReports = reports.filter(r => !['cleared', 'alternative_route'].includes(r.status)).length;
  const clearedToday = reports.filter(r => {
    if (r.status !== 'cleared') return false;
    const cleared = new Date(r.updated_at);
    const today = new Date();
    return cleared.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Construction className="w-7 h-7 text-amber-500" />
          Blocked Roads
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            {viewMode === 'list' ? <MapPin className="w-5 h-5" /> : <Construction className="w-5 h-5" />}
            {viewMode === 'list' ? 'Map View' : 'List View'}
          </button>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-red-600">{totalBlocked}</p>
          <p className="text-xs text-gray-500">Completely Blocked</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-orange-600">{activeReports}</p>
          <p className="text-xs text-gray-500">Active Reports</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-green-600">{clearedToday}</p>
          <p className="text-xs text-gray-500">Cleared Today</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'active', 'reported', 'clearance_dispatched', 'clearing_in_progress', 'cleared'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-amber-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="mb-6 rounded-xl overflow-hidden border border-gray-200" style={{ height: '400px' }}>
          <MapContainer
            center={[6.6828, 80.3992]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredReports.map(report => (
              <React.Fragment key={report.id}>
                <Marker position={[report.start_lat, report.start_lng]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{OBSTRUCTION_CONFIG[report.obstruction_type]?.label}</p>
                      <p className="text-gray-600">{SEVERITY_CONFIG[report.severity]?.label}</p>
                      <p className="text-xs text-gray-500">{report.responder_name}</p>
                    </div>
                  </Popup>
                </Marker>
                {report.end_lat && report.end_lng && (
                  <>
                    <Marker position={[report.end_lat, report.end_lng]} />
                    <Polyline
                      positions={[[report.start_lat, report.start_lng], [report.end_lat, report.end_lng]]}
                      color={report.severity === 'blocked' ? 'red' : report.severity === 'restricted' ? 'orange' : 'yellow'}
                      weight={4}
                      dashArray="10, 10"
                    />
                  </>
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Construction className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No blocked road reports found</p>
          </div>
        ) : (
          filteredReports.map(report => {
            const severityConfig = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.minor;
            const obstructionConfig = OBSTRUCTION_CONFIG[report.obstruction_type] || OBSTRUCTION_CONFIG.other;
            const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
            const StatusIcon = statusConfig.icon;
            const ObstructionIcon = obstructionConfig.icon;

            return (
              <div 
                key={report.id} 
                className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden ${severityConfig.border}`}
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${severityConfig.bgLight} flex items-center justify-center`}>
                        <ObstructionIcon className={`w-6 h-6 ${obstructionConfig.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          {obstructionConfig.label}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.color} text-white`}>
                            {severityConfig.label}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {report.responder_name}
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <Clock className="w-3 h-3" />
                          {formatTime(report.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>Start: {report.start_lat.toFixed(4)}, {report.start_lng.toFixed(4)}</span>
                    </div>
                    {report.end_lat && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span>End: {report.end_lat.toFixed(4)}, {report.end_lng.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {report.affected_length && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                        📏 {report.affected_length}m affected
                      </span>
                    )}
                    {report.clearance_estimate && (
                      <span className="px-2 py-1 bg-amber-100 rounded-full text-amber-700">
                        ⏱️ Est: {report.clearance_estimate}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Details:</span> {report.description}
                    </p>
                  )}

                  {/* Clearance Team Info */}
                  {report.clearance_team && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <Truck className="w-5 h-5 text-purple-500" />
                      <p className="text-sm font-medium text-purple-700">{report.clearance_team}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {!['cleared', 'alternative_route'].includes(report.status) && (
                    <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-100">
                      {report.status === 'reported' && (
                        <button
                          onClick={() => updateStatus(report.id, 'acknowledged')}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Acknowledge
                        </button>
                      )}
                      
                      {report.status === 'acknowledged' && (
                        <button
                          onClick={() => setActiveAssignModal(report.id)}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-1"
                        >
                          <Truck className="w-4 h-4" />
                          Dispatch Team
                        </button>
                      )}

                      {report.status === 'clearance_dispatched' && (
                        <button
                          onClick={() => updateStatus(report.id, 'clearing_in_progress')}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 flex items-center gap-1"
                        >
                          <Construction className="w-4 h-4" />
                          Start Clearing
                        </button>
                      )}

                      {report.status === 'clearing_in_progress' && (
                        <button
                          onClick={() => updateStatus(report.id, 'cleared')}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Mark Cleared
                        </button>
                      )}

                      <button
                        onClick={() => updateStatus(report.id, 'alternative_route')}
                        className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1"
                      >
                        <Navigation className="w-4 h-4" />
                        Alt. Route
                      </button>
                    </div>
                  )}

                  {/* Assign Team Modal */}
                  {activeAssignModal === report.id && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Dispatch Clearance Team</h3>
                        <input
                          type="text"
                          value={clearanceTeamInput}
                          onChange={(e) => setClearanceTeamInput(e.target.value)}
                          placeholder="Enter team name (e.g., Road Crew Alpha)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setActiveAssignModal(null);
                              setClearanceTeamInput('');
                            }}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateStatus(report.id, 'clearance_dispatched', clearanceTeamInput)}
                            disabled={!clearanceTeamInput.trim()}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
                          >
                            Dispatch
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BlockedRoadsManager;

