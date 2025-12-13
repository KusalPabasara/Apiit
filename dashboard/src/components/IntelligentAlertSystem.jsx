import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, Send, MapPin, Clock, Users,
  ChevronDown, ChevronUp, Filter, Search, Plus, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://152.42.185.253:3001/api';

// Sri Lankan Rivers and their downstream relationships
const RIVER_SYSTEMS = {
  kelani: {
    name: 'Kelani River',
    upstream: ['Avissawella', 'Hanwella', 'Kaduwela'],
    downstream: ['Kolonnawa', 'Wellampitiya', 'Kelaniya', 'Peliyagoda'],
    monitoring: ['Glencourse', 'Hanwella', 'Nagalagam Street']
  },
  kalu: {
    name: 'Kalu Ganga',
    upstream: ['Ratnapura', 'Eheliyagoda'],
    downstream: ['Millaniya', 'Kalutara', 'Wadduwa'],
    monitoring: ['Putupaula', 'Ellagawa', 'Kalutara']
  },
  mahaweli: {
    name: 'Mahaweli River',
    upstream: ['Kandy', 'Gampola'],
    downstream: ['Minipe', 'Polonnaruwa', 'Trincomalee'],
    monitoring: ['Peradeniya', 'Randenigala', 'Victoria']
  },
  gin: {
    name: 'Gin Ganga',
    upstream: ['Neluwa', 'Baddegama'],
    downstream: ['Galle', 'Hikkaduwa'],
    monitoring: ['Tawalama', 'Baddegama']
  },
  nilwala: {
    name: 'Nilwala Ganga',
    upstream: ['Akuressa', 'Kamburupitiya'],
    downstream: ['Matara', 'Weligama'],
    monitoring: ['Pitabeddara', 'Thihagoda']
  }
};

const ALERT_TYPES = {
  flood_warning: { label: 'Flood Warning', color: 'warning', icon: '🌊' },
  flood_alert: { label: 'Flood Alert', color: 'error', icon: '⚠️' },
  evacuation: { label: 'Evacuation Order', color: 'error', icon: '🚨' },
  landslide_risk: { label: 'Landslide Risk', color: 'warning', icon: '⛰️' },
  safe_now: { label: 'Safe Notice', color: 'success', icon: '✅' },
  info: { label: 'Information', color: 'info', icon: 'ℹ️' }
};

const SEVERITY_LEVELS = [
  { value: 1, label: 'Low', color: 'success' },
  { value: 2, label: 'Moderate', color: 'info' },
  { value: 3, label: 'High', color: 'warning' },
  { value: 4, label: 'Critical', color: 'error' }
];

export const IntelligentAlertSystem = ({ token }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRiver, setSelectedRiver] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [newAlert, setNewAlert] = useState({
    type: 'flood_warning',
    severity: 2,
    riverSystem: '',
    affectedAreas: [],
    triggerDownstreamAlert: false,
    messageEn: '',
    messageSi: '',
    messageTa: '',
    validUntil: ''
  });
  
  useEffect(() => {
    fetchAlerts();
  }, []);
  
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectRiver = (riverKey) => {
    setSelectedRiver(riverKey);
    const river = RIVER_SYSTEMS[riverKey];
    setNewAlert(prev => ({
      ...prev,
      riverSystem: riverKey,
      affectedAreas: [...river.upstream, ...river.downstream]
    }));
  };
  
  const toggleArea = (area) => {
    setNewAlert(prev => ({
      ...prev,
      affectedAreas: prev.affectedAreas.includes(area)
        ? prev.affectedAreas.filter(a => a !== area)
        : [...prev.affectedAreas, area]
    }));
  };
  
  const propagateDownstream = () => {
    if (!selectedRiver) return;
    const river = RIVER_SYSTEMS[selectedRiver];
    // Automatically add downstream areas
    setNewAlert(prev => ({
      ...prev,
      affectedAreas: [...new Set([...prev.affectedAreas, ...river.downstream])],
      triggerDownstreamAlert: true
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAlert,
          createdAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        fetchAlerts();
        resetForm();
        
        // Show notification for downstream alert
        if (newAlert.triggerDownstreamAlert) {
          alert('✅ Alert broadcasted to downstream areas automatically!');
        }
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };
  
  const cancelAlert = async (alertId) => {
    if (!confirm('Cancel this alert?')) return;
    
    try {
      await fetch(`${API_URL}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to cancel alert:', error);
    }
  };
  
  const resetForm = () => {
    setNewAlert({
      type: 'flood_warning',
      severity: 2,
      riverSystem: '',
      affectedAreas: [],
      triggerDownstreamAlert: false,
      messageEn: '',
      messageSi: '',
      messageTa: ''
    });
    setSelectedRiver(null);
    setShowForm(false);
  };
  
  const activeAlerts = alerts.filter(a => a.status !== 'cancelled');
  const filteredAlerts = filterStatus === 'all' ? alerts : alerts.filter(a => a.status === filterStatus);
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-7 h-7 text-warning" />
          Intelligent Alert System
        </h2>
        <div className="flex gap-2">
          <div className="badge badge-error badge-lg">
            {activeAlerts.length} Active
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-warning gap-2">
            <Plus className="w-5 h-5" />
            New Alert
          </button>
        </div>
      </div>
      
      {/* Create Alert Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <button onClick={resetForm} className="btn btn-sm btn-circle absolute right-2 top-2">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-lg mb-4">Create Emergency Alert</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alert Type & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Alert Type *</span>
                  </label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value }))}
                    className="select select-bordered"
                    required
                  >
                    {Object.entries(ALERT_TYPES).map(([key, { label, icon }]) => (
                      <option key={key} value={key}>{icon} {label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Severity Level *</span>
                  </label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, severity: parseInt(e.target.value) }))}
                    className="select select-bordered"
                    required
                  >
                    {SEVERITY_LEVELS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* River System Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">River System (for downstream alerts)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(RIVER_SYSTEMS).map(([key, river]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectRiver(key)}
                      className={`btn btn-sm ${selectedRiver === key ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {river.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Area Selection */}
              {selectedRiver && (
                <div className="bg-base-300 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{RIVER_SYSTEMS[selectedRiver].name} - Select Areas</h4>
                    <button
                      type="button"
                      onClick={propagateDownstream}
                      className="btn btn-sm btn-warning gap-1"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Alert All Downstream
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-base-content/60 mb-2">Upstream Areas:</p>
                      <div className="flex flex-wrap gap-2">
                        {RIVER_SYSTEMS[selectedRiver].upstream.map(area => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleArea(area)}
                            className={`badge badge-lg cursor-pointer ${
                              newAlert.affectedAreas.includes(area) ? 'badge-primary' : 'badge-outline'
                            }`}
                          >
                            ⬆️ {area}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-base-content/60 mb-2">Downstream Areas (will receive propagated alerts):</p>
                      <div className="flex flex-wrap gap-2">
                        {RIVER_SYSTEMS[selectedRiver].downstream.map(area => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleArea(area)}
                            className={`badge badge-lg cursor-pointer ${
                              newAlert.affectedAreas.includes(area) ? 'badge-warning' : 'badge-outline'
                            }`}
                          >
                            ⬇️ {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Multi-language Messages */}
              <div className="divider">Alert Message (Multi-language)</div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">🇬🇧 English Message *</span>
                </label>
                <textarea
                  value={newAlert.messageEn}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, messageEn: e.target.value }))}
                  placeholder="Flood warning for low-lying areas. Please move to higher ground immediately."
                  className="textarea textarea-bordered h-20"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">🇱🇰 Sinhala Message (සිංහල)</span>
                </label>
                <textarea
                  value={newAlert.messageSi}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, messageSi: e.target.value }))}
                  placeholder="පහත් බිම් ප්‍රදේශවලට ගංවතුර අනතුරු ඇඟවීමකි. කරුණාකර වහාම ඉහළ බිම් වලට යන්න."
                  className="textarea textarea-bordered h-20"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">🇮🇳 Tamil Message (தமிழ்)</span>
                </label>
                <textarea
                  value={newAlert.messageTa}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, messageTa: e.target.value }))}
                  placeholder="தாழ்வான பகுதிகளுக்கு வெள்ள எச்சரிக்கை. உடனடியாக உயரமான இடத்திற்கு செல்லவும்."
                  className="textarea textarea-bordered h-20"
                />
              </div>
              
              {/* Valid Until */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Valid Until</span>
                </label>
                <input
                  type="datetime-local"
                  value={newAlert.validUntil}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="input input-bordered"
                />
              </div>
              
              {/* Downstream Alert Toggle */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">
                    🔔 Automatically notify downstream areas when water level rises upstream
                  </span>
                  <input
                    type="checkbox"
                    checked={newAlert.triggerDownstreamAlert}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, triggerDownstreamAlert: e.target.checked }))}
                    className="checkbox checkbox-warning"
                  />
                </label>
              </div>
              
              <div className="modal-action">
                <button type="button" onClick={resetForm} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-warning gap-2">
                  <Send className="w-4 h-4" />
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`btn btn-sm ${filterStatus === 'active' ? 'btn-warning' : 'btn-outline'}`}
        >
          Active
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          className={`btn btn-sm ${filterStatus === 'cancelled' ? 'btn-ghost' : 'btn-outline'}`}
        >
          Cancelled
        </button>
      </div>
      
      {/* Alerts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No alerts found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const typeInfo = ALERT_TYPES[alert.type] || ALERT_TYPES.info;
            const severityInfo = SEVERITY_LEVELS.find(s => s.value === alert.severity);
            
            return (
              <div key={alert.id} className={`card bg-base-200 shadow-xl ${
                alert.status === 'cancelled' ? 'opacity-50' : ''
              }`}>
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{typeInfo.icon}</div>
                      <div>
                        <h3 className="card-title text-lg">
                          {typeInfo.label}
                          <div className={`badge badge-${severityInfo?.color}`}>
                            {severityInfo?.label}
                          </div>
                          {alert.status === 'cancelled' && (
                            <div className="badge badge-ghost">Cancelled</div>
                          )}
                        </h3>
                        <p className="text-sm text-base-content/60">
                          {new Date(alert.createdAt).toLocaleString()}
                          {alert.validUntil && ` • Valid until ${new Date(alert.validUntil).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    
                    {alert.triggerDownstreamAlert && (
                      <div className="badge badge-warning gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Downstream Alert
                      </div>
                    )}
                  </div>
                  
                  {/* Message */}
                  <div className="bg-base-300 p-3 rounded-lg mt-2">
                    <p>{alert.messageEn}</p>
                    {alert.messageSi && <p className="text-sm text-base-content/60 mt-1">{alert.messageSi}</p>}
                  </div>
                  
                  {/* Affected Areas */}
                  {alert.affectedAreas?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-sm text-base-content/60 mr-2">Areas:</span>
                      {alert.affectedAreas.map(area => (
                        <div key={area} className="badge badge-outline badge-sm">
                          <MapPin className="w-3 h-3 mr-1" />
                          {area}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  {alert.status !== 'cancelled' && (
                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={() => cancelAlert(alert.id)}
                        className="btn btn-sm btn-ghost text-error"
                      >
                        Cancel Alert
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IntelligentAlertSystem;
