/**
 * Extraction Dashboard Component
 * Main panel showing all extraction features:
 * - Supply Needs Table
 * - Vulnerable Groups Summary
 * - Location Categories
 * - Admin Review Queue
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Package, Users, MapPin, ClipboardList, Sparkles,
  AlertTriangle, TrendingUp, RefreshCw, Settings,
  Baby, Stethoscope, Home, Activity
} from 'lucide-react';
import SupplyNeedsTable from './SupplyNeedsTable';
import AdminReviewQueue from './AdminReviewQueue';
import { extractFromDescription, aggregateVulnerableGroups, aggregateByLocation } from '../services/descriptionExtractor';
import { llmConfig } from '../config/llmConfig';

function ExtractionDashboard({ incidents = [] }) {
  const [activeTab, setActiveTab] = useState('supplies');
  const [extractionResults, setExtractionResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Process all incidents on load
  useEffect(() => {
    async function processAll() {
      setLoading(true);
      try {
        const results = await Promise.all(
          incidents.map(async (incident) => {
            if (!incident.description) return null;
            const extraction = await extractFromDescription(incident.description, { useLLM: false });
            return { extraction, incident };
          })
        );
        setExtractionResults(results.filter(r => r !== null));
      } catch (error) {
        console.error('Error processing incidents:', error);
      } finally {
        setLoading(false);
      }
    }

    if (incidents.length > 0) {
      processAll();
    } else {
      setLoading(false);
    }
  }, [incidents]);

  // Aggregated data
  const vulnerableGroups = useMemo(() => {
    return aggregateVulnerableGroups(extractionResults);
  }, [extractionResults]);

  const locationCategories = useMemo(() => {
    return aggregateByLocation(extractionResults);
  }, [extractionResults]);

  // Summary stats
  const stats = useMemo(() => {
    let totalSupplies = 0;
    let criticalSupplies = 0;
    let totalVulnerable = 0;
    let totalLocations = 0;
    let needsReview = 0;

    extractionResults.forEach(({ extraction }) => {
      totalSupplies += extraction.supplies?.length || 0;
      criticalSupplies += extraction.supplies?.filter(s => s.priority === 'critical').length || 0;
      totalVulnerable += extraction.vulnerableGroups?.reduce((sum, g) => sum + (g.count || 0), 0) || 0;
      totalLocations += extraction.locations?.length || 0;
      if (extraction.needsReview) needsReview++;
    });

    return { totalSupplies, criticalSupplies, totalVulnerable, totalLocations, needsReview };
  }, [extractionResults]);

  // Group icons
  const groupIcons = {
    elderly: '👴',
    infant: '👶',
    children: '🧒',
    pregnant: '🤰',
    disabled: '♿',
    medical_conditions: '🏥'
  };

  // Location icons
  const locationIcons = {
    school: '🏫',
    hospital: '🏥',
    religious: '🛕',
    government: '🏛️',
    shelter: '🏠',
    residential: '🏘️'
  };

  const tabs = [
    { id: 'supplies', label: 'Supply Needs', icon: Package, count: stats.totalSupplies },
    { id: 'vulnerable', label: 'Vulnerable Groups', icon: Users, count: stats.totalVulnerable },
    { id: 'locations', label: 'Locations', icon: MapPin, count: stats.totalLocations },
    { id: 'review', label: 'Review Queue', icon: ClipboardList, count: stats.needsReview }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Intelligent Extraction</h2>
              <p className="text-xs text-gray-500">
                Auto-extracted from {incidents.length} incident descriptions
                {llmConfig.isConfigured() && (
                  <span className="ml-2 text-green-600">• LLM Enabled</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Extraction Settings</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">LLM Provider:</span>
                <span className="ml-2 font-medium">
                  {llmConfig.isConfigured() ? llmConfig.getActiveProvider() : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">LLM Threshold:</span>
                <span className="ml-2 font-medium">{llmConfig.extraction.llmThreshold * 100}%</span>
              </div>
              <div>
                <span className="text-gray-500">Auto-approve:</span>
                <span className="ml-2 font-medium">{llmConfig.extraction.autoApproveThreshold * 100}%+</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 font-medium ${llmConfig.isConfigured() ? 'text-green-600' : 'text-yellow-600'}`}>
                  {llmConfig.isConfigured() ? 'Ready' : 'Keyword-only mode'}
                </span>
              </div>
            </div>
            {!llmConfig.isConfigured() && (
              <p className="mt-2 text-xs text-yellow-600">
                💡 Add VITE_OPENAI_API_KEY to .env for enhanced extraction
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{stats.totalSupplies}</p>
            <p className="text-xs text-blue-600">Supply Items</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{stats.criticalSupplies}</p>
            <p className="text-xs text-red-600">Critical Items</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-700">{stats.totalVulnerable}</p>
            <p className="text-xs text-purple-600">Vulnerable People</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-700">{stats.needsReview}</p>
            <p className="text-xs text-orange-600">Needs Review</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-100 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Processing incident descriptions...</p>
              <p className="text-sm text-gray-400 mt-1">Extracting supplies, locations, and vulnerable groups</p>
            </div>
          </div>
        ) : (
          <>
            {/* Supply Needs Tab */}
            {activeTab === 'supplies' && (
              <SupplyNeedsTable incidents={incidents} />
            )}

            {/* Vulnerable Groups Tab */}
            {activeTab === 'vulnerable' && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {vulnerableGroups.map((group, idx) => (
                    <div 
                      key={idx}
                      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${
                        group.priority === 'critical' ? 'ring-2 ring-red-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{groupIcons[group.group] || '👤'}</span>
                          <span className="font-semibold text-gray-900 capitalize">
                            {group.group.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          group.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {group.priority}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-900">{group.totalCount}</p>
                          <p className="text-xs text-gray-500">people identified</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-600">{group.incidentCount}</p>
                          <p className="text-xs text-gray-500">incidents</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {vulnerableGroups.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No vulnerable groups identified yet</p>
                    <p className="text-sm text-gray-400">Add incident descriptions with population details</p>
                  </div>
                )}
              </div>
            )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(locationCategories).map(([type, data]) => (
                    <div key={type} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{locationIcons[type] || '📍'}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">{type}</h3>
                          <p className="text-sm text-gray-500">{data.totalIncidents} incidents</p>
                        </div>
                      </div>
                      
                      {data.locations.length > 0 ? (
                        <div className="space-y-2">
                          {data.locations.slice(0, 5).map((loc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">{loc.name}</span>
                              <span className="text-xs text-gray-500">{loc.incidentCount} incident(s)</span>
                            </div>
                          ))}
                          {data.locations.length > 5 && (
                            <p className="text-xs text-gray-400 text-center">
                              +{data.locations.length - 5} more locations
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-2">No named locations identified</p>
                      )}
                    </div>
                  ))}
                </div>

                {Object.keys(locationCategories).length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No location categories identified yet</p>
                    <p className="text-sm text-gray-400">Add incident descriptions with location details</p>
                  </div>
                )}
              </div>
            )}

            {/* Review Queue Tab */}
            {activeTab === 'review' && (
              <AdminReviewQueue extractionResults={extractionResults} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ExtractionDashboard;

