import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, Clock, User, Check, X,
  Droplet, UtensilsCrossed, Pill, Home, Battery, Flashlight, Heart,
  CheckCircle, AlertCircle, Truck, RefreshCw
} from 'lucide-react';
import socketService from '../services/socket';

// Use relative URL for API
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const SUPPLY_ICONS = {
  water: { icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-100' },
  food: { icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-100' },
  medical: { icon: Pill, color: 'text-red-500', bg: 'bg-red-100' },
  blankets: { icon: Home, color: 'text-purple-500', bg: 'bg-purple-100' },
  shelter: { icon: Home, color: 'text-green-500', bg: 'bg-green-100' },
  batteries: { icon: Battery, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  flashlights: { icon: Flashlight, color: 'text-amber-500', bg: 'bg-amber-100' },
  firstaid: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100' }
};

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-300' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-300' },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-300' },
  low: { color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-300' }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  acknowledged: { label: 'Acknowledged', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', icon: Truck, color: 'bg-orange-100 text-orange-700' },
  fulfilled: { label: 'Fulfilled', icon: Check, color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', icon: X, color: 'bg-red-100 text-red-700' }
};

// Mock data for demonstration
const mockSupplyRequests = [
  {
    id: 'supply-001',
    device_id: 'device-123',
    responder_name: 'Kusal Pabasara',
    responder_email: 'kusal@example.com',
    priority: 'critical',
    supplies: ['water', 'food', 'medical'],
    recipients: 45,
    notes: 'Urgent need for clean drinking water. Medical supplies running low.',
    latitude: 6.6828,
    longitude: 80.3992,
    status: 'pending',
    created_at: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'supply-002',
    device_id: 'device-456',
    responder_name: 'Team Alpha',
    responder_email: null,
    priority: 'high',
    supplies: ['blankets', 'shelter', 'firstaid'],
    recipients: 120,
    notes: 'Many elderly and children without proper shelter.',
    latitude: 6.7123,
    longitude: 80.4156,
    status: 'acknowledged',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'supply-003',
    device_id: 'device-789',
    responder_name: 'Field Unit B',
    responder_email: null,
    priority: 'medium',
    supplies: ['batteries', 'flashlights'],
    recipients: 30,
    notes: 'Power outage in area. Need emergency lighting.',
    latitude: 6.6456,
    longitude: 80.3678,
    status: 'in_progress',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 'supply-004',
    device_id: 'device-321',
    responder_name: 'Relief Camp C',
    responder_email: null,
    priority: 'low',
    supplies: ['food', 'water'],
    recipients: 200,
    notes: 'Routine resupply needed within 24 hours.',
    latitude: 6.7456,
    longitude: 80.3234,
    status: 'fulfilled',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

export const SupplyNeedsManager = () => {
  const [requests, setRequests] = useState(mockSupplyRequests);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch supply requests from API
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/supply-requests`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setRequests(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch supply requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    fetchRequests();

    const unsubscribeNew = socketService.subscribe('new-supply-request', (request) => {
      console.log('📦 New supply request received:', request);
      setRequests(prev => [request, ...prev]);
    });

    const unsubscribeUpdate = socketService.subscribe('supply-request-updated', (updated) => {
      console.log('📦 Supply request updated:', updated);
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, []);

  // Update request status
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${getApiUrl()}/supply-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updated = await response.json();
        setRequests(prev => prev.map(r => r.id === id ? updated : r));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      // Update locally anyway for demo
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r
      ));
    }
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

  // Filter requests
  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  // Count by status
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    acknowledged: requests.filter(r => r.status === 'acknowledged').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length
  };

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Package className="w-7 h-7 text-blue-600" />
          Supply Requests
        </h2>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`p-3 rounded-xl border transition-all ${
              filter === status 
                ? 'bg-blue-50 border-blue-300 shadow-md' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-500 capitalize">{status === 'all' ? 'Total' : status.replace('_', ' ')}</p>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No supply requests found</p>
          </div>
        ) : (
          filteredRequests.map(request => {
            const priorityConfig = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium;
            const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={request.id} 
                className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden ${priorityConfig.border}`}
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${priorityConfig.bgLight} flex items-center justify-center`}>
                        <Package className={`w-5 h-5 ${priorityConfig.textColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          {request.responder_name}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.color} text-white`}>
                            {request.priority.toUpperCase()}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatTime(request.created_at)}
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <MapPin className="w-3 h-3" />
                          {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Supplies */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {request.supplies.map(supply => {
                      const supplyConfig = SUPPLY_ICONS[supply] || { icon: Package, color: 'text-gray-500', bg: 'bg-gray-100' };
                      const SupplyIcon = supplyConfig.icon;
                      return (
                        <div 
                          key={supply}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${supplyConfig.bg}`}
                        >
                          <SupplyIcon className={`w-3.5 h-3.5 ${supplyConfig.color}`} />
                          <span className="text-xs font-medium text-gray-700 capitalize">{supply}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recipients & Notes */}
                  <div className="text-sm text-gray-600 mb-3">
                    {request.recipients && (
                      <p className="flex items-center gap-1 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{request.recipients}</span> people need supplies
                      </p>
                    )}
                    {request.notes && (
                      <p className="text-gray-500 italic">"{request.notes}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {request.status !== 'fulfilled' && request.status !== 'cancelled' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(request.id, 'acknowledged')}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Acknowledge
                        </button>
                      )}
                      {request.status === 'acknowledged' && (
                        <button
                          onClick={() => updateStatus(request.id, 'in_progress')}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 flex items-center gap-1"
                        >
                          <Truck className="w-4 h-4" />
                          Start Delivery
                        </button>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatus(request.id, 'fulfilled')}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Mark Fulfilled
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(request.id, 'cancelled')}
                        className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
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

export default SupplyNeedsManager;

