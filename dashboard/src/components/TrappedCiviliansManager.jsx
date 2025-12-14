import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, Clock, User, Check, X,
  AlertTriangle, Heart, Activity, Shield, Truck,
  CheckCircle, Play, Square, RefreshCw, Phone, Mic
} from 'lucide-react';
import socketService from '../services/socket';

// Use relative URL for API
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-300' },
  high: { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-300' },
  medium: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-300' },
  low: { label: 'Low', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-300' }
};

const CONDITION_CONFIG = {
  unknown: { label: 'Unknown', icon: AlertTriangle, color: 'text-gray-500' },
  injured: { label: 'Injured', icon: Activity, color: 'text-orange-500' },
  critical: { label: 'Critical', icon: Heart, color: 'text-red-500' },
  stable: { label: 'Stable', icon: CheckCircle, color: 'text-green-500' },
  unresponsive: { label: 'Unresponsive', icon: AlertTriangle, color: 'text-red-600' }
};

const STATUS_CONFIG = {
  reported: { label: 'Reported', icon: AlertTriangle, color: 'bg-gray-100 text-gray-700' },
  acknowledged: { label: 'Acknowledged', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  rescue_dispatched: { label: 'Team Dispatched', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  rescue_in_progress: { label: 'Rescue In Progress', icon: Shield, color: 'bg-orange-100 text-orange-700' },
  rescued: { label: 'Rescued', icon: Check, color: 'bg-green-100 text-green-700' },
  unable_to_reach: { label: 'Unable to Reach', icon: X, color: 'bg-red-100 text-red-700' }
};

// Mock data for demonstration
const mockTrappedReports = [
  {
    id: 'trapped-001',
    device_id: 'device-123',
    responder_name: 'Kusal Pabasara',
    responder_email: 'kusal@example.com',
    number_of_civilians: 5,
    condition: 'injured',
    urgency: 'critical',
    description: 'Family trapped in collapsed building. Children present.',
    accessibility_notes: '3rd floor, east wing. Stairway blocked.',
    voice_note: null,
    latitude: 6.6828,
    longitude: 80.3992,
    status: 'reported',
    rescue_team: null,
    rescued_count: 0,
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'trapped-002',
    device_id: 'device-456',
    responder_name: 'Team Alpha',
    number_of_civilians: 12,
    condition: 'unknown',
    urgency: 'high',
    description: 'Multiple people reported trapped in flooded basement.',
    accessibility_notes: 'Water level rising. Need boats.',
    latitude: 6.7123,
    longitude: 80.4156,
    status: 'rescue_dispatched',
    rescue_team: 'Rescue Team Delta',
    rescued_count: 0,
    created_at: new Date(Date.now() - 45 * 60000).toISOString()
  },
  {
    id: 'trapped-003',
    device_id: 'device-789',
    responder_name: 'Field Unit B',
    number_of_civilians: 3,
    condition: 'stable',
    urgency: 'medium',
    description: 'Elderly couple and caregiver stranded on rooftop.',
    accessibility_notes: '2-story building, accessible by ladder.',
    latitude: 6.6456,
    longitude: 80.3678,
    status: 'rescue_in_progress',
    rescue_team: 'Rescue Team Bravo',
    rescued_count: 1,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'trapped-004',
    device_id: 'device-321',
    responder_name: 'Volunteer C',
    number_of_civilians: 8,
    condition: 'stable',
    urgency: 'low',
    description: 'Group isolated by floodwaters, have supplies for 24 hours.',
    accessibility_notes: 'Road access cut off. Helicopter or boat needed.',
    latitude: 6.7456,
    longitude: 80.3234,
    status: 'rescued',
    rescue_team: 'Air Rescue Unit',
    rescued_count: 8,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString()
  }
];

// Voice Player Component
const VoicePlayer = ({ voiceNote }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  if (!voiceNote) return null;

  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-pink-50 rounded-lg border border-pink-200">
      <audio
        ref={audioRef}
        src={voiceNote}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={() => {
          if (isPlaying) {
            audioRef.current?.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
          } else {
            audioRef.current?.play();
            setIsPlaying(true);
          }
        }}
        className={`p-2 rounded-full ${isPlaying ? 'bg-pink-500' : 'bg-pink-400'} text-white`}
      >
        {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex items-center gap-1 text-pink-600 text-sm">
        <Mic className="w-4 h-4" />
        <span>Voice Note</span>
      </div>
    </div>
  );
};

export const TrappedCiviliansManager = () => {
  const [reports, setReports] = useState(mockTrappedReports);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [rescueTeamInput, setRescueTeamInput] = useState('');
  const [activeAssignModal, setActiveAssignModal] = useState(null);

  // Fetch reports from API
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/trapped-civilians`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setReports(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trapped civilians reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    fetchReports();

    const unsubscribeNew = socketService.subscribe('new-trapped-report', (report) => {
      console.log('🆘 New trapped civilians report received:', report);
      setReports(prev => [report, ...prev]);
    });

    const unsubscribeUpdate = socketService.subscribe('trapped-report-updated', (updated) => {
      console.log('🆘 Trapped civilians report updated:', updated);
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, []);

  // Update report status
  const updateStatus = async (id, newStatus, rescueTeam = null, rescuedCount = null) => {
    try {
      const body = { status: newStatus };
      if (rescueTeam) body.rescue_team = rescueTeam;
      if (rescuedCount !== null) body.rescued_count = rescuedCount;

      const response = await fetch(`${getApiUrl()}/trapped-civilians/${id}/status`, {
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
          rescue_team: rescueTeam || r.rescue_team,
          rescued_count: rescuedCount !== null ? rescuedCount : r.rescued_count,
          updated_at: new Date().toISOString() 
        } : r
      ));
    }
    setActiveAssignModal(null);
    setRescueTeamInput('');
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
    ? reports.filter(r => !['rescued', 'unable_to_reach'].includes(r.status))
    : reports.filter(r => r.status === filter);

  // Stats
  const totalCivilians = reports.reduce((acc, r) => acc + r.number_of_civilians, 0);
  const rescuedCivilians = reports.reduce((acc, r) => acc + (r.rescued_count || 0), 0);
  const activeReports = reports.filter(r => !['rescued', 'unable_to_reach'].includes(r.status)).length;
  const criticalReports = reports.filter(r => r.urgency === 'critical' && r.status !== 'rescued').length;

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Users className="w-7 h-7 text-pink-500" />
          Trapped Civilians
        </h2>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-gray-800">{totalCivilians}</p>
          <p className="text-xs text-gray-500">Total Reported</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-green-600">{rescuedCivilians}</p>
          <p className="text-xs text-gray-500">Rescued</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-orange-600">{activeReports}</p>
          <p className="text-xs text-gray-500">Active Reports</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-red-600">{criticalReports}</p>
          <p className="text-xs text-gray-500">Critical</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'active', 'reported', 'rescue_dispatched', 'rescue_in_progress', 'rescued'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-pink-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No trapped civilians reports found</p>
          </div>
        ) : (
          filteredReports.map(report => {
            const urgencyConfig = URGENCY_CONFIG[report.urgency] || URGENCY_CONFIG.medium;
            const conditionConfig = CONDITION_CONFIG[report.condition] || CONDITION_CONFIG.unknown;
            const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
            const StatusIcon = statusConfig.icon;
            const ConditionIcon = conditionConfig.icon;

            return (
              <div 
                key={report.id} 
                className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden ${urgencyConfig.border}`}
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${urgencyConfig.bgLight} flex items-center justify-center relative`}>
                        <Users className={`w-6 h-6 ${urgencyConfig.textColor}`} />
                        <span className={`absolute -top-1 -right-1 w-6 h-6 ${urgencyConfig.color} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                          {report.number_of_civilians}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          {report.number_of_civilians} Civilian{report.number_of_civilians > 1 ? 's' : ''}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyConfig.color} text-white`}>
                            {urgencyConfig.label}
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

                  {/* Condition & Location */}
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                    <div className={`flex items-center gap-1 ${conditionConfig.color}`}>
                      <ConditionIcon className="w-4 h-4" />
                      <span>Condition: {conditionConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Description & Notes */}
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Details:</span> {report.description}
                    </p>
                  )}
                  {report.accessibility_notes && (
                    <p className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2">
                      <span className="font-medium">⚠️ Access:</span> {report.accessibility_notes}
                    </p>
                  )}

                  {/* Voice Note */}
                  <VoicePlayer voiceNote={report.voice_note} />

                  {/* Rescue Team Info */}
                  {report.rescue_team && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <Shield className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-purple-700">{report.rescue_team}</p>
                        {report.rescued_count > 0 && (
                          <p className="text-xs text-purple-500">
                            {report.rescued_count}/{report.number_of_civilians} rescued
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!['rescued', 'unable_to_reach'].includes(report.status) && (
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
                        <>
                          <button
                            onClick={() => setActiveAssignModal(report.id)}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-1"
                          >
                            <Truck className="w-4 h-4" />
                            Dispatch Team
                          </button>
                        </>
                      )}

                      {report.status === 'rescue_dispatched' && (
                        <button
                          onClick={() => updateStatus(report.id, 'rescue_in_progress')}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 flex items-center gap-1"
                        >
                          <Activity className="w-4 h-4" />
                          Start Rescue
                        </button>
                      )}

                      {report.status === 'rescue_in_progress' && (
                        <button
                          onClick={() => updateStatus(report.id, 'rescued', null, report.number_of_civilians)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          All Rescued
                        </button>
                      )}

                      <button
                        onClick={() => updateStatus(report.id, 'unable_to_reach')}
                        className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Unable to Reach
                      </button>
                    </div>
                  )}

                  {/* Assign Team Modal */}
                  {activeAssignModal === report.id && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Dispatch Rescue Team</h3>
                        <input
                          type="text"
                          value={rescueTeamInput}
                          onChange={(e) => setRescueTeamInput(e.target.value)}
                          placeholder="Enter team name (e.g., Rescue Team Alpha)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setActiveAssignModal(null);
                              setRescueTeamInput('');
                            }}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateStatus(report.id, 'rescue_dispatched', rescueTeamInput)}
                            disabled={!rescueTeamInput.trim()}
                            className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50"
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

export default TrappedCiviliansManager;

