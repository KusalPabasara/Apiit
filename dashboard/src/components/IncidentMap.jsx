import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock, User, MapPin } from 'lucide-react';

// Custom marker icons by incident type
const createIcon = (type, severity) => {
  const colors = {
    landslide: '#b45309',
    flood: '#0369a1',
    road_block: '#dc2626',
    power_line_down: '#7c3aed'
  };
  
  const icons = {
    landslide: '⛰️',
    flood: '🌊',
    road_block: '🚧',
    power_line_down: '⚡'
  };

  const size = severity <= 2 ? 40 : severity <= 3 ? 35 : 30;
  
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker ${severity <= 2 ? 'pulse-marker' : ''}" 
           style="width: ${size}px; height: ${size}px; background: ${colors[type] || '#6b7280'};">
        ${icons[type] || '❓'}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

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

function IncidentMap({ incidents, selectedIncident, onSelectIncident }) {
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

  const getTypeName = (type) => {
    const names = {
      landslide: 'Landslide',
      flood: 'Flood',
      road_block: 'Road Block',
      power_line_down: 'Power Line Down'
    };
    return names[type] || type;
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
    <div className="h-full w-full">
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
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={createIcon(incident.incident_type, incident.severity)}
            eventHandlers={{
              click: () => onSelectIncident(incident)
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">
                    {getTypeName(incident.incident_type)}
                  </h3>
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: getSeverityColor(incident.severity) }}
                  >
                    {getSeverityLabel(incident.severity)}
                  </span>
                </div>
                
                {incident.description && (
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                    {incident.description}
                  </p>
                )}
                
                <div className="space-y-1 text-xs text-gray-600">
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(incident.created_at)}
                  </p>
                  <p className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {incident.responder_name || 'Unknown'}
                  </p>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                  </p>
                </div>
                
                {incident.photo && (
                  <img 
                    src={incident.photo} 
                    alt="Incident" 
                    className="mt-2 w-full h-24 object-cover rounded"
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend - Top Right */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg p-3 shadow-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-2 font-semibold">Incident Types</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>⛰️</span> Landslide
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>🌊</span> Flood
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>🚧</span> Road Block
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>⚡</span> Power Line Down
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentMap;
