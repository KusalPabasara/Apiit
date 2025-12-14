import React, { useState, useEffect } from 'react';
import { 
  Tent, Users, Baby, Heart, Pill, 
  Plus, Edit, Trash2, Save, X,
  Package, Droplet, UtensilsCrossed,
  User, Stethoscope, Shield
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://152.42.185.253:3001/api';

const initialCampForm = {
  name: '',
  latitude: '',
  longitude: '',
  address: '',
  capacity: 100,
  currentOccupancy: 0,
  children: 0,
  elderly: 0,
  pregnant: 0,
  disabled: 0,
  infants: 0,
  supplies: {
    rice: 0,
    dryRations: 0,
    water: 0,
    medicine: 0,
    clothing: 0,
    bedding: 0
  },
  medicineNeeds: [],
  status: 'ACTIVE'
};

export const ReliefCampManager = ({ token }) => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [formData, setFormData] = useState(initialCampForm);
  const [newMedicineNeed, setNewMedicineNeed] = useState({ name: '', quantity: 0, urgency: 'normal' });
  
  useEffect(() => {
    fetchCamps();
  }, []);
  
  const fetchCamps = async () => {
    try {
      const response = await fetch(`${API_URL}/relief-camps`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCamps(data);
      }
    } catch (error) {
      console.error('Failed to fetch camps:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingCamp 
        ? `${API_URL}/relief-camps/${editingCamp.id}`
        : `${API_URL}/relief-camps`;
      
      const response = await fetch(url, {
        method: editingCamp ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchCamps();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save camp:', error);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this relief camp?')) return;
    
    try {
      await fetch(`${API_URL}/relief-camps/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchCamps();
    } catch (error) {
      console.error('Failed to delete camp:', error);
    }
  };
  
  const resetForm = () => {
    setFormData(initialCampForm);
    setEditingCamp(null);
    setShowForm(false);
  };
  
  const editCamp = (camp) => {
    setFormData({
      ...camp,
      supplies: camp.supplies || initialCampForm.supplies,
      medicineNeeds: camp.medicineNeeds || []
    });
    setEditingCamp(camp);
    setShowForm(true);
  };
  
  const addMedicineNeed = () => {
    if (newMedicineNeed.name && newMedicineNeed.quantity > 0) {
      setFormData(prev => ({
        ...prev,
        medicineNeeds: [...prev.medicineNeeds, { ...newMedicineNeed }]
      }));
      setNewMedicineNeed({ name: '', quantity: 0, urgency: 'normal' });
    }
  };
  
  const removeMedicineNeed = (index) => {
    setFormData(prev => ({
      ...prev,
      medicineNeeds: prev.medicineNeeds.filter((_, i) => i !== index)
    }));
  };
  
  const getTotalOccupants = (camp) => {
    return camp.children + camp.elderly + camp.pregnant + camp.disabled + camp.infants + 
           (camp.currentOccupancy - camp.children - camp.elderly - camp.pregnant - camp.disabled - camp.infants);
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tent className="w-7 h-7 text-primary" />
          Relief Camp Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Camp
        </button>
      </div>
      
      {/* Camp Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={resetForm}
              className="btn btn-sm btn-circle absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="font-bold text-lg mb-4">
              {editingCamp ? 'Edit Relief Camp' : 'Add New Relief Camp'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Camp Name *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input input-bordered"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Address</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="input input-bordered"
                  />
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
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Capacity</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    className="input input-bordered"
                  />
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
                    <option value="ACTIVE">Active</option>
                    <option value="FULL">Full</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
              
              {/* Demographics */}
              <div className="divider">Demographics</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <Users className="w-4 h-4" /> Total Occupancy
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.currentOccupancy}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentOccupancy: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Children (0-12)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.children}
                    onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Elderly (65+)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.elderly}
                    onChange={(e) => setFormData(prev => ({ ...prev, elderly: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <Heart className="w-4 h-4" /> Pregnant Women
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.pregnant}
                    onChange={(e) => setFormData(prev => ({ ...prev, pregnant: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Disabled/Special Needs</span>
                  </label>
                  <input
                    type="number"
                    value={formData.disabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, disabled: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <Baby className="w-4 h-4" /> Infants
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.infants}
                    onChange={(e) => setFormData(prev => ({ ...prev, infants: parseInt(e.target.value) || 0 }))}
                    className="input input-bordered"
                  />
                </div>
              </div>
              
              {/* Supplies */}
              <div className="divider">Supplies Inventory</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <UtensilsCrossed className="w-4 h-4" /> Rice (kg)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.supplies.rice}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      supplies: { ...prev.supplies, rice: parseInt(e.target.value) || 0 }
                    }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <Package className="w-4 h-4" /> Dry Rations (packs)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.supplies.dryRations}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      supplies: { ...prev.supplies, dryRations: parseInt(e.target.value) || 0 }
                    }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <Droplet className="w-4 h-4" /> Water (liters)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.supplies.water}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      supplies: { ...prev.supplies, water: parseInt(e.target.value) || 0 }
                    }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-1">
                      <Pill className="w-4 h-4" /> Medicine (units)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.supplies.medicine}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      supplies: { ...prev.supplies, medicine: parseInt(e.target.value) || 0 }
                    }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Clothing (sets)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.supplies.clothing}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      supplies: { ...prev.supplies, clothing: parseInt(e.target.value) || 0 }
                    }))}
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bedding (units)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.supplies.bedding}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      supplies: { ...prev.supplies, bedding: parseInt(e.target.value) || 0 }
                    }))}
                    className="input input-bordered"
                  />
                </div>
              </div>
              
              {/* Medicine Needs */}
              <div className="divider">Special Medicine Needs</div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Medicine name"
                  value={newMedicineNeed.name}
                  onChange={(e) => setNewMedicineNeed(prev => ({ ...prev, name: e.target.value }))}
                  className="input input-bordered flex-1"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newMedicineNeed.quantity}
                  onChange={(e) => setNewMedicineNeed(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="input input-bordered w-20"
                />
                <select
                  value={newMedicineNeed.urgency}
                  onChange={(e) => setNewMedicineNeed(prev => ({ ...prev, urgency: e.target.value }))}
                  className="select select-bordered"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
                <button type="button" onClick={addMedicineNeed} className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {formData.medicineNeeds.length > 0 && (
                <div className="space-y-2">
                  {formData.medicineNeeds.map((need, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded ${
                      need.urgency === 'critical' ? 'bg-error/20' :
                      need.urgency === 'urgent' ? 'bg-warning/20' :
                      'bg-base-300'
                    }`}>
                      <span>{need.name} - {need.quantity} units ({need.urgency})</span>
                      <button
                        type="button"
                        onClick={() => removeMedicineNeed(index)}
                        className="btn btn-ghost btn-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="modal-action">
                <button type="button" onClick={resetForm} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary gap-2">
                  <Save className="w-4 h-4" />
                  {editingCamp ? 'Update Camp' : 'Create Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Camps Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : camps.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          <Tent className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No relief camps registered yet.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
            Add First Camp
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {camps.map((camp) => (
            <div key={camp.id} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <h3 className="card-title text-lg">{camp.name}</h3>
                  <div className={`badge ${
                    camp.status === 'ACTIVE' ? 'badge-success' :
                    camp.status === 'FULL' ? 'badge-warning' :
                    'badge-error'
                  }`}>
                    {camp.status}
                  </div>
                </div>
                
                <p className="text-sm text-base-content/60">{camp.address}</p>
                
                {/* Occupancy Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Occupancy</span>
                    <span>{camp.currentOccupancy} / {camp.capacity}</span>
                  </div>
                  <progress 
                    className={`progress w-full ${
                      camp.currentOccupancy / camp.capacity > 0.9 ? 'progress-error' :
                      camp.currentOccupancy / camp.capacity > 0.7 ? 'progress-warning' :
                      'progress-success'
                    }`}
                    value={camp.currentOccupancy} 
                    max={camp.capacity}
                  ></progress>
                </div>
                
                {/* Demographics */}
                <div className="grid grid-cols-5 gap-2 mt-3 text-center text-xs">
                  <div className="bg-base-300 rounded p-2">
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-bold">{camp.children}</div>
                    <div className="text-base-content/60">Children</div>
                  </div>
                  <div className="bg-base-300 rounded p-2">
                    <User className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-bold">{camp.elderly}</div>
                    <div className="text-base-content/60">Elderly</div>
                  </div>
                  <div className="bg-base-300 rounded p-2">
                    <Heart className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-bold">{camp.pregnant}</div>
                    <div className="text-base-content/60">Pregnant</div>
                  </div>
                  <div className="bg-base-300 rounded p-2">
                    <Shield className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-bold">{camp.disabled}</div>
                    <div className="text-base-content/60">Special</div>
                  </div>
                  <div className="bg-base-300 rounded p-2">
                    <Baby className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-bold">{camp.infants}</div>
                    <div className="text-base-content/60">Infants</div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={() => editCamp(camp)}
                    className="btn btn-sm btn-ghost gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="btn btn-sm btn-ghost text-error gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReliefCampManager;
