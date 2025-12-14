import { useState } from 'react';
import { Clock, MapPin, User, ChevronRight, Filter, Search, Mic } from 'lucide-react';

function IncidentList({ incidents, onSelectIncident }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const getTypeName = (types) => {
    // Handle both array and single type for backward compatibility
    const typeArray = Array.isArray(types) ? types : [types];
    const names = {
      landslide: 'Landslide',
      flood: 'Flood',
      road_block: 'Road Block',
      power_line_down: 'Power Line Down',
      power_cut: 'Power Cut',
      powercut: 'Power Cut',
      fire: 'Fire',
      building_collapse: 'Building Collapse'
    };
    
    if (typeArray.length === 0) return 'Unknown';
    if (typeArray.length === 1) return names[typeArray[0]] || typeArray[0];
    // Multiple types - return comma-separated list
    return typeArray.map(t => names[t] || t).join(', ');
  };

  const getTypeIcon = (types) => {
    // Handle both array and single type for backward compatibility
    const typeArray = Array.isArray(types) ? types : [types];
    const icons = {
      landslide: '⛰️',
      flood: '🌊',
      road_block: '🚧',
      power_line_down: '⚡',
      power_cut: '⚡',
      powercut: '⚡',
      fire: '🔥',
      building_collapse: '🏚️'
    };
    
    // Return first type icon, or combined if multiple
    if (typeArray.length === 0) return '❓';
    if (typeArray.length === 1) return icons[typeArray[0]] || '❓';
    // Multiple types - show first icon with indicator
    return `${icons[typeArray[0]] || '❓'} +${typeArray.length - 1}`;
  };

  const getSeverityLabel = (severity) => {
    const labels = ['', 'Critical', 'High', 'Medium', 'Low', 'Minimal'];
    return labels[severity] || 'Unknown';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'bg-red-600',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
      5: 'bg-gray-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Filter incidents
  const filteredIncidents = incidents.filter(inc => {
    // Get types array (support both old single type and new multiple types)
    const incidentTypes = inc.incident_types || (inc.incident_type ? [inc.incident_type] : []);
    
    if (filter !== 'all' && !incidentTypes.includes(filter)) return false;
    if (severityFilter !== 'all' && inc.severity !== parseInt(severityFilter)) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        inc.description?.toLowerCase().includes(searchLower) ||
        inc.responder_name?.toLowerCase().includes(searchLower) ||
        getTypeName(incidentTypes).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="flood">Flood</option>
            <option value="landslide">Landslide</option>
            <option value="road_block">Road Block</option>
            <option value="power_line_down">Power Line Down</option>
          </select>
        </div>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Severities</option>
          <option value="1">Critical</option>
          <option value="2">High</option>
          <option value="3">Medium</option>
          <option value="4">Low</option>
          <option value="5">Minimal</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-400">
        Showing {filteredIncidents.length} of {incidents.length} incidents
      </p>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-400">No incidents match your filters</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="card hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => onSelectIncident(incident)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className="text-3xl">
                    {getTypeIcon(incident.incident_types || incident.incident_type)}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Display all incident types as badges */}
                      {(() => {
                        // Get types array - check incident_types first, then fallback to incident_type
                        let incidentTypes = [];
                        if (incident.incident_types && Array.isArray(incident.incident_types)) {
                          incidentTypes = incident.incident_types;
                        } else if (incident.incident_type) {
                          // If single type, convert to array
                          incidentTypes = Array.isArray(incident.incident_type) 
                            ? incident.incident_type 
                            : [incident.incident_type];
                        }
                        
                        // Debug log (remove in production)
                        if (incidentTypes.length > 1) {
                          console.log('📋 Incident has multiple types:', incident.id, incidentTypes);
                        }
                        
                        const typeNames = {
                          landslide: 'Landslide',
                          flood: 'Flood',
                          power_cut: 'Power Cut',
                          powercut: 'Power Cut',
                          fire: 'Fire',
                          building_collapse: 'Building Collapse'
                        };
                        const typeColors = {
                          landslide: 'bg-amber-600',
                          flood: 'bg-blue-600',
                          power_cut: 'bg-yellow-500',
                          powercut: 'bg-yellow-500',
                          fire: 'bg-red-600',
                          building_collapse: 'bg-gray-600'
                        };
                        
                        if (incidentTypes.length === 0) {
                          return <span className="px-2 py-0.5 rounded text-xs font-medium text-white bg-gray-600">Unknown</span>;
                        }
                        
                        return incidentTypes.map((type, idx) => {
                          const normalizedType = String(type).toLowerCase().replace(/\s+/g, '_');
                          return (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded text-xs font-medium text-white ${typeColors[normalizedType] || 'bg-gray-600'}`}
                            >
                              {typeNames[normalizedType] || normalizedType}
                            </span>
                          );
                        });
                      })()}
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getSeverityColor(incident.severity)}`}>
                        {getSeverityLabel(incident.severity)}
                      </span>
                    </div>

                    {incident.description && (
                      <p className="text-sm text-slate-400 line-clamp-1 max-w-md">
                        {incident.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(incident.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {incident.responder_name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2">
                  {incident.voice_note && (
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center" title="Has voice message">
                      <Mic className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  {incident.photo && (
                    <img
                      src={incident.photo}
                      alt="Incident"
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default IncidentList;
