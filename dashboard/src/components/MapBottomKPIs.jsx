import { Users, CheckCircle, XCircle, Timer, TrendingUp, Activity } from 'lucide-react';

function MapBottomKPIs({ incidents }) {
  // Calculate metrics
  const uniqueResponders = new Set(incidents.map(i => i.responder_id || i.responder_name)).size;
  const activeIncidents = incidents.filter(i => !i.resolved_at).length;
  const resolvedIncidents = incidents.filter(i => i.resolved_at).length;
  const resolutionRate = incidents.length > 0 ? ((resolvedIncidents / incidents.length) * 100).toFixed(0) : 0;
  
  // Time analysis
  const now = new Date();
  const last24h = incidents.filter(i => new Date(i.created_at) > new Date(now - 86400000)).length;
  const previous24h = incidents.filter(i => {
    const time = new Date(i.created_at);
    return time > new Date(now - 172800000) && time <= new Date(now - 86400000);
  }).length;
  const trend24h = previous24h > 0 ? (((last24h - previous24h) / previous24h) * 100).toFixed(0) : 0;
  
  // Average response time (mock - would calculate from actual resolved timestamps)
  const avgResponseTime = "18m";
  
  // Activity rate (incidents per hour in last 24h)
  const activityRate = (last24h / 24).toFixed(1);

  const QuickKPI = ({ icon: Icon, label, value, subtitle, colorClass = "bg-blue-100 text-blue-600" }) => (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-2.5 py-1.5 shadow-md flex-shrink-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass.split(' ')[0]}`}>
        <Icon className={`w-3.5 h-3.5 ${colorClass.split(' ')[1]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-500 leading-tight">{label}</p>
        <p className="text-sm font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="text-[8px] text-gray-600 truncate leading-tight">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 overflow-hidden">
      <div className="flex items-center gap-2 overflow-x-auto">
        {/* KPI Cards - Compact */}
        <QuickKPI
          icon={Users}
          label="Responders"
          value={uniqueResponders}
          subtitle="On duty"
          colorClass="bg-green-100 text-green-600"
        />
        
        <QuickKPI
          icon={XCircle}
          label="Active"
          value={activeIncidents}
          subtitle="Pending"
          colorClass="bg-orange-100 text-orange-600"
        />
        
        <QuickKPI
          icon={CheckCircle}
          label="Resolved"
          value={resolvedIncidents}
          subtitle={`${resolutionRate}%`}
          colorClass="bg-green-100 text-green-600"
        />
        
        <QuickKPI
          icon={Timer}
          label="Response"
          value={avgResponseTime}
          subtitle="Average"
          colorClass="bg-purple-100 text-purple-600"
        />
        
        <QuickKPI
          icon={TrendingUp}
          label="24h"
          value={last24h}
          subtitle={`${trend24h > 0 ? '↑' : trend24h < 0 ? '↓' : '→'}${Math.abs(trend24h)}%`}
          colorClass={trend24h > 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}
        />
        
        <QuickKPI
          icon={Activity}
          label="Rate"
          value={`${activityRate}/h`}
          subtitle="Hourly"
          colorClass="bg-blue-100 text-blue-600"
        />
      </div>
    </div>
  );
}

export default MapBottomKPIs;

