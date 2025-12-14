import React, { useState, useEffect } from 'react';
import { 
  Siren, Truck, Ship, Plane, Users, MapPin,
  Plus, Edit, Trash2, Save, X, Clock,
  CheckCircle, AlertTriangle, Play, Pause
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://152.42.185.253:3001/api';

const MISSION_STATUS = {
  PLANNED: { label: 'Planned', color: 'info', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'warning', icon: Play },
  COMPLETED: { label: 'Completed', color: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'error', icon: X }
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

export const RescueMissionManager = ({ token }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [formData, setFormData] = useState(initialMissionForm);
  const [newResource, setNewResource] = useState({ type: 'boat', count: 1, unit: '' });
  const [newPersonnel, setNewPersonnel] = useState({ name: '', role: '', contact: '' });
  const [newTimelineEvent, setNewTimelineEvent] = useState('');
  
  useEffect(() => {
    fetchMissions();
  }, []);
  
  const fetchMissions = async () => {
    try {
      const response = await fetch(`${API_URL}/rescue-missions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingMission 
        ? `${API_URL}/rescue-missions/${editingMission.id}`
        : `${API_URL}/rescue-missions`;
      
      const response = await fetch(url, {
        method: editingMission ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchMissions();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save mission:', error);
    }
  };
  
  const updateMissionStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/rescue-missions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchMissions();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rescue mission?')) return;
    
    try {
      await fetch(`${API_URL}/rescue-missions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMissions();
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Siren className="w-7 h-7 text-error animate-pulse" />
          Rescue Mission Control
        </h2>
        <button onClick={() => setShowForm(true)} className="btn btn-error gap-2">
          <Plus className="w-5 h-5" />
          New Mission
        </button>
      </div>
      
      {/* Mission Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <button onClick={resetForm} className="btn btn-sm btn-circle absolute right-2 top-2">
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-lg mb-4">
              {editingMission ? 'Edit Rescue Mission' : 'Create Rescue Mission'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Priority Level *</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="select select-bordered"
                    required
                  >
                    <option value={1}>🔴 Critical - Immediate</option>
                    <option value={2}>🟠 High - Urgent</option>
                    <option value={3}>🟡 Medium - Important</option>
                    <option value={4}>🟢 Low - When Available</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="select select-bordered"
                  >
                    {Object.entries(MISSION_STATUS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude *</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="input input-bordered"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude *</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="input input-bordered"
                    required
                  />
                </div>
                
                <div className="form-control col-span-2">
                  <label className="label">
                    <span className="label-text">Location Description</span>
                  </label>
                  <input
                    type="text"
                    value={formData.locationDesc}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationDesc: e.target.value }))}
                    placeholder="e.g., Near Kahawatta Temple, Main Road"
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reported Trapped</span>
                  </label>
                  <input
                    type="number"
                    value={formData.reportedTrapped}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedTrapped: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Rescued So Far</span>
                  </label>
                  <input
                    type="number"
                    value={formData.rescued}
                    onChange={(e) => setFormData(prev => ({ ...prev, rescued: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
              </div>
              
              {/* Resources */}
              <div className="divider">Resources Deployed</div>
              <div className="flex gap-2 mb-4">
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                  className="select select-bordered"
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
                  className="input input-bordered w-20"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g., Navy, Army)"
                  value={newResource.unit}
                  onChange={(e) => setNewResource(prev => ({ ...prev, unit: e.target.value }))}
                  className="input input-bordered flex-1"
                />
                <button type="button" onClick={addResource} className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {formData.resources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.resources.map((res, index) => {
                    const rt = RESOURCE_TYPES.find(r => r.value === res.type);
                    return (
                      <div key={index} className="badge badge-lg gap-2">
                        {rt?.icon} {res.count}x {rt?.label} {res.unit && `(${res.unit})`}
                        <button type="button" onClick={() => removeResource(index)} className="btn btn-ghost btn-xs">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Personnel */}
              <div className="divider">Personnel</div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newPersonnel.name}
                  onChange={(e) => setNewPersonnel(prev => ({ ...prev, name: e.target.value }))}
                  className="input input-bordered flex-1"
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={newPersonnel.role}
                  onChange={(e) => setNewPersonnel(prev => ({ ...prev, role: e.target.value }))}
                  className="input input-bordered"
                />
                <input
                  type="text"
                  placeholder="Contact"
                  value={newPersonnel.contact}
                  onChange={(e) => setNewPersonnel(prev => ({ ...prev, contact: e.target.value }))}
                  className="input input-bordered"
                />
                <button type="button" onClick={addPersonnel} className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {formData.personnel.length > 0 && (
                <div className="space-y-2">
                  {formData.personnel.map((person, index) => (
                    <div key={index} className="flex items-center justify-between bg-base-300 p-2 rounded">
                      <span>{person.name} - {person.role} {person.contact && `(${person.contact})`}</span>
                      <button type="button" onClick={() => removePersonnel(index)} className="btn btn-ghost btn-xs">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Timeline */}
              <div className="divider">Mission Timeline</div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add timeline event..."
                  value={newTimelineEvent}
                  onChange={(e) => setNewTimelineEvent(e.target.value)}
                  className="input input-bordered flex-1"
                />
                <button type="button" onClick={addTimelineEvent} className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {formData.timeline.length > 0 && (
                <ul className="timeline timeline-vertical timeline-compact">
                  {formData.timeline.map((event, index) => (
                    <li key={index}>
                      <div className="timeline-start text-xs">
                        {new Date(event.time).toLocaleTimeString()}
                      </div>
                      <div className="timeline-middle">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                      </div>
                      <div className="timeline-end timeline-box">
                        {event.event}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="modal-action">
                <button type="button" onClick={resetForm} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-error gap-2">
                  <Save className="w-4 h-4" />
                  {editingMission ? 'Update Mission' : 'Create Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Missions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          <Siren className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No rescue missions active.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-error mt-4">
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
                <div key={mission.id} className={`card bg-base-200 shadow-xl border-l-4 ${
                  mission.priority === 1 ? 'border-error' :
                  mission.priority === 2 ? 'border-warning' :
                  mission.priority === 3 ? 'border-info' :
                  'border-success'
                }`}>
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="card-title">
                          Mission #{mission.id?.slice(-6).toUpperCase()}
                          <div className={`badge badge-${statusInfo?.color}`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {statusInfo?.label}
                          </div>
                        </h3>
                        <p className="text-sm text-base-content/60 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {mission.locationDesc || `${mission.latitude}, ${mission.longitude}`}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-error">
                          {mission.rescued} / {mission.reportedTrapped}
                        </div>
                        <div className="text-xs text-base-content/60">Rescued</div>
                      </div>
                    </div>
                    
                    {/* Resources */}
                    {mission.resources?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {mission.resources.map((res, idx) => {
                          const rt = RESOURCE_TYPES.find(r => r.value === res.type);
                          return (
                            <div key={idx} className="badge badge-outline gap-1">
                              {rt?.icon} {res.count}x {rt?.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="card-actions justify-between mt-4">
                      <div className="flex gap-2">
                        {mission.status === 'PLANNED' && (
                          <button
                            onClick={() => updateMissionStatus(mission.id, 'IN_PROGRESS')}
                            className="btn btn-sm btn-warning gap-1"
                          >
                            <Play className="w-4 h-4" /> Start
                          </button>
                        )}
                        {mission.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateMissionStatus(mission.id, 'COMPLETED')}
                            className="btn btn-sm btn-success gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Complete
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => editMission(mission)} className="btn btn-sm btn-ghost gap-1">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDelete(mission.id)} className="btn btn-sm btn-ghost text-error gap-1">
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
