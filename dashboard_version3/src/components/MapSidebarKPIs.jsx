import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  MapPin,
  Zap,
  Target
} from 'lucide-react';

function MapSidebarKPIs({ incidents }) {
  // Calculate key metrics
  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 1).length;
  const highCount = incidents.filter(i => i.severity === 2).length;
  
  // Time-based analysis
  const now = new Date();
  const oneHourAgo = new Date(now - 3600000);
  
  const lastHour = incidents.filter(i => new Date(i.created_at) > oneHourAgo).length;
  
  // Type analysis
  const landslides = incidents.filter(i => i.incident_type === 'landslide').length;
  const floods = incidents.filter(i => i.incident_type === 'flood').length;
  const roadBlocks = incidents.filter(i => i.incident_type === 'road_block').length;
  const powerLines = incidents.filter(i => i.incident_type === 'power_line_down').length;
  
  // Most affected type
  const types = [
    { name: 'Landslide', count: landslides, icon: '⛰️' },
    { name: 'Flood', count: floods, icon: '🌊' },
    { name: 'Road Block', count: roadBlocks, icon: '🚧' },
    { name: 'Power Line', count: powerLines, icon: '⚡' }
  ];
  const mostAffected = types.sort((a, b) => b.count - a.count)[0];
  
  // Prediction: Trend analysis
  const last6h = incidents.filter(i => new Date(i.created_at) > new Date(now - 21600000)).length;
  const previous6h = incidents.filter(i => {
    const time = new Date(i.created_at);
    return time > new Date(now - 43200000) && time <= new Date(now - 21600000);
  }).length;
  const trendDirection = last6h > previous6h ? 'increasing' : last6h < previous6h ? 'decreasing' : 'stable';
  const trendPercent = previous6h > 0 ? Math.abs(((last6h - previous6h) / previous6h) * 100).toFixed(0) : 0;
  
  // Hotspot prediction
  const locationClusters = {};
  incidents.forEach(inc => {
    const lat = Math.floor(inc.latitude * 10) / 10;
    const lng = Math.floor(inc.longitude * 10) / 10;
    const key = `${lat},${lng}`;
    locationClusters[key] = (locationClusters[key] || 0) + 1;
  });
  const hotspotCount = Object.values(locationClusters).filter(count => count >= 3).length;
  
  // Risk level calculation
  const riskScore = (criticalCount * 3 + highCount * 2) / Math.max(totalIncidents, 1);
  const riskLevel = riskScore > 2 ? 'High' : riskScore > 1 ? 'Medium' : 'Low';
  const riskColor = riskScore > 2 ? 'text-red-600 bg-red-50 border-red-200' : riskScore > 1 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-green-600 bg-green-50 border-green-200';

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-white shadow-md flex-shrink-0">
        <h2 className="text-sm font-bold">Situation Summary</h2>
        <p className="text-xs opacity-90">Real-time insights</p>
      </div>

      {/* Content - Flex layout, no scroll */}
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        
        {/* Status Section - Compact cards */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-1">Status</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{totalIncidents}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-600">{lastHour} last hr</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Critical</p>
                  <p className="text-lg font-bold text-gray-900">{criticalCount + highCount}</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                URGENT
              </span>
            </div>
          </div>
        </div>

        {/* Insights - Compact */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-1">Insights</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl flex-shrink-0">{mostAffected.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500">Most Affected</p>
                <p className="text-sm font-bold text-gray-900 truncate">{mostAffected.name}</p>
                <p className="text-[10px] text-gray-600">{mostAffected.count} ({((mostAffected.count / Math.max(totalIncidents, 1)) * 100).toFixed(0)}%)</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500">Hotspots</p>
                <p className="text-sm font-bold text-gray-900">{hotspotCount}</p>
                <p className="text-[10px] text-gray-600 truncate">{hotspotCount > 0 ? 'Clustering detected' : 'No clusters'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Predictions - Compact */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-1">Predictions</h3>
          
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 flex-shrink-0 ${
                trendDirection === 'increasing' ? 'text-red-600' : 
                trendDirection === 'decreasing' ? 'text-green-600' : 
                'text-gray-600'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600">6h Trend</p>
                <p className="text-sm font-bold text-gray-900 capitalize">{trendDirection}</p>
                <p className="text-[10px] text-gray-600 truncate">
                  {trendDirection === 'increasing' ? '↑' : trendDirection === 'decreasing' ? '↓' : '→'} {trendPercent}%
                </p>
              </div>
            </div>
          </div>

          <div className={`border-2 rounded-lg p-2 shadow-sm ${riskColor}`}>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] opacity-75">Risk Level</p>
                <p className="text-sm font-bold capitalize">{riskLevel}</p>
              </div>
            </div>
          </div>

          {/* Compact insight */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-[10px] text-blue-900 leading-tight">
              <strong>💡</strong> {
                trendDirection === 'increasing' 
                  ? 'Prepare additional resources'
                  : trendDirection === 'decreasing'
                  ? 'Situation stabilizing'
                  : 'Maintain current level'
              }
            </p>
          </div>
        </div>

        {/* Type Breakdown - Compact grid */}
        <div className="flex flex-col gap-1 mt-auto">
          <h3 className="text-[9px] font-semibold text-gray-700 uppercase tracking-wide px-1">By Type</h3>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-white border border-gray-200 rounded p-1 text-center">
              <div className="text-base">⛰️</div>
              <div className="text-xs font-bold text-gray-900">{landslides}</div>
              <div className="text-[8px] text-gray-600">Landslides</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-1 text-center">
              <div className="text-base">🌊</div>
              <div className="text-xs font-bold text-gray-900">{floods}</div>
              <div className="text-[8px] text-gray-600">Floods</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-1 text-center">
              <div className="text-base">🚧</div>
              <div className="text-xs font-bold text-gray-900">{roadBlocks}</div>
              <div className="text-[8px] text-gray-600">Road Blocks</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-1 text-center">
              <div className="text-base">⚡</div>
              <div className="text-xs font-bold text-gray-900">{powerLines}</div>
              <div className="text-[8px] text-gray-600">Power Lines</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapSidebarKPIs;

