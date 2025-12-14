import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Camera, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Loader2,
  CheckCircle,
  WifiOff,
  ChevronDown
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuthStore } from '../stores/authStore';
import { db } from '../db/database';
import LZString from 'lz-string';
import SafetyAdvisory from './SafetyAdvisory';

// Get API URL - Returns relative path /api which browser resolves with current protocol
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const DISASTER_TYPES = [
  'FLOOD',
  'LANDSLIDE',
  'ROAD_BLOCK',
  'POWER_LINE',
  'BUILDING_COLLAPSE',
  'FIRE',
  'OTHER'
];

const SEVERITY_LEVELS = [1, 2, 3, 4, 5];

export const DisasterReportForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, deviceId } = useAuthStore();
  const { location, loading: locationLoading, getCurrentPosition } = useGeolocation();
  const { isOnline, isPoorConnection } = useNetworkStatus();
  
  const [formData, setFormData] = useState({
    type: '',
    severity: 3,
    peopleCount: '',
    description: '',
    specialNeeds: '',
    contactNumber: ''
  });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOffline, setSubmittedOffline] = useState(false);
  const [error, setError] = useState(null);
  
  // Refresh location on mount
  useEffect(() => {
    getCurrentPosition().catch(() => {});
  }, []);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle photo capture
  const handlePhotoCapture = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        setPhotos(prev => [...prev, compressed]);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }
  };
  
  // Compress image
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const maxHeight = 800;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  // Remove photo
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  // Submit report
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type) {
      setError(t('report.type') + ' required');
      return;
    }
    
    if (!location) {
      setError(t('report.gettingLocation'));
      await getCurrentPosition();
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    const reportId = uuidv4();
    const report = {
      id: reportId,
      localId: reportId,
      ...formData,
      peopleCount: parseInt(formData.peopleCount) || 0,
      severity: parseInt(formData.severity),
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      photos: isPoorConnection ? [] : photos, // Skip photos on poor connection
      timestamp: Date.now(),
      deviceId,
      syncStatus: 0
    };
    
    // Always store locally first
    try {
      await db.reports.put(report);
    } catch (err) {
      console.error('Failed to store report locally:', err);
    }
    
    // Try to send to server if online
    if (isOnline) {
      try {
        const response = await fetch(`${getApiUrl()}/incidents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(report)
        });
        
        if (response.ok) {
          await db.reports.update(reportId, { syncStatus: 1 });
          setSubmitted(true);
          setSubmittedOffline(false);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        console.error('Failed to send report:', err);
        setSubmitted(true);
        setSubmittedOffline(true);
      }
    } else {
      setSubmitted(true);
      setSubmittedOffline(true);
    }
    
    setSubmitting(false);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      type: '',
      severity: 3,
      peopleCount: '',
      description: '',
      specialNeeds: '',
      contactNumber: ''
    });
    setPhotos([]);
    setSubmitted(false);
    setSubmittedOffline(false);
    setError(null);
  };
  
  // Show success screen with advisory
  if (submitted) {
    return (
      <div className="p-4">
        <div className={`rounded-2xl p-6 mb-6 ${submittedOffline ? 'bg-warning/20' : 'bg-success/20'}`}>
          <div className="text-center mb-4">
            {submittedOffline ? (
              <WifiOff className="w-16 h-16 text-warning mx-auto mb-2" />
            ) : (
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-2" />
            )}
            <h2 className="text-xl font-bold">
              {submittedOffline ? t('report.offline') : t('report.success')}
            </h2>
          </div>
        </div>
        
        {/* Safety Advisory */}
        {formData.type && (
          <SafetyAdvisory disasterType={formData.type} />
        )}
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={resetForm}
            className="btn btn-primary flex-1"
          >
            {t('report.title')} Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost flex-1"
          >
            {t('nav.home')}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">{t('report.title')}</h2>
      
      {/* Location Status */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${
        location ? 'bg-success/20' : 'bg-warning/20'
      }`}>
        <MapPin className="w-5 h-5" />
        <span className="text-sm flex-1">
          {locationLoading ? t('report.gettingLocation') :
           location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` :
           'Location unavailable'}
        </span>
        {locationLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
      
      {/* Disaster Type */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{t('report.type')} *</span>
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="select select-bordered w-full"
          required
        >
          <option value="">{t('report.type')}...</option>
          {DISASTER_TYPES.map(type => (
            <option key={type} value={type}>
              {t(`disasterTypes.${type}`)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Severity Level */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{t('report.severity')} *</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {SEVERITY_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, severity: level }))}
              className={`btn btn-sm ${
                formData.severity === level
                  ? level <= 2 ? 'btn-error' : level === 3 ? 'btn-warning' : 'btn-success'
                  : 'btn-ghost'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <label className="label">
          <span className="label-text-alt text-base-content/70">
            {t(`severity.${formData.severity}`)}
          </span>
        </label>
      </div>
      
      {/* People Count */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{t('report.peopleCount')}</span>
        </label>
        <div className="join">
          <span className="join-item btn btn-ghost">
            <Users className="w-5 h-5" />
          </span>
          <input
            type="number"
            name="peopleCount"
            value={formData.peopleCount}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className="input input-bordered join-item flex-1"
          />
        </div>
      </div>
      
      {/* Photos (only show on good connection) */}
      {!isPoorConnection && (
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('report.photos')}</span>
            <span className="label-text-alt">Optional</span>
          </label>
          
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <label className="btn btn-outline">
            <Camera className="w-5 h-5 mr-2" />
            {t('report.photos')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>
        </div>
      )}
      
      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{t('report.description')}</span>
          <span className="label-text-alt">Optional</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('report.description')}
          className="textarea textarea-bordered h-24"
        />
      </div>
      
      {/* Special Needs */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{t('report.specialNeeds')}</span>
          <span className="label-text-alt">Optional</span>
        </label>
        <input
          type="text"
          name="specialNeeds"
          value={formData.specialNeeds}
          onChange={handleChange}
          placeholder="Medical, Food, Rescue..."
          className="input input-bordered"
        />
      </div>
      
      {/* Contact Number */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">{t('report.contact')}</span>
          <span className="label-text-alt">Optional</span>
        </label>
        <input
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="07X XXX XXXX"
          className="input input-bordered"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || !formData.type}
        className="btn btn-primary w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {t('report.submitting')}
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            {t('report.submit')}
          </>
        )}
      </button>
    </form>
  );
};

export default DisasterReportForm;
