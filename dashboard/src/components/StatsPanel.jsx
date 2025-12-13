import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';

function StatsPanel({ stats, incidents }) {
  const typeColors = {
    landslide: '#b45309',
    flood: '#0369a1',
    road_block: '#dc2626',
    power_line_down: '#7c3aed'
  };

  const typeNames = {
    landslide: 'Landslide',
    flood: 'Flood',
    road_block: 'Road Block',
    power_line_down: 'Power Line'
  };

  const severityColors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#6b7280'];
  const severityLabels = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];

  // Process data for charts
  const typeData = stats?.byType?.map(item => ({
    name: typeNames[item.incident_type] || item.incident_type,
    value: item.count,
    color: typeColors[item.incident_type] || '#6b7280'
  })) || [];

  const severityData = stats?.bySeverity?.map(item => ({
    name: severityLabels[item.severity - 1] || `Level ${item.severity}`,
    value: item.count,
    color: severityColors[item.severity - 1] || '#6b7280'
  })) || [];

  // Calculate stats
  const criticalCount = stats?.bySeverity?.find(s => s.severity === 1)?.count || 0;
  const highCount = stats?.bySeverity?.find(s => s.severity === 2)?.count || 0;
  const urgentCount = criticalCount + highCount;

  // Get unique responders
  const uniqueResponders = new Set(incidents.map(i => i.responder_id)).size;

  // Get recent incidents (last hour)
  const oneHourAgo = new Date(Date.now() - 3600000);
  const recentCount = incidents.filter(i => new Date(i.created_at) > oneHourAgo).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Incidents</p>
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-900/30 to-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Urgent (Critical + High)</p>
              <p className="text-2xl font-bold text-red-400">{urgentCount}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-900/30 to-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Responders</p>
              <p className="text-2xl font-bold text-green-400">{uniqueResponders}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-900/30 to-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Last Hour</p>
              <p className="text-2xl font-bold text-yellow-400">{recentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Type */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">By Incident Type</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* By Severity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">By Severity Level</h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Critical Incidents */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Critical Incidents</h3>
        <div className="space-y-2">
          {stats?.recent?.filter(i => i.severity <= 2).slice(0, 5).map((incident) => (
            <div key={incident.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {incident.incident_type === 'landslide' && '⛰️'}
                  {incident.incident_type === 'flood' && '🌊'}
                  {incident.incident_type === 'road_block' && '🚧'}
                  {incident.incident_type === 'power_line_down' && '⚡'}
                </span>
                <div>
                  <p className="text-white font-medium">
                    {typeNames[incident.incident_type] || incident.incident_type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                incident.severity === 1 ? 'bg-red-600' : 'bg-orange-500'
              }`}>
                {severityLabels[incident.severity - 1]}
              </span>
            </div>
          )) || (
            <p className="text-slate-400 text-center py-4">No critical incidents</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
