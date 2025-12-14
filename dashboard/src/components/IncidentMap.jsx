import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock, User, MapPin, Play, Square, Mic } from 'lucide-react';

// Custom marker icons by incident type (supports multiple types)
const createIcon = (types, severity) => {
  // Handle both array and single type for backward compatibility
  const typeArray = Array.isArray(types) ? types : [types];
  const primaryType = typeArray[0] || 'unknown';
  
  const colors = {
    landslide: '#b45309',
    flood: '#0369a1',
    power_cut: '#fbbf24',
    powercut: '#fbbf24'
  };
  
  const icons = {
    landslide: '⛰️',
    flood: '🌊',
    power_cut: '⚡',
    powercut: '⚡'
  };

  const size = severity <= 2 ? 40 : severity <= 3 ? 35 : 30;
  
  // If multiple types, show first type icon with indicator
  const iconHtml = typeArray.length > 1 
    ? `${icons[primaryType] || '❓'}<span style="font-size: 10px; position: absolute; top: -2px; right: -2px; background: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid ${colors[primaryType] || '#6b7280'};">+${typeArray.length - 1}</span>`
    : icons[primaryType] || '❓';
  
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker ${severity <= 2 ? 'pulse-marker' : ''}" 
           style="width: ${size}px; height: ${size}px; background: ${colors[primaryType] || '#6b7280'}; position: relative;">
        ${iconHtml}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Voice Note Player Component - Light Theme
function VoicePlayer({ voiceNote }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
      <audio
        ref={audioRef}
        src={voiceNote}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors flex-shrink-0"
      >
        {isPlaying ? (
          <Square className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>
      <div>
        <p className="text-blue-700 font-medium text-sm">Voice Note</p>
        <p className="text-blue-600 text-xs">Tap to {isPlaying ? 'stop' : 'play'}</p>
      </div>
    </div>
  );
}

// Component to handle map center changes
function MapCenterHandler({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}

function IncidentMap({ incidents, blockedRoads = [], selectedIncident, onSelectIncident }) {
  // Ratnapura District center
  const defaultCenter = [6.6828, 80.3992];
  const defaultZoom = 10;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeName = (types) => {
    // Handle both array and single type
    const typeArray = Array.isArray(types) ? types : [types];
    const names = {
      landslide: 'Landslide',
      flood: 'Flood',
      power_cut: 'Power Cut',
      powercut: 'Power Cut'
    };
    
    if (typeArray.length === 1) {
      return names[typeArray[0]] || typeArray[0];
    }
    // Multiple types
    return typeArray.map(t => names[t] || t).join(', ');
  };

  const getSeverityLabel = (severity) => {
    const labels = ['', 'Critical', 'High', 'Medium', 'Low', 'Minimal'];
    return labels[severity] || 'Unknown';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: '#dc2626',
      2: '#f97316',
      3: '#eab308',
      4: '#22c55e',
      5: '#6b7280'
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Center on selected incident */}
        {selectedIncident && (
          <MapCenterHandler 
            center={[selectedIncident.latitude, selectedIncident.longitude]} 
            zoom={14}
          />
        )}
        
        {/* Incident markers */}
        {incidents.map((incident) => {
          // Get types array (support both old single type and new multiple types)
          const incidentTypes = incident.incident_types || 
                               (incident.incident_type ? [incident.incident_type] : []);
          
          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={createIcon(incidentTypes, incident.severity)}
              eventHandlers={{
                click: () => onSelectIncident(incident)
              }}
            >
              <Popup>
                <div className="p-3 min-w-[220px] max-w-[280px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-base">
                      {getTypeName(incidentTypes)}
                    </h3>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getSeverityColor(incident.severity) }}
                  >
                    Lv {incident.severity}
                  </span>
                </div>
                
                {incident.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {incident.description}
                  </p>
                )}
                
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(incident.created_at)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {incident.responder_name || 'Unknown'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                  </p>
                </div>
                
                {incident.voice_note && (
                  <VoicePlayer voiceNote={incident.voice_note} />
                )}
                
                {incident.photo && (
                  <img 
                    src={incident.photo} 
                    alt="Incident" 
                    className="mt-3 w-full h-28 object-cover rounded-lg"
                  />
                )}
              </div>
            </Popup>
          </Marker>
          );
        })}
        
        {/* Blocked Roads Markers */}
        {blockedRoads.map((road) => {
          const roadIcon = L.divIcon({
            className: 'custom-marker-wrapper',
            html: `
              <div class="custom-marker" 
                   style="width: 35px; height: 35px; background: #f59e0b; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                🚧
              </div>
            `,
            iconSize: [35, 35],
            iconAnchor: [17.5, 17.5],
            popupAnchor: [0, -17.5]
          });
          
          return (
            <Marker
              key={road.id || `road-${road.start_lat}-${road.start_lng}`}
              position={[road.start_lat || road.latitude, road.start_lng || road.longitude]}
              icon={roadIcon}
            >
              <Popup>
                <div className="p-3 min-w-[220px] max-w-[280px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <span>🚧</span> Blocked Road
                    </h3>
                    <span className="px-2 py-1 rounded-full text-xs font-bold text-white bg-amber-500">
                      {road.severity || 'Blocked'}
                    </span>
                  </div>
                  
                  {road.obstruction_type && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Obstruction:</strong> {road.obstruction_type}
                    </p>
                  )}
                  
                  {road.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {road.description}
                    </p>
                  )}
                  
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {road.start_lat?.toFixed(4) || road.latitude?.toFixed(4)}, {road.start_lng?.toFixed(4) || road.longitude?.toFixed(4)}
                    </p>
                    {road.responder_name && (
                      <p className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {road.responder_name}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend - Light Theme - Hidden on mobile */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg border border-gray-200 hidden sm:block">
        <p className="text-xs text-gray-500 mb-2 font-medium">Incident Types</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>🌊</span> Flood
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>⛰️</span> Landslide
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>⚡</span> Power Cut
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 mb-1 font-medium">Road Blocks</p>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Blocked Road
        </div>
      </div>
      
      {/* Incident Count Badge */}
      <div className="absolute top-4 right-4 z-[1000] bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
        {incidents.length} Incidents {blockedRoads.length > 0 && `• ${blockedRoads.length} Roads`}
      </div>
    </div>
  );
}

export default IncidentMap;
