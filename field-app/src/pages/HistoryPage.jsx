import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cloud, CloudOff, Clock, MapPin } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { INCIDENT_TYPES, SEVERITY_LEVELS } from '../db/database';

function HistoryPage() {
  const navigate = useNavigate();
  
  // Live query - automatically updates when IndexedDB changes
  // FIXED: Use 'reports' table (not 'incidents') and 'timestamp' field
  const reports = useLiveQuery(
    () => db.reports.orderBy('timestamp').reverse().toArray(),
    []
  );

  const getTypeInfo = (type) => INCIDENT_TYPES.find(t => t.value === type) || { icon: '❓', label: type };
  const getSeverityInfo = (severity) => SEVERITY_LEVELS.find(s => s.value === severity) || { color: '#6b7280', label: 'Unknown' };

  const formatDate = (dateStr) => {
    // Handle both ISO string and timestamp
    const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pt-12 pb-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Report History</h1>
          <p className="text-sm text-gray-400">
            {reports?.length || 0} reports on this device
          </p>
        </div>
      </div>

      {/* Reports List */}
      {!reports || reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">No reports yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Reports you create will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            // FIXED: Use 'type' field from reports table
            const typeInfo = getTypeInfo(report.type);
            const severityInfo = getSeverityInfo(report.severity);
            // FIXED: syncStatus is 0 (unsynced) or 1 (synced)
            const isSynced = report.syncStatus === 1;
            
            return (
              <div key={report.id} className="card-aegis">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <div>
                      <h3 className="font-medium text-white">{typeInfo.label}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(report.createdAt || report.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Sync Status */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: severityInfo.color }}
                    >
                      {severityInfo.label}
                    </span>
                    {isSynced ? (
                      <Cloud className="w-4 h-4 text-green-400" title="Synced" />
                    ) : (
                      <CloudOff className="w-4 h-4 text-yellow-400" title="Pending sync" />
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="font-mono">
                    {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                  </span>
                </div>

                {/* Description */}
                {report.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {report.description}
                  </p>
                )}

                {/* Photo thumbnail */}
                {report.photo && (
                  <img
                    src={report.photo}
                    alt="Incident"
                    className="mt-2 w-full h-24 object-cover rounded-lg"
                  />
                )}

                {/* Sync status message */}
                <div className={`mt-3 text-xs ${isSynced ? 'text-green-400' : 'text-yellow-400'}`}>
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
