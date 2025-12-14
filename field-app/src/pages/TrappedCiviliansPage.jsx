import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  X, 
  Check,
  Users,
  Mic,
  Square,
  Play,
  Trash2
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { useAuth } from '../context/AuthContextV2';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { db } from '../db/database';
import locationService from '../services/locationService';

const CONDITION_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'injured', label: 'Injured' },
  { value: 'critical', label: 'Critical Condition' },
  { value: 'stable', label: 'Stable' },
  { value: 'unresponsive', label: 'Unresponsive' }
];

const URGENCY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' }
];

function TrappedCiviliansPage() {
  const navigate = useNavigate();
  const { deviceId } = useDeviceStore();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Form state
  const [numberOfCivilians, setNumberOfCivilians] = useState('1');
  const [condition, setCondition] = useState('unknown');
  const [urgency, setUrgency] = useState('medium');
  const [description, setDescription] = useState('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  
  // Voice note state
  const [voiceNote, setVoiceNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
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

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceNote(reader.result);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Timer for duration (max 30 seconds)
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const playVoiceNote = () => {
    if (audioRef.current && voiceNote) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const deleteVoiceNote = () => {
    setVoiceNote(null);
    setRecordingDuration(0);
  };

  // Get API URL dynamically
  const getApiUrl = () => {
    if (import.meta.env.MODE === 'production') {
      return '/api';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  };

  const handleSubmit = async () => {
    if (!numberOfCivilians || parseInt(numberOfCivilians) < 1) {
      alert('Please enter number of civilians');
      return;
    }

    setIsSubmitting(true);

    const reportData = {
      id: `trapped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      device_id: deviceId,
      responder_name: user?.displayName || user?.email || 'Unknown',
      responder_email: user?.email || null,
      responder_uid: user?.uid || null,
      number_of_civilians: parseInt(numberOfCivilians),
      condition,
      urgency,
      description: description || null,
      accessibility_notes: accessibilityNotes || null,
      photos: photos.length > 0 ? photos : null,
      voice_note: voiceNote || null,
      latitude: location?.latitude || 6.6828,
      longitude: location?.longitude || 80.3992,
      status: 'reported',
      created_at: new Date().toISOString(),
      synced: 0
    };

    try {
      // Save to IndexedDB first
      await db.trappedCivilians.add(reportData);
      console.log('💾 Trapped civilians report saved to IndexedDB');

      // Try to sync immediately if online
      if (isOnline) {
        const response = await fetch(`${getApiUrl()}/trapped-civilians`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });

        if (response.ok) {
          await db.trappedCivilians.update(reportData.id, { synced: 1 });
          console.log('✅ Trapped civilians report synced to server');
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
              : 'Trapped civilians report sent to rescue teams'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600"
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
      <header className="sticky top-0 z-[9999] bg-pink-500 px-4 py-3 flex items-center gap-3 shadow-lg">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-pink-600 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Report Trapped Civilians</h1>
          <p className="text-pink-200 text-xs">Capture location, photos, and details</p>
        </div>
        
        {/* Location Status */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          locationStatus === 'loading' ? 'bg-yellow-500/20 text-yellow-300' :
          locationStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
          'bg-amber-500/20 text-amber-300'
        }`}>
          <MapPin className="w-3 h-3" />
          <span className="hidden sm:inline">
            {locationStatus === 'loading' ? 'Getting GPS...' :
             locationStatus === 'success' ? `${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}` : 
             'Default'}
          </span>
        </div>
      </header>

      {/* Form Content */}
      <div className="p-4 pb-24 space-y-5">
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
             `GPS: ${location?.latitude.toFixed(6)}, ${location?.longitude.toFixed(6)}`}
          </span>
        </div>

        {/* Number of Civilians */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Civilians *
          </label>
          <input
            type="number"
            min="1"
            value={numberOfCivilians}
            onChange={(e) => setNumberOfCivilians(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Condition *
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            {CONDITION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Urgency Level *
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            {URGENCY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about the situation..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
          />
        </div>

        {/* Accessibility Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Accessibility Notes (Optional)
          </label>
          <input
            type="text"
            value={accessibilityNotes}
            onChange={(e) => setAccessibilityNotes(e.target.value)}
            placeholder="e.g., Building entrance blocked, 3rd floor..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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

        {/* Voice Note */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Voice Note (30s max)
          </label>
          
          {voiceNote ? (
            <div className="flex items-center gap-3 bg-pink-500/20 rounded-xl p-3 border border-pink-500/30">
              <audio
                ref={audioRef}
                src={voiceNote}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                onClick={isPlaying ? stopPlayback : playVoiceNote}
                className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                {isPlaying ? (
                  <Square className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-1" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-pink-400 font-medium text-sm">Voice Note Recorded</p>
                <p className="text-pink-300 text-xs">{recordingDuration}s • Tap to play</p>
              </div>
              <button
                onClick={deleteVoiceNote}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="w-full py-4 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 animate-pulse"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              Recording... {recordingDuration}s / 30s
              <span className="text-red-200">(Tap to stop)</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-red-600 hover:to-pink-600"
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </button>
          )}
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
          disabled={isSubmitting || !numberOfCivilians}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
            isSubmitting || !numberOfCivilians
              ? 'bg-pink-500/50 text-pink-300 cursor-not-allowed'
              : 'bg-pink-500 text-white hover:bg-pink-600'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              Save Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default TrappedCiviliansPage;

