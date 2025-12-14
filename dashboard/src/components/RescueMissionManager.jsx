import React, { useState, useEffect } from 'react';
import { 
  Siren, Truck, Ship, Plane, Users, MapPin,
  Plus, Edit, Trash2, Save, X, Clock,
  CheckCircle, AlertTriangle, Play, Pause
} from 'lucide-react';

// Use relative URL for API
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const MISSION_STATUS = {
  PLANNED: { label: 'Planned', color: 'bg-blue-100 text-blue-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-orange-100 text-orange-700', icon: Play },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: X }
};

const RESOURCE_TYPES = [
  { value: 'boat', label: 'Boat', icon: '🚤' },
  { value: 'helicopter', label: 'Helicopter', icon: '🚁' },
  { value: 'truck', label: 'Truck', icon: '🚛' },
  { value: 'ambulance', label: 'Ambulance', icon: '🚑' },
  { value: 'jeep', label: 'Jeep/4WD', icon: '🚙' },
  { value: 'personnel', label: 'Personnel', icon: '👥' }
];

const initialMissionForm = {
  priority: 1,
  status: 'PLANNED',
  latitude: '',
  longitude: '',
  locationDesc: '',
  reportedTrapped: 0,
  rescued: 0,
  resources: [],
  personnel: [],
  timeline: []
};

// Mock data for demonstration
const mockMissions = [
  {
    id: 'mission-001',
    priority: 1,
    status: 'IN_PROGRESS',
    latitude: 6.6828,
    longitude: 80.3992,
    locationDesc: 'Near Ratnapura Central Hospital',
    reportedTrapped: 12,
    rescued: 5,
    resources: [
      { type: 'boat', count: 2, unit: 'Navy' },
      { type: 'helicopter', count: 1, unit: 'Air Force' }
    ],
    personnel: [
      { name: 'Lt. Silva', role: 'Team Lead', contact: '0771234567' }
    ],
    timeline: [
      { time: new Date(Date.now() - 2 * 3600000).toISOString(), event: 'Mission initiated' },
      { time: new Date(Date.now() - 1 * 3600000).toISOString(), event: '5 persons rescued' }
    ]
  },
  {
    id: 'mission-002',
    priority: 2,
    status: 'PLANNED',
    latitude: 6.7123,
    longitude: 80.4156,
    locationDesc: 'Elapatha Village - Flooded Area',
    reportedTrapped: 8,
    rescued: 0,
    resources: [
      { type: 'boat', count: 3, unit: 'Civil Defense' }
    ],
    personnel: [],
    timeline: [
      { time: new Date().toISOString(), event: 'Mission created' }
    ]
  },
  {
    id: 'mission-003',
    priority: 1,
    status: 'COMPLETED',
    latitude: 6.6456,
    longitude: 80.3678,
    locationDesc: 'Kahawatta Junction - Landslide Site',
    reportedTrapped: 6,
    rescued: 6,
    resources: [
      { type: 'truck', count: 2, unit: 'Army' },
      { type: 'ambulance', count: 1, unit: 'Medical Corps' }
    ],
    personnel: [
      { name: 'Capt. Perera', role: 'Rescue Commander', contact: '0779876543' }
    ],
    timeline: [
      { time: new Date(Date.now() - 8 * 3600000).toISOString(), event: 'Mission initiated' },
      { time: new Date(Date.now() - 6 * 3600000).toISOString(), event: '3 persons rescued' },
      { time: new Date(Date.now() - 4 * 3600000).toISOString(), event: 'All 6 persons rescued' },
      { time: new Date(Date.now() - 3 * 3600000).toISOString(), event: 'Mission completed' }
    ]
  }
];

export const RescueMissionManager = ({ token }) => {
  const [missions, setMissions] = useState(mockMissions);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [formData, setFormData] = useState(initialMissionForm);
  const [newResource, setNewResource] = useState({ type: 'boat', count: 1, unit: '' });
  const [newPersonnel, setNewPersonnel] = useState({ name: '', role: '', contact: '' });
  const [newTimelineEvent, setNewTimelineEvent] = useState('');
  
  const fetchMissions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/rescue-missions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setMissions(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch missions, using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For demo, just add to local state
    if (editingMission) {
      setMissions(prev => prev.map(m => m.id === editingMission.id ? { ...formData, id: editingMission.id } : m));
    } else {
      setMissions(prev => [...prev, { ...formData, id: `mission-${Date.now()}` }]);
    }
    resetForm();
    
    // Try API call in background
    try {
      const url = editingMission 
        ? `${getApiUrl()}/rescue-missions/${editingMission.id}`
        : `${getApiUrl()}/rescue-missions`;
      
      await fetch(url, {
        method: editingMission ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
    } catch (error) {
      console.error('API call failed:', error);
    }
  };
  
  const updateMissionStatus = async (id, newStatus) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    
    try {
      await fetch(`${getApiUrl()}/rescue-missions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rescue mission?')) return;
    
    setMissions(prev => prev.filter(m => m.id !== id));
    
    try {
      await fetch(`${getApiUrl()}/rescue-missions/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Failed to delete mission:', error);
    }
  };
  
  const resetForm = () => {
    setFormData(initialMissionForm);
    setEditingMission(null);
    setShowForm(false);
  };
  
  const editMission = (mission) => {
    setFormData({
      ...mission,
      resources: mission.resources || [],
      personnel: mission.personnel || [],
      timeline: mission.timeline || []
    });
    setEditingMission(mission);
    setShowForm(true);
  };
  
  const addResource = () => {
    if (newResource.count > 0) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, { ...newResource }]
      }));
      setNewResource({ type: 'boat', count: 1, unit: '' });
    }
  };
  
  const removeResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };
  
  const addPersonnel = () => {
    if (newPersonnel.name && newPersonnel.role) {
      setFormData(prev => ({
        ...prev,
        personnel: [...prev.personnel, { ...newPersonnel }]
      }));
      setNewPersonnel({ name: '', role: '', contact: '' });
    }
  };
  
  const removePersonnel = (index) => {
    setFormData(prev => ({
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index)
    }));
  };
  
  const addTimelineEvent = () => {
    if (newTimelineEvent) {
      setFormData(prev => ({
        ...prev,
        timeline: [...prev.timeline, {
          time: new Date().toISOString(),
          event: newTimelineEvent
        }]
      }));
      setNewTimelineEvent('');
    }
  };
  
  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Siren className="w-7 h-7 text-red-600 animate-pulse" />
          Rescue Mission Control
        </h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          New Mission
        </button>
      </div>
      
      {/* Mission Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {editingMission ? 'Edit Rescue Mission' : 'Create Rescue Mission'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value={1}>🔴 Critical - Immediate</option>
                      <option value={2}>🟠 High - Urgent</option>
                      <option value={3}>🟡 Medium - Important</option>
                      <option value={4}>🟢 Low - When Available</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      {Object.entries(MISSION_STATUS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Description</label>
                    <input
                      type="text"
                      value={formData.locationDesc}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationDesc: e.target.value }))}
                      placeholder="e.g., Near Kahawatta Temple, Main Road"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reported Trapped</label>
                    <input
                      type="number"
                      value={formData.reportedTrapped}
                      onChange={(e) => setFormData(prev => ({ ...prev, reportedTrapped: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rescued So Far</label>
                    <input
                      type="number"
                      value={formData.rescued}
                      onChange={(e) => setFormData(prev => ({ ...prev, rescued: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                
                {/* Resources */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Resources Deployed</h4>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={newResource.type}
                      onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      {RESOURCE_TYPES.map(rt => (
                        <option key={rt.value} value={rt.value}>{rt.icon} {rt.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Count"
                      value={newResource.count}
                      onChange={(e) => setNewResource(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., Navy, Army)"
                      value={newResource.unit}
                      onChange={(e) => setNewResource(prev => ({ ...prev, unit: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button type="button" onClick={addResource} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {formData.resources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.resources.map((res, index) => {
                        const rt = RESOURCE_TYPES.find(r => r.value === res.type);
                        return (
                          <div key={index} className="px-3 py-1.5 bg-gray-100 rounded-full flex items-center gap-2 text-sm">
                            {rt?.icon} {res.count}x {rt?.label} {res.unit && `(${res.unit})`}
                            <button type="button" onClick={() => removeResource(index)} className="hover:bg-gray-200 rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Personnel */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Personnel</h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newPersonnel.name}
                      onChange={(e) => setNewPersonnel(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={newPersonnel.role}
                      onChange={(e) => setNewPersonnel(prev => ({ ...prev, role: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Contact"
                      value={newPersonnel.contact}
                      onChange={(e) => setNewPersonnel(prev => ({ ...prev, contact: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button type="button" onClick={addPersonnel} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {formData.personnel.length > 0 && (
                    <div className="space-y-2">
                      {formData.personnel.map((person, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                          <span className="text-sm">{person.name} - {person.role} {person.contact && `(${person.contact})`}</span>
                          <button type="button" onClick={() => removePersonnel(index)} className="p-1 hover:bg-gray-200 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Mission Timeline</h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Add timeline event..."
                      value={newTimelineEvent}
                      onChange={(e) => setNewTimelineEvent(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button type="button" onClick={addTimelineEvent} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {formData.timeline.length > 0 && (
                    <div className="space-y-2 border-l-2 border-gray-300 pl-4 ml-2">
                      {formData.timeline.map((event, index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-[21px] w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="text-xs text-gray-500">{new Date(event.time).toLocaleTimeString()}</div>
                          <div className="text-sm">{event.event}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {editingMission ? 'Update Mission' : 'Create Mission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Missions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Siren className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No rescue missions active.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Create First Mission
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {missions
            .sort((a, b) => a.priority - b.priority)
            .map((mission) => {
              const statusInfo = MISSION_STATUS[mission.status];
              const StatusIcon = statusInfo?.icon || Clock;
              
              return (
                <div key={mission.id} className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
                  mission.priority === 1 ? 'border-red-500' :
                  mission.priority === 2 ? 'border-orange-500' :
                  mission.priority === 3 ? 'border-yellow-500' :
                  'border-green-500'
                }`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          Mission #{mission.id?.slice(-6).toUpperCase()}
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 ${statusInfo?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo?.label}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {mission.locationDesc || `${mission.latitude}, ${mission.longitude}`}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {mission.rescued} / {mission.reportedTrapped}
                        </div>
                        <div className="text-xs text-gray-500">Rescued</div>
                      </div>
                    </div>
                    
                    {/* Resources */}
                    {mission.resources?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {mission.resources.map((res, idx) => {
                          const rt = RESOURCE_TYPES.find(r => r.value === res.type);
                          return (
                            <div key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs flex items-center gap-1">
                              {rt?.icon} {res.count}x {rt?.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t">
                      <div className="flex gap-2">
                        {mission.status === 'PLANNED' && (
                          <button
                            onClick={() => updateMissionStatus(mission.id, 'IN_PROGRESS')}
                            className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-1"
                          >
                            <Play className="w-4 h-4" /> Start
                          </button>
                        )}
                        {mission.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateMissionStatus(mission.id, 'COMPLETED')}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Complete
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => editMission(mission)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDelete(mission.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default RescueMissionManager;
