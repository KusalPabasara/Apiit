import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cloud, CloudOff, Clock, MapPin, FileText, Users, Blocks, Package, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { INCIDENT_TYPES, SEVERITY_LEVELS } from '../db/database';

// Report type configurations
const REPORT_TYPES = {
  incident: {
    icon: FileText,
    label: 'Incident Report',
    color: 'bg-red-500',
    getData: () => db.reports.orderBy('timestamp').reverse().toArray(),
    getSyncStatus: (item) => item.syncStatus === 1,
    getTimestamp: (item) => item.createdAt || item.timestamp,
    getLocation: (item) => ({ lat: item.latitude, lng: item.longitude }),
    getDetails: (item) => ({
      type: INCIDENT_TYPES.find(t => t.value === item.type)?.label || item.type,
      severity: SEVERITY_LEVELS.find(s => s.value === item.severity)?.label || 'Unknown',
      severityColor: SEVERITY_LEVELS.find(s => s.value === item.severity)?.color || '#6b7280',
      description: item.description,
      photo: item.photo
    })
  },
  trapped: {
    icon: Users,
    label: 'Trapped Civilians',
    color: 'bg-pink-500',
    getData: () => db.trappedCivilians.orderBy('created_at').reverse().toArray(),
    getSyncStatus: (item) => item.synced === 1,
    getTimestamp: (item) => item.created_at,
    getLocation: (item) => ({ lat: item.latitude, lng: item.longitude }),
    getDetails: (item) => ({
      civilians: item.number_of_civilians,
      condition: item.condition,
      urgency: item.urgency,
      description: item.description,
      photos: item.photos,
      voiceNote: item.voice_note
    })
  },
  blocked: {
    icon: Blocks,
    label: 'Blocked Road',
    color: 'bg-amber-500',
    getData: () => db.blockedRoads.orderBy('created_at').reverse().toArray(),
    getSyncStatus: (item) => item.synced === 1,
    getTimestamp: (item) => item.created_at,
    getLocation: (item) => ({ lat: item.start_lat || item.latitude, lng: item.start_lng || item.longitude }),
    getDetails: (item) => ({
      obstruction: item.obstruction_type,
      severity: item.severity,
      description: item.description,
      photos: item.photos
    })
  },
  supply: {
    icon: Package,
    label: 'Supply Request',
    color: 'bg-blue-500',
    getData: () => db.supplyRequests.orderBy('created_at').reverse().toArray(),
    getSyncStatus: (item) => item.synced === 1,
    getTimestamp: (item) => item.created_at,
    getLocation: (item) => ({ lat: item.latitude, lng: item.longitude }),
    getDetails: (item) => ({
      priority: item.priority,
      supplies: item.supplies,
      recipients: item.recipients,
      notes: item.notes,
      photos: item.photos
    })
  },
  sos: {
    icon: AlertTriangle,
    label: 'SOS Alert',
    color: 'bg-red-600',
    getData: () => db.emergencies.orderBy('timestamp').reverse().toArray(),
    getSyncStatus: (item) => item.syncStatus === 1,
    getTimestamp: (item) => item.timestamp,
    getLocation: (item) => ({ lat: item.latitude, lng: item.longitude }),
    getDetails: (item) => ({
      status: item.status,
      responder: item.responder_name
    })
  }
};

function HistoryPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  // Live queries for all report types
  const incidents = useLiveQuery(() => REPORT_TYPES.incident.getData(), []);
  const trapped = useLiveQuery(() => REPORT_TYPES.trapped.getData(), []);
  const blocked = useLiveQuery(() => REPORT_TYPES.blocked.getData(), []);
  const supply = useLiveQuery(() => REPORT_TYPES.supply.getData(), []);
  const sos = useLiveQuery(() => REPORT_TYPES.sos.getData(), []);

  // Combine and sort all reports by timestamp
  const allReports = useMemo(() => {
    const reports = [];
    
    if (incidents) {
      incidents.forEach(item => {
        reports.push({
          id: item.id,
          type: 'incident',
          config: REPORT_TYPES.incident,
          data: item
        });
      });
    }
    
    if (trapped) {
      trapped.forEach(item => {
        reports.push({
          id: item.id,
          type: 'trapped',
          config: REPORT_TYPES.trapped,
          data: item
        });
      });
    }
    
    if (blocked) {
      blocked.forEach(item => {
        reports.push({
          id: item.id,
          type: 'blocked',
          config: REPORT_TYPES.blocked,
          data: item
        });
      });
    }
    
    if (supply) {
      supply.forEach(item => {
        reports.push({
          id: item.id,
          type: 'supply',
          config: REPORT_TYPES.supply,
          data: item
        });
      });
    }
    
    if (sos) {
      sos.forEach(item => {
        reports.push({
          id: item.id,
          type: 'sos',
          config: REPORT_TYPES.sos,
          data: item
        });
      });
    }

    // Sort by timestamp (newest first)
    return reports.sort((a, b) => {
      const timeA = a.config.getTimestamp(a.data);
      const timeB = b.config.getTimestamp(b.data);
      const dateA = typeof timeA === 'number' ? timeA : new Date(timeA).getTime();
      const dateB = typeof timeB === 'number' ? timeB : new Date(timeB).getTime();
      return dateB - dateA;
    });
  }, [incidents, trapped, blocked, supply, sos]);

  // Filter reports
  const filteredReports = useMemo(() => {
    if (activeFilter === 'all') return allReports;
    return allReports.filter(r => r.type === activeFilter);
  }, [allReports, activeFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalCount = allReports.length;
  const pendingCount = allReports.filter(r => !r.config.getSyncStatus(r.data)).length;
  const syncedCount = allReports.filter(r => r.config.getSyncStatus(r.data)).length;

  return (
    <div className="min-h-screen pb-6 px-4 bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-[9999] bg-slate-900 flex items-center gap-4 py-4 mb-6 shadow-lg">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">History</h1>
          <p className="text-sm text-gray-400">
            {totalCount} total • {pendingCount} pending • {syncedCount} synced
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setActiveFilter('incident')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'incident'
              ? 'bg-red-500 text-white'
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          Incidents ({incidents?.length || 0})
        </button>
        <button
          onClick={() => setActiveFilter('trapped')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'trapped'
              ? 'bg-pink-500 text-white'
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          Trapped ({trapped?.length || 0})
        </button>
        <button
          onClick={() => setActiveFilter('blocked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'blocked'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          Roads ({blocked?.length || 0})
        </button>
        <button
          onClick={() => setActiveFilter('supply')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'supply'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          Supply ({supply?.length || 0})
        </button>
        <button
          onClick={() => setActiveFilter('sos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'sos'
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          SOS ({sos?.length || 0})
        </button>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">No {activeFilter === 'all' ? 'reports' : activeFilter} yet</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeFilter === 'all' 
              ? 'Reports you create will appear here'
              : `${REPORT_TYPES[activeFilter]?.label || 'Reports'} you create will appear here`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const { config, data } = report;
            const Icon = config.icon;
            const isSynced = config.getSyncStatus(data);
            const location = config.getLocation(data);
            const details = config.getDetails(data);
            const timestamp = config.getTimestamp(data);

            return (
              <div key={`${report.type}-${report.id}`} className="card-aegis">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{config.label}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Sync Status */}
                  <div className="flex items-center gap-2">
                    {report.type === 'incident' && details.severity && (
                      <span
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: details.severityColor }}
                      >
                        {details.severity}
                      </span>
                    )}
                    {isSynced ? (
                      <Cloud className="w-4 h-4 text-green-400" title="Synced to HQ" />
                    ) : (
                      <CloudOff className="w-4 h-4 text-yellow-400" title="Pending sync" />
                    )}
                  </div>
                </div>

                {/* Location */}
                {location?.lat && location?.lng && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Type-specific details */}
                <div className="text-sm text-gray-400 mb-2">
                  {report.type === 'incident' && (
                    <p><span className="font-medium">Type:</span> {details.type}</p>
                  )}
                  {report.type === 'trapped' && (
                    <p><span className="font-medium">Civilians:</span> {details.civilians} • <span className="font-medium">Urgency:</span> {details.urgency}</p>
                  )}
                  {report.type === 'blocked' && (
                    <p><span className="font-medium">Obstruction:</span> {details.obstruction} • <span className="font-medium">Severity:</span> {details.severity}</p>
                  )}
                  {report.type === 'supply' && (
                    <p><span className="font-medium">Priority:</span> {details.priority} • <span className="font-medium">Recipients:</span> {details.recipients}</p>
                  )}
                  {report.type === 'sos' && (
                    <p><span className="font-medium">Status:</span> {details.status} • <span className="font-medium">Responder:</span> {details.responder}</p>
                  )}
                </div>

                {/* Description */}
                {details.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                    {details.description}
                  </p>
                )}

                {/* Photo thumbnail */}
                {(details.photo || (details.photos && details.photos.length > 0)) && (
                  <div className="flex gap-2 mb-2">
                    {details.photo && (
                      <img
                        src={details.photo}
                        alt="Report"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    {details.photos && details.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Report ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Voice note indicator */}
                {details.voiceNote && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>🎤 Voice note attached</span>
                  </div>
                )}

                {/* Sync status message */}
                <div className={`mt-3 text-xs font-medium ${isSynced ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isSynced ? '✓ Synced to HQ' : '⏳ Pending sync'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
