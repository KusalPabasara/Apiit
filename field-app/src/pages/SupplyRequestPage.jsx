import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  X, 
  Check,
  Package,
  Droplet,
  UtensilsCrossed,
  Pill,
  Home,
  Flashlight,
  Heart,
  Battery
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { useAuth } from '../context/AuthContextV2';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { db } from '../db/database';
import locationService from '../services/locationService';

const SUPPLY_ITEMS = [
  { id: 'water', label: 'Water', icon: Droplet, color: 'text-blue-500' },
  { id: 'food', label: 'Food', icon: UtensilsCrossed, color: 'text-orange-500' },
  { id: 'medical', label: 'Medical Supplies', icon: Pill, color: 'text-red-500' },
  { id: 'blankets', label: 'Blankets', icon: Home, color: 'text-purple-500' },
  { id: 'shelter', label: 'Shelter Materials', icon: Home, color: 'text-green-500' },
  { id: 'batteries', label: 'Batteries', icon: Battery, color: 'text-yellow-500' },
  { id: 'flashlights', label: 'Flashlights', icon: Flashlight, color: 'text-amber-500' },
  { id: 'firstaid', label: 'First Aid', icon: Heart, color: 'text-pink-500' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' }
];

function SupplyRequestPage() {
  const navigate = useNavigate();
  const { deviceId } = useDeviceStore();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Form state
  const [priority, setPriority] = useState('medium');
  const [selectedSupplies, setSelectedSupplies] = useState([]);
  const [recipients, setRecipients] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  const fileInputRef = useRef(null);

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLocationStatus('loading');
    
    try {
      const location = await locationService.getCurrentLocation({
        useCache: true,
        fastMode: true,
        allowOfflineGPS: true
      });
      
      setLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        isDefault: location.isDefault || false
      });
      setLocationStatus(location.isDefault ? 'default' : 'success');
    } catch (error) {
      console.warn('Location error:', error.message);
      setLocation({ latitude: 6.6828, longitude: 80.3992, isDefault: true });
      setLocationStatus('default');
    }
  };

  const toggleSupply = (id) => {
    setSelectedSupplies(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Get API URL dynamically
  const getApiUrl = () => {
    if (import.meta.env.MODE === 'production') {
      return '/api';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  };

  const handleSubmit = async () => {
    if (selectedSupplies.length === 0) {
      alert('Please select at least one supply item');
      return;
    }

    setIsSubmitting(true);

    const requestData = {
      id: `supply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      device_id: deviceId,
      responder_name: user?.displayName || user?.email || 'Unknown',
      responder_email: user?.email || null,
      responder_uid: user?.uid || null,
      priority,
      supplies: selectedSupplies,
      recipients: recipients ? parseInt(recipients) : null,
      notes: notes || null,
      photos: photos.length > 0 ? photos : null,
      latitude: location?.latitude || 6.6828,
      longitude: location?.longitude || 80.3992,
      created_at: new Date().toISOString(),
      synced: 0
    };

    try {
      // Save to IndexedDB first
      await db.supplyRequests.add(requestData);
      console.log('💾 Supply request saved to IndexedDB');

      // Try to sync immediately if online
      if (isOnline) {
        const response = await fetch(`${getApiUrl()}/supply-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          // Mark as synced
          await db.supplyRequests.update(requestData.id, { synced: 1 });
          console.log('✅ Supply request synced to server');
          setSavedOffline(false);
        } else {
          setSavedOffline(true);
        }
      } else {
        setSavedOffline(true);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('❌ Failed to save supply request:', error);
      setSavedOffline(true);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            savedOffline ? 'bg-amber-500' : 'bg-emerald-500'
          }`}>
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {savedOffline ? 'Saved Offline' : 'Request Submitted'}
          </h2>
          <p className="text-slate-400 mb-6">
            {savedOffline 
              ? 'Your request will be sent when online'
              : 'Supply request sent to headquarters'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-[9999] bg-blue-600 px-4 py-3 flex items-center gap-3 shadow-lg">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-blue-700 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Request Supplies</h1>
          <p className="text-blue-200 text-xs">Select items and delivery location</p>
        </div>
        
        {/* Location Status */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          locationStatus === 'loading' ? 'bg-yellow-500/20 text-yellow-400' :
          locationStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
          'bg-amber-500/20 text-amber-400'
        }`}>
          <MapPin className="w-3 h-3" />
          <span className="hidden sm:inline">
            {locationStatus === 'loading' ? 'Getting GPS...' :
             locationStatus === 'success' ? 'GPS Ready' : 'Default Location'}
          </span>
        </div>
      </header>

      {/* Form Content */}
      <div className="p-4 pb-24 space-y-6">
        {/* Location Banner */}
        <div className={`p-3 rounded-xl flex items-center gap-2 ${
          location?.isDefault 
            ? 'bg-amber-500/20 border border-amber-500/30' 
            : 'bg-emerald-500/20 border border-emerald-500/30'
        }`}>
          <MapPin className={`w-5 h-5 ${location?.isDefault ? 'text-amber-400' : 'text-emerald-400'}`} />
          <span className={`text-sm ${location?.isDefault ? 'text-amber-400' : 'text-emerald-400'}`}>
            {locationStatus === 'loading' ? 'Getting GPS location...' :
             location?.isDefault ? 'Using default location (Ratnapura)' :
             `GPS: ${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}`}
          </span>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Overall Priority *
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Supply Items Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Supplies *
          </label>
          <div className="space-y-2">
            {SUPPLY_ITEMS.map(item => {
              const Icon = item.icon;
              const isSelected = selectedSupplies.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSupply(item.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-blue-500/20 border-blue-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-blue-500' : 'bg-slate-700'
                  }`}>
                    {isSelected ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Number of Recipients */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Recipients (Optional)
          </label>
          <input
            type="number"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="Estimated number of people"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions or additional details..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Photos ({photos.length} selected)
          </label>
          
          {/* Photo Preview */}
          {photos.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoAdd}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-slate-500 hover:text-slate-300 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Add Photos
          </button>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedSupplies.length === 0}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
            isSubmitting || selectedSupplies.length === 0
              ? 'bg-blue-500/50 text-blue-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Package className="w-5 h-5" />
              Save Request
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SupplyRequestPage;

