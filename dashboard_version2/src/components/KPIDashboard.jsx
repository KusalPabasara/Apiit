import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Clock, 
  MapPin,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Area, AreaChart } from 'recharts';

function KPIDashboard({ incidents }) {
  // Calculate KPIs
  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter(i => i.severity === 1).length;
  const highIncidents = incidents.filter(i => i.severity === 2).length;
  const mediumIncidents = incidents.filter(i => i.severity === 3).length;
  const lowIncidents = incidents.filter(i => i.severity >= 4).length;
  
  const uniqueResponders = new Set(incidents.map(i => i.responder_id)).size;
  
  // Time-based calculations
  const now = new Date();
  const oneHourAgo = new Date(now - 3600000);
  const twentyFourHoursAgo = new Date(now - 86400000);
  const sevenDaysAgo = new Date(now - 604800000);
  
  const lastHour = incidents.filter(i => new Date(i.created_at) > oneHourAgo).length;
  const last24Hours = incidents.filter(i => new Date(i.created_at) > twentyFourHoursAgo).length;
  const last7Days = incidents.filter(i => new Date(i.created_at) > sevenDaysAgo).length;
  
  // Response time (mock calculation - in real scenario would calculate from incident.resolved_at)
  const avgResponseTime = "15m"; // Mock data
  const activeIncidents = incidents.filter(i => !i.resolved_at).length;
  const resolvedIncidents = incidents.filter(i => i.resolved_at).length;
  const resolutionRate = totalIncidents > 0 ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1) : 0;
  
  // By type
  const typeData = [
    { name: 'Landslide', value: incidents.filter(i => i.incident_type === 'landslide').length, color: '#b45309' },
    { name: 'Flood', value: incidents.filter(i => i.incident_type === 'flood').length, color: '#0369a1' },
    { name: 'Road Block', value: incidents.filter(i => i.incident_type === 'road_block').length, color: '#dc2626' },
    { name: 'Power Line', value: incidents.filter(i => i.incident_type === 'power_line_down').length, color: '#7c3aed' }
  ].filter(d => d.value > 0);

  // By severity
  const severityData = [
    { name: 'Critical', value: criticalIncidents, color: '#dc2626' },
    { name: 'High', value: highIncidents, color: '#f97316' },
    { name: 'Medium', value: mediumIncidents, color: '#eab308' },
    { name: 'Low', value: lowIncidents, color: '#22c55e' }
  ].filter(d => d.value > 0);

  // Hourly trend (last 24 hours)
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
      label: `${hourStart.getHours()}:00`
    });
  }

  // Daily trend (last 7 days)
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now - (i * 86400000));
    const dayEnd = new Date(now - ((i - 1) * 86400000));
    const count = incidents.filter(inc => {
      const incDate = new Date(inc.created_at);
      return incDate >= dayStart && incDate < dayEnd;
    }).length;
    dailyTrend.push({
      day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      count: count
    });
  }

  // Trend calculation (comparing last 24h to previous 24h)
  const previous24Hours = incidents.filter(i => {
    const date = new Date(i.created_at);
    return date > new Date(now - 172800000) && date <= twentyFourHoursAgo;
  }).length;
  const trendPercentage = previous24Hours > 0 
    ? (((last24Hours - previous24Hours) / previous24Hours) * 100).toFixed(1)
    : 0;
  const isIncreasing = trendPercentage > 0;

  // KPI Card Component
  const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-50 to-blue-100 border-blue-200",
      red: "from-red-50 to-red-100 border-red-200",
      green: "from-green-50 to-green-100 border-green-200",
      yellow: "from-yellow-50 to-yellow-100 border-yellow-200",
      purple: "from-purple-50 to-purple-100 border-purple-200",
      orange: "from-orange-50 to-orange-100 border-orange-200",
      slate: "from-slate-50 to-slate-100 border-slate-200"
    };

    const iconColorClasses = {
      blue: "bg-blue-500 text-white",
      red: "bg-red-500 text-white",
      green: "bg-green-500 text-white",
      yellow: "bg-yellow-500 text-white",
      purple: "bg-purple-500 text-white",
      orange: "bg-orange-500 text-white",
      slate: "bg-slate-500 text-white"
    };

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg ${iconColorClasses[color]} flex items-center justify-center shadow-sm`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Incidents"
          value={totalIncidents}
          subtitle={`${last24Hours} in last 24 hours`}
          icon={AlertTriangle}
          trend={parseFloat(trendPercentage)}
          color="blue"
        />
        <KPICard
          title="Critical & High"
          value={criticalIncidents + highIncidents}
          subtitle={`${criticalIncidents} critical, ${highIncidents} high`}
          icon={AlertCircle}
          color="red"
        />
        <KPICard
          title="Active Responders"
          value={uniqueResponders}
          subtitle="Field personnel reporting"
          icon={Users}
          color="green"
        />
        <KPICard
          title="Avg Response Time"
          value={avgResponseTime}
          subtitle="From report to first action"
          icon={Timer}
          color="purple"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Last Hour"
          value={lastHour}
          subtitle="Most recent activity"
          icon={Clock}
          color="orange"
        />
        <KPICard
          title="Last 7 Days"
          value={last7Days}
          subtitle="Weekly total"
          icon={Activity}
          color="slate"
        />
        <KPICard
          title="Active"
          value={activeIncidents}
          subtitle="Pending resolution"
          icon={XCircle}
          color="yellow"
        />
        <KPICard
          title="Resolved"
          value={resolvedIncidents}
          subtitle={`${resolutionRate}% resolution rate`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Medium & Low"
          value={mediumIncidents + lowIncidents}
          subtitle={`${mediumIncidents} medium, ${lowIncidents} low`}
          icon={Target}
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Incidents by Type</h3>
          </div>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Severity Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Severity Levels</h3>
          </div>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={severityData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  gridLine={{ stroke: '#f1f5f9' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-Hour Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Incident Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourlyTrend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                interval={3}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                gridLine={{ stroke: '#f1f5f9' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Incident Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyTrend}>
              <XAxis 
                dataKey="day" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                gridLine={{ stroke: '#f1f5f9' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Critical Incidents Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Incidents Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-3xl">⛰️</div>
            <div>
              <p className="text-sm text-gray-600">Landslides</p>
              <p className="text-2xl font-bold text-gray-900">
                {incidents.filter(i => i.incident_type === 'landslide').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-3xl">🌊</div>
            <div>
              <p className="text-sm text-gray-600">Floods</p>
              <p className="text-2xl font-bold text-gray-900">
                {incidents.filter(i => i.incident_type === 'flood').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-3xl">🚧</div>
            <div>
              <p className="text-sm text-gray-600">Road Blocks</p>
              <p className="text-2xl font-bold text-gray-900">
                {incidents.filter(i => i.incident_type === 'road_block').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-3xl">⚡</div>
            <div>
              <p className="text-sm text-gray-600">Power Lines</p>
              <p className="text-2xl font-bold text-gray-900">
                {incidents.filter(i => i.incident_type === 'power_line_down').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KPIDashboard;

