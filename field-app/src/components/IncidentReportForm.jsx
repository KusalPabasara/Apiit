/**
 * INCIDENT REPORT FORM - Offline-First Data Collection
 * 
 * Hackathon Requirements:
 * - Works completely offline (in Airplane Mode)
 * - Stores in IndexedDB (Dexie.js)
 * - Required fields: Incident Type, Severity, GPS, Timestamp, Photo (optional)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Camera, 
  MapPin, 
  AlertTriangle, 
  Loader2,
  CheckCircle,
  WifiOff,
  X,
  ArrowLeft
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useDeviceStore } from '../stores/deviceStore';
import { useAuth } from '../context/AuthContext';
import { db, INCIDENT_TYPES, SEVERITY_LEVELS } from '../db/database';
import syncEngine from '../services/syncEngine';

// Auto-detect API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

export default function IncidentReportForm() {
  const navigate = useNavigate();
  const { deviceId, deviceName } = useDeviceStore();
  const { user } = useAuth();
  const { location, loading: locationLoading, error: locationError, getCurrentPosition, usingDefault } = useGeolocation();
  const { isOnline } = useNetworkStatus();
  
  // Form state
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error, setError] = useState(null);

  // Get GPS location on mount
  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Handle photo capture
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
    } catch (err) {
      console.error('Failed to process image:', err);
      setError('Failed to process photo');
    }
  };

  // Compress image to reduce storage size
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let { width, height } = img;
          
          if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Submit report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!type) {
      setError('Please select an incident type');
      return;
    }

    if (!location) {
      setError('Getting GPS location... Please wait');
      getCurrentPosition();
      return;
    }

    setSubmitting(true);

    const reportId = uuidv4();
    const report = {
      id: reportId,
      localId: reportId,
      type,
      severity: parseInt(severity),
      description: description.trim(),
      photo: photo || null,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      deviceId,
      // Use authenticated user info
      responderName: user?.displayName || user?.email || deviceName || `Device-${deviceId?.slice(0, 8)}`,
      responderEmail: user?.email || null,
      responderUid: user?.uid || null,
      syncStatus: 0
    };

    try {
      // ALWAYS store locally first (offline-first!)
      await db.reports.put(report);
      console.log('💾 Report saved locally:', reportId.slice(0, 8));

      // Try to sync immediately if online using the device endpoint (no auth required)
      if (isOnline) {
        try {
          // Use the device endpoint which doesn't require auth token
          const payload = {
            local_id: report.id,
            incident_type: report.type?.toLowerCase().replace(' ', '_'),
            severity: report.severity,
            latitude: report.latitude,
            longitude: report.longitude,
            description: report.description || '',
            photo: report.photo || null,
            created_at: report.createdAt,
            device_id: report.deviceId,
            responder_name: report.responderName,
            responder_email: report.responderEmail,
            responder_uid: report.responderUid
          };

          const response = await fetch(`${API_URL}/incidents/device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            await db.reports.update(reportId, { syncStatus: 1 });
            console.log('✅ Report synced to server');
            setSavedOffline(false);
          } else {
            throw new Error('Server error');
          }
        } catch (syncErr) {
          console.log('📴 Will sync later:', syncErr.message);
          setSavedOffline(true);
        }
      } else {
        console.log('📴 Offline - saved locally, will sync later');
        setSavedOffline(true);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to save report:', err);
      setError('Failed to save report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form for new report
  const handleNewReport = () => {
    setType('');
    setSeverity(3);
    setDescription('');
    setPhoto(null);
    setSubmitted(false);
    setSavedOffline(false);
    setError(null);
    getCurrentPosition();
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            savedOffline ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          }`}>
            {savedOffline ? (
              <WifiOff className="w-10 h-10 text-amber-400" />
            ) : (
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {savedOffline ? 'Saved Offline' : 'Report Submitted'}
          </h2>
          
          <p className="text-gray-400 mb-6">
            {savedOffline 
              ? 'Your report is saved locally and will automatically sync when you reconnect to the internet.'
              : 'Your incident report has been successfully sent to HQ.'
            }
          </p>

          <div className="space-y-3">
            <button
              onClick={handleNewReport}
              className="btn-aegis btn-primary-aegis w-full"
            >
              Submit Another Report
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="btn-aegis btn-outline-aegis w-full"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Report Incident</h1>
        
        {/* Connection status */}
        <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isOnline ? '● Online' : <><WifiOff className="w-3 h-3" /> Offline</>}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* GPS Location */}
        <div className="card-aegis">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              location ? (usingDefault ? 'bg-amber-500/20' : 'bg-emerald-500/20') : 'bg-slate-700'
            }`}>
              <MapPin className={`w-5 h-5 ${location ? (usingDefault ? 'text-amber-400' : 'text-emerald-400') : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400">GPS Location</p>
              {locationLoading ? (
                <p className="text-white flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Getting location...
                </p>
              ) : location ? (
                <div>
                  <p className="text-white font-mono text-sm">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  {usingDefault && (
                    <p className="text-amber-400 text-xs mt-1">
                      ⚠️ Using default (Ratnapura). HTTPS required for GPS.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-amber-400 text-sm">
                  {locationError || 'Unable to get location'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Incident Type - REQUIRED */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Incident Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {INCIDENT_TYPES.slice(0, 4).map((incidentType) => (
              <button
                key={incidentType.value}
                type="button"
                onClick={() => setType(incidentType.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  type === incidentType.value
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-1 block">{incidentType.icon}</span>
                <span className="text-sm font-medium">{incidentType.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Severity - REQUIRED */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Severity Level <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSeverity(level.value)}
                className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
                  severity === level.value
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
                style={{
                  borderColor: severity === level.value ? level.color : undefined,
                  backgroundColor: severity === level.value ? `${level.color}20` : undefined
                }}
              >
                <span className="text-lg font-bold" style={{ color: level.color }}>
                  {level.value}
                </span>
                <span className="block text-xs text-gray-400 mt-1">{level.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the situation..."
            rows={3}
            className="input-aegis resize-none"
          />
        </div>

        {/* Photo - Optional but recommended */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Photo (Optional)
          </label>
          
          {photo ? (
            <div className="relative">
              <img 
                src={photo} 
                alt="Captured" 
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
              <Camera className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-500">Tap to capture photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !type || !location}
          className="btn-aegis btn-primary-aegis w-full mt-6"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Report
            </>
          )}
        </button>

        {/* Offline note */}
        {!isOnline && (
          <p className="text-center text-sm text-amber-400">
            <WifiOff className="w-4 h-4 inline mr-1" />
            You're offline. Report will be saved locally and synced when you reconnect.
          </p>
        )}
      </form>
    </div>
  );
}
