import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function MapChartsSection({ incidents }) {
  // Type distribution data (only Flood and Landslide)
  const typeData = [
    { 
      name: 'Landslide', 
      value: incidents.filter(i => i.incident_type === 'landslide').length, 
      color: '#b45309',
      icon: '⛰️'
    },
    { 
      name: 'Flood', 
      value: incidents.filter(i => i.incident_type === 'flood').length, 
      color: '#0369a1',
      icon: '🌊'
    }
  ].filter(d => d.value > 0);

  // Severity distribution data
  const severityData = [
    { name: 'Critical', value: incidents.filter(i => i.severity === 1).length, color: '#dc2626' },
    { name: 'High', value: incidents.filter(i => i.severity === 2).length, color: '#f97316' },
    { name: 'Medium', value: incidents.filter(i => i.severity === 3).length, color: '#eab308' },
    { name: 'Low', value: incidents.filter(i => i.severity >= 4).length, color: '#22c55e' }
  ].filter(d => d.value > 0);

  // Hourly trend (last 24 hours)
  const now = new Date();
  const hourlyTrend = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now - (i * 3600000));
    const hourEnd = new Date(now - ((i - 1) * 3600000));
    const count = incidents.filter(inc => {
      const incDate = new Date(inc.created_at);
      return incDate >= hourStart && incDate < hourEnd;
    }).length;
    hourlyTrend.push({
      hour: hourStart.getHours(),
      count: count,
      label: `${hourStart.getHours()}h`
    });
  }

  // Calculate trends
  const last6h = incidents.filter(i => new Date(i.created_at) > new Date(now - 21600000)).length;
  const previous6h = incidents.filter(i => {
    const time = new Date(i.created_at);
    return time > new Date(now - 43200000) && time <= new Date(now - 21600000);
  }).length;
  const trendPercent = previous6h > 0 ? (((last6h - previous6h) / previous6h) * 100).toFixed(0) : 0;
  const trendDirection = last6h > previous6h ? 'up' : last6h < previous6h ? 'down' : 'stable';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded px-2 py-1 shadow-lg">
          <p className="text-xs font-semibold text-gray-900">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-md">
        <h2 className="text-sm font-bold">Visual Analytics</h2>
        <p className="text-xs opacity-90">Charts & Trends</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs text-red-600">Critical</p>
          <p className="text-2xl font-bold text-red-600">{incidents.filter(i => i.severity === 1).length}</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs text-orange-600">High</p>
          <p className="text-2xl font-bold text-orange-600">{incidents.filter(i => i.severity === 2).length}</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-xs text-blue-600">Last Hour</p>
          <p className="text-2xl font-bold text-blue-600">
            {incidents.filter(i => new Date(i.created_at) > new Date(now - 3600000)).length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* Type Distribution - Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Incident Types</h4>
          <div className="h-40">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={55}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No data available
              </div>
            )}
          </div>
          {/* Type Legend */}
          <div className="mt-2 flex justify-center gap-4">
            {typeData.map((type, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-sm">{type.icon}</span>
                <span className="text-[10px] text-gray-600">{type.name}: {type.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution - Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Severity Levels</h4>
          <div className="h-40">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    width={25}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* 24-Hour Trend - Line Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700">24-Hour Activity Trend</h4>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
              trendDirection === 'up' ? 'bg-red-100 text-red-700' :
              trendDirection === 'down' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
              {trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
              {trendDirection === 'stable' && <Minus className="w-3 h-3" />}
              <span className="text-[10px] font-semibold">
                {trendDirection === 'up' ? `↑ ${trendPercent}%` :
                 trendDirection === 'down' ? `↓ ${trendPercent}%` :
                 'Stable'}
              </span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTrend}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#6b7280', fontSize: 9 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={3}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={25}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insight Box */}
      <div className={`rounded-lg p-3 border-2 ${
        incidents.filter(i => i.severity <= 2).length > 0 
          ? 'bg-red-50 border-red-300'
          : 'bg-green-50 border-green-300'
      }`}>
        <p className="text-xs font-semibold text-center">
          {incidents.filter(i => i.severity <= 2).length > 0 
            ? `⚠️ ${incidents.filter(i => i.severity <= 2).length} urgent incidents require immediate attention`
            : '✓ Situation stable - All incidents under control'
          }
        </p>
      </div>
    </div>
  );
}

export default MapChartsSection;

