import { useState } from 'react';
import { Clock, MapPin, User, ChevronRight, Filter, Search } from 'lucide-react';

function IncidentList({ incidents, onSelectIncident }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const getTypeName = (type) => {
    const names = {
      landslide: 'Landslide',
      flood: 'Flood',
      road_block: 'Road Block',
      power_line_down: 'Power Line Down'
    };
    return names[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      landslide: '⛰️',
      flood: '🌊',
      road_block: '🚧',
      power_line_down: '⚡'
    };
    return icons[type] || '❓';
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
    if (filter !== 'all' && inc.incident_type !== filter) return false;
    if (severityFilter !== 'all' && inc.severity !== parseInt(severityFilter)) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        inc.description?.toLowerCase().includes(searchLower) ||
        inc.responder_name?.toLowerCase().includes(searchLower) ||
        getTypeName(inc.incident_type).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Types</option>
            <option value="landslide">Landslide</option>
            <option value="flood">Flood</option>
            <option value="road_block">Road Block</option>
            <option value="power_line_down">Power Line Down</option>
          </select>
        </div>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
      <p className="text-sm text-gray-600">
        Showing {filteredIncidents.length} of {incidents.length} incidents
      </p>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl text-center py-12 shadow-sm">
            <p className="text-gray-500">No incidents match your filters</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
              onClick={() => onSelectIncident(incident)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className="text-3xl">
                    {getTypeIcon(incident.incident_type)}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {getTypeName(incident.incident_type)}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getSeverityColor(incident.severity)}`}>
                        {getSeverityLabel(incident.severity)}
                      </span>
                    </div>

                    {incident.description && (
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-md">
                        {incident.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
                  {incident.photo && (
                    <img
                      src={incident.photo}
                      alt="Incident"
                      className="w-12 h-12 object-cover rounded border border-gray-200"
                    />
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
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
