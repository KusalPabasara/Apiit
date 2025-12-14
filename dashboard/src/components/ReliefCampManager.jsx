import React, { useState, useEffect } from 'react';
import { 
  Tent, Users, Baby, Heart, Pill, 
  Plus, Edit, Trash2, Save, X,
  Package, Droplet, UtensilsCrossed,
  User, Stethoscope, Shield
} from 'lucide-react';

// Use relative URL for API
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

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

// Mock data for demonstration
const mockCamps = [
  {
    id: 'camp-001',
    name: 'Ratnapura Central Relief Camp',
    latitude: 6.6828,
    longitude: 80.3992,
    address: 'Near Town Hall, Ratnapura',
    capacity: 200,
    currentOccupancy: 145,
    children: 35,
    elderly: 22,
    pregnant: 8,
    disabled: 5,
    infants: 12,
    supplies: { rice: 500, dryRations: 200, water: 1000, medicine: 150, clothing: 80, bedding: 100 },
    medicineNeeds: [{ name: 'Insulin', quantity: 20, urgency: 'critical' }],
    status: 'ACTIVE'
  },
  {
    id: 'camp-002',
    name: 'Kahawatta School Camp',
    latitude: 6.6234,
    longitude: 80.4567,
    address: 'Kahawatta Public School',
    capacity: 150,
    currentOccupancy: 142,
    children: 45,
    elderly: 18,
    pregnant: 6,
    disabled: 3,
    infants: 8,
    supplies: { rice: 200, dryRations: 100, water: 500, medicine: 50, clothing: 40, bedding: 60 },
    medicineNeeds: [{ name: 'Antibiotics', quantity: 50, urgency: 'urgent' }],
    status: 'FULL'
  },
  {
    id: 'camp-003',
    name: 'Elapatha Community Center',
    latitude: 6.7123,
    longitude: 80.4156,
    address: 'Elapatha Junction',
    capacity: 100,
    currentOccupancy: 67,
    children: 20,
    elderly: 10,
    pregnant: 4,
    disabled: 2,
    infants: 5,
    supplies: { rice: 300, dryRations: 150, water: 800, medicine: 80, clothing: 50, bedding: 70 },
    medicineNeeds: [],
    status: 'ACTIVE'
  }
];

export const ReliefCampManager = ({ token }) => {
  const [camps, setCamps] = useState(mockCamps);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [formData, setFormData] = useState(initialCampForm);
  const [newMedicineNeed, setNewMedicineNeed] = useState({ name: '', quantity: 0, urgency: 'normal' });
  
  const fetchCamps = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/relief-camps`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setCamps(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch camps, using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For demo, just add to local state
    if (editingCamp) {
      setCamps(prev => prev.map(c => c.id === editingCamp.id ? { ...formData, id: editingCamp.id } : c));
    } else {
      setCamps(prev => [...prev, { ...formData, id: `camp-${Date.now()}` }]);
    }
    resetForm();
    
    // Try API call in background
    try {
      const url = editingCamp 
        ? `${getApiUrl()}/relief-camps/${editingCamp.id}`
        : `${getApiUrl()}/relief-camps`;
      
      await fetch(url, {
        method: editingCamp ? 'PUT' : 'POST',
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
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this relief camp?')) return;
    
    setCamps(prev => prev.filter(c => c.id !== id));
    
    try {
      await fetch(`${getApiUrl()}/relief-camps/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
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

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Tent className="w-7 h-7 text-blue-600" />
          Relief Camp Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Camp
        </button>
      </div>
      
      {/* Camp Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {editingCamp ? 'Edit Relief Camp' : 'Add New Relief Camp'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Camp Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="FULL">Full</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
                
                {/* Demographics */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Demographics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Users className="w-4 h-4" /> Total Occupancy
                      </label>
                      <input
                        type="number"
                        value={formData.currentOccupancy}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentOccupancy: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Children (0-12)</label>
                      <input
                        type="number"
                        value={formData.children}
                        onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Elderly (65+)</label>
                      <input
                        type="number"
                        value={formData.elderly}
                        onChange={(e) => setFormData(prev => ({ ...prev, elderly: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Heart className="w-4 h-4" /> Pregnant Women
                      </label>
                      <input
                        type="number"
                        value={formData.pregnant}
                        onChange={(e) => setFormData(prev => ({ ...prev, pregnant: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Disabled/Special</label>
                      <input
                        type="number"
                        value={formData.disabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, disabled: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Baby className="w-4 h-4" /> Infants
                      </label>
                      <input
                        type="number"
                        value={formData.infants}
                        onChange={(e) => setFormData(prev => ({ ...prev, infants: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Supplies */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Supplies Inventory</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <UtensilsCrossed className="w-4 h-4" /> Rice (kg)
                      </label>
                      <input
                        type="number"
                        value={formData.supplies.rice}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplies: { ...prev.supplies, rice: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Package className="w-4 h-4" /> Dry Rations
                      </label>
                      <input
                        type="number"
                        value={formData.supplies.dryRations}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplies: { ...prev.supplies, dryRations: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Droplet className="w-4 h-4" /> Water (L)
                      </label>
                      <input
                        type="number"
                        value={formData.supplies.water}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplies: { ...prev.supplies, water: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Pill className="w-4 h-4" /> Medicine
                      </label>
                      <input
                        type="number"
                        value={formData.supplies.medicine}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplies: { ...prev.supplies, medicine: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Clothing</label>
                      <input
                        type="number"
                        value={formData.supplies.clothing}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplies: { ...prev.supplies, clothing: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Bedding</label>
                      <input
                        type="number"
                        value={formData.supplies.bedding}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          supplies: { ...prev.supplies, bedding: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Medicine Needs */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Special Medicine Needs</h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={newMedicineNeed.name}
                      onChange={(e) => setNewMedicineNeed(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={newMedicineNeed.quantity}
                      onChange={(e) => setNewMedicineNeed(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={newMedicineNeed.urgency}
                      onChange={(e) => setNewMedicineNeed(prev => ({ ...prev, urgency: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button type="button" onClick={addMedicineNeed} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {formData.medicineNeeds.length > 0 && (
                    <div className="space-y-2">
                      {formData.medicineNeeds.map((need, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                          need.urgency === 'critical' ? 'bg-red-100' :
                          need.urgency === 'urgent' ? 'bg-orange-100' :
                          'bg-gray-100'
                        }`}>
                          <span className="text-sm">{need.name} - {need.quantity} units ({need.urgency})</span>
                          <button
                            type="button"
                            onClick={() => removeMedicineNeed(index)}
                            className="p-1 hover:bg-white/50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {editingCamp ? 'Update Camp' : 'Create Camp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Camps Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : camps.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Tent className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No relief camps registered yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add First Camp
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {camps.map((camp) => (
            <div key={camp.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800">{camp.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    camp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    camp.status === 'FULL' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {camp.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">{camp.address}</p>
                
                {/* Occupancy Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Occupancy</span>
                    <span className="font-medium">{camp.currentOccupancy} / {camp.capacity}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        camp.currentOccupancy / camp.capacity > 0.9 ? 'bg-red-500' :
                        camp.currentOccupancy / camp.capacity > 0.7 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((camp.currentOccupancy / camp.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Demographics */}
                <div className="grid grid-cols-5 gap-1 text-center text-xs mb-3">
                  <div className="bg-gray-100 rounded p-1.5">
                    <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-gray-600" />
                    <div className="font-bold text-gray-800">{camp.children}</div>
                    <div className="text-gray-500 text-[10px]">Kids</div>
                  </div>
                  <div className="bg-gray-100 rounded p-1.5">
                    <User className="w-3.5 h-3.5 mx-auto mb-0.5 text-gray-600" />
                    <div className="font-bold text-gray-800">{camp.elderly}</div>
                    <div className="text-gray-500 text-[10px]">Elderly</div>
                  </div>
                  <div className="bg-gray-100 rounded p-1.5">
                    <Heart className="w-3.5 h-3.5 mx-auto mb-0.5 text-pink-500" />
                    <div className="font-bold text-gray-800">{camp.pregnant}</div>
                    <div className="text-gray-500 text-[10px]">Pregnant</div>
                  </div>
                  <div className="bg-gray-100 rounded p-1.5">
                    <Shield className="w-3.5 h-3.5 mx-auto mb-0.5 text-gray-600" />
                    <div className="font-bold text-gray-800">{camp.disabled}</div>
                    <div className="text-gray-500 text-[10px]">Special</div>
                  </div>
                  <div className="bg-gray-100 rounded p-1.5">
                    <Baby className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-500" />
                    <div className="font-bold text-gray-800">{camp.infants}</div>
                    <div className="text-gray-500 text-[10px]">Infants</div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => editCamp(camp)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
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
