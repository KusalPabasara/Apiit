import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  X, 
  Check,
  Construction,
  Locate
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDeviceStore } from '../stores/deviceStore';
import { useAuth } from '../context/AuthContextV2';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { db } from '../db/database';
import locationService from '../services/locationService';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const OBSTRUCTION_TYPES = [
  { value: 'debris', label: 'Debris' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'flood', label: 'Flooding' },
  { value: 'fallen_tree', label: 'Fallen Tree' },
  { value: 'collapsed_bridge', label: 'Collapsed Bridge' },
  { value: 'accident', label: 'Vehicle Accident' },
  { value: 'other', label: 'Other' }
];

const SEVERITY_OPTIONS = [
  { value: 'blocked', label: 'Completely Blocked', color: 'bg-red-500' },
  { value: 'restricted', label: 'Restricted - Limited access', color: 'bg-orange-500' },
  { value: 'hazardous', label: 'Hazardous - Proceed with caution', color: 'bg-yellow-500' },
  { value: 'minor', label: 'Minor obstruction', color: 'bg-green-500' }
];

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to update map center when GPS location is detected
function MapCenterUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] !== 6.6828 && center[1] !== 80.3992) {
      // Only update if not default Ratnapura - center on GPS location
      map.setView(center, 14);
      console.log('🗺️ Map centered on GPS location:', center);
    }
  }, [center, map]);
  
  return null;
}

// Center map on user location
function LocationButton({ onLocate }) {
  const map = useMap();
  
  const handleLocate = async () => {
    try {
      const location = await locationService.getCurrentLocation({
        useCache: true,
        fastMode: true,
        allowOfflineGPS: true
      });
      
      map.setView([location.latitude, location.longitude], 15);
      onLocate({ lat: location.latitude, lng: location.longitude });
    } catch (error) {
      console.warn('Location error:', error);
    }
  };
  
  return (
    <button
      onClick={handleLocate}
      className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
      title="Center on my location"
    >
      <Locate className="w-5 h-5 text-blue-600" />
    </button>
  );
}

function BlockedRoadsPage() {
  const navigate = useNavigate();
  const { deviceId } = useDeviceStore();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Map state
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [mapCenter, setMapCenter] = useState([6.6828, 80.3992]); // Default Ratnapura
  
  // Form state
  const [obstructionType, setObstructionType] = useState('debris');
  const [severity, setSeverity] = useState('restricted');
  const [affectedLength, setAffectedLength] = useState('');
  const [clearanceEstimate, setClearanceEstimate] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  const fileInputRef = useRef(null);

  // Get current location on mount - use cache first for instant display, then update with fresh GPS
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        // Step 1: Get cached location immediately (instant display)
        const cachedLocation = await locationService.getCachedLocation();
        if (cachedLocation) {
          const cachedLoc = {
            lat: cachedLocation.latitude,
            lng: cachedLocation.longitude
          };
          
          // Use cached location immediately
          setMapCenter([cachedLocation.latitude, cachedLocation.longitude]);
          setStartPoint(cachedLoc);
          console.log('📍 Using cached location instantly:', cachedLoc);
        }
        
        // Step 2: Try to get fresh GPS location in background (non-blocking)
        const freshLocation = await locationService.getCurrentLocation({
          useCache: true, // Still use cache if GPS is slow
          fastMode: true, // Quick timeout
          allowOfflineGPS: true
        });
        
        // Update with fresh location if different from cached
        if (freshLocation && (!cachedLocation || 
            Math.abs(freshLocation.latitude - cachedLocation.latitude) > 0.0001 ||
            Math.abs(freshLocation.longitude - cachedLocation.longitude) > 0.0001)) {
          
          const freshLoc = {
            lat: freshLocation.latitude,
            lng: freshLocation.longitude
          };
          
          // Update map center and start point with fresh GPS
          setMapCenter([freshLocation.latitude, freshLocation.longitude]);
          setStartPoint(freshLoc);
          console.log('📍 Updated with fresh GPS location:', freshLoc);
        }
      } catch (error) {
        console.warn('Location error:', error.message);
        // If everything fails, use default Ratnapura
        const defaultLoc = { lat: 6.6828, lng: 80.3992 };
        setMapCenter([6.6828, 80.3992]);
        setStartPoint(defaultLoc);
      }
    };
    getInitialLocation();
  }, []);

  // Handle map click - only for optional end point
  const handleMapClick = (latlng) => {
    // Start point is already set from GPS, so only allow setting end point
    if (!endPoint) {
      setEndPoint(latlng);
    } else {
      // Update end point
      setEndPoint(latlng);
    }
  };

  // Photo handling
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
    // Start point should be automatically set from GPS
    if (!startPoint) {
      console.error('Start point not set - GPS may have failed');
      alert('Unable to get your location. Please try again.');
      return;
    }

    setIsSubmitting(true);

    const reportData = {
      id: `blocked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      device_id: deviceId,
      responder_name: user?.displayName || user?.email || 'Unknown',
      responder_email: user?.email || null,
      responder_uid: user?.uid || null,
      start_lat: startPoint.lat,
      start_lng: startPoint.lng,
      end_lat: endPoint?.lat || null,
      end_lng: endPoint?.lng || null,
      obstruction_type: obstructionType,
      severity,
      affected_length: affectedLength ? parseInt(affectedLength) : null,
      clearance_estimate: clearanceEstimate || null,
      description: description || null,
      photos: photos.length > 0 ? photos : null,
      status: 'reported',
      created_at: new Date().toISOString(),
      synced: 0
    };

    try {
      // Save to IndexedDB first
      await db.blockedRoads.add(reportData);
      console.log('💾 Blocked road report saved to IndexedDB');

      // Try to sync immediately if online
      if (isOnline) {
        const response = await fetch(`${getApiUrl()}/blocked-roads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });

        if (response.ok) {
          await db.blockedRoads.update(reportData.id, { synced: 1 });
          console.log('✅ Blocked road report synced to server');
          setSavedOffline(false);
        } else {
          setSavedOffline(true);
        }
      } else {
        setSavedOffline(true);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('❌ Failed to save report:', error);
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
            {savedOffline ? 'Saved Offline' : 'Report Submitted'}
          </h2>
          <p className="text-slate-400 mb-6">
            {savedOffline 
              ? 'Your report will be sent when online'
              : 'Blocked road report sent to traffic management'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600"
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
      <header className="sticky top-0 z-[9999] bg-amber-500 px-4 py-3 flex items-center gap-3 shadow-lg">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-amber-600 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Report Blocked Road</h1>
          <p className="text-amber-200 text-xs">Location detected automatically</p>
        </div>
      </header>

      {/* Form Content */}
      <div className="p-4 pb-24 space-y-5">
        {/* Map */}
        <div className="relative rounded-xl overflow-hidden border border-slate-700" style={{ height: '250px' }}>
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            <MapCenterUpdater center={mapCenter} />
            <LocationButton onLocate={(loc) => {
              setMapCenter([loc.lat, loc.lng]);
              if (!startPoint) {
                setStartPoint(loc);
              }
            }} />
            
            {startPoint && (
              <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />
            )}
            {endPoint && (
              <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon} />
            )}
            {startPoint && endPoint && (
              <Polyline
                positions={[[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]]}
                color="red"
                weight={4}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        </div>

        {/* Map Instructions */}
        <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
          <p className="text-blue-400 text-sm">
            💡 Your current location is automatically marked as the road block location.
            {!endPoint && ' Click on the map to mark the end location (optional).'}
          </p>
          {startPoint && (
            <p className="text-emerald-400 text-xs mt-1">
              ✓ Road Block Location (GPS): {startPoint.lat.toFixed(6)}, {startPoint.lng.toFixed(6)}
            </p>
          )}
          {endPoint && (
            <p className="text-red-400 text-xs mt-1">
              ✓ End: {endPoint.lat.toFixed(6)}, {endPoint.lng.toFixed(6)}
            </p>
          )}
        </div>

        {/* Obstruction Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Obstruction Type *
          </label>
          <select
            value={obstructionType}
            onChange={(e) => setObstructionType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {OBSTRUCTION_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Severity *
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {SEVERITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Affected Length */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Affected Length (meters, optional)
          </label>
          <input
            type="number"
            value={affectedLength}
            onChange={(e) => setAffectedLength(e.target.value)}
            placeholder="e.g., 50"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Clearance Estimate */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Clearance Estimate (optional)
          </label>
          <input
            type="text"
            value={clearanceEstimate}
            onChange={(e) => setClearanceEstimate(e.target.value)}
            placeholder="e.g., 2-3 hours, 1 day..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Photos ({photos.length} selected)
          </label>
          
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
          disabled={isSubmitting}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
            isSubmitting
              ? 'bg-amber-500/50 text-amber-300 cursor-not-allowed'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Construction className="w-5 h-5" />
              Save Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default BlockedRoadsPage;

