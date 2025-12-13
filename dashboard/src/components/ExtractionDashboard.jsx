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
  Baby, Stethoscope, Home, Activity, X, FileText, CheckCircle2
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
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

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

  // Get incidents for a specific vulnerable group
  const getIncidentsForGroup = (groupType) => {
    return extractionResults
      .filter(({ extraction }) => {
        return extraction.vulnerableGroups?.some(g => 
          g.group.toLowerCase() === groupType.toLowerCase()
        );
      })
      .map(({ incident, extraction }) => ({
        incident,
        extraction,
        groupDetails: extraction.vulnerableGroups?.find(g => 
          g.group.toLowerCase() === groupType.toLowerCase()
        )
      }));
  };

  // Handle vulnerable group card click
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
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
                      onClick={() => handleGroupClick(group)}
                      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all ${
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

      {/* Vulnerable Group Details Modal */}
      {showGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGroupModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{groupIcons[selectedGroup.group] || '👤'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">
                    {selectedGroup.group.replace('_', ' ')}
                  </h2>
                  <p className="text-sm text-purple-100">
                    {selectedGroup.totalCount} people identified in {selectedGroup.incidentCount} incident{selectedGroup.incidentCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Priority Badge */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Priority Level</p>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedGroup.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      selectedGroup.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedGroup.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{selectedGroup.totalCount}</p>
                    <p className="text-xs text-gray-500">Total People</p>
                  </div>
                </div>
              </div>

              {/* Incidents with This Vulnerable Group */}
              {(() => {
                const relatedIncidents = getIncidentsForGroup(selectedGroup.group);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Found in {relatedIncidents.length} Incident{relatedIncidents.length !== 1 ? 's' : ''}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {relatedIncidents.map(({ incident, extraction, groupDetails }, idx) => (
                        <div key={incident.id || idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">
                                  {incident.incident_type === 'flood' ? '🌊' :
                                   incident.incident_type === 'landslide' ? '⛰️' :
                                   incident.incident_type === 'road_block' ? '🚧' : '⚡'}
                                </span>
                                <span className="font-semibold text-gray-900 capitalize">
                                  {incident.incident_type?.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                                  incident.severity === 1 ? 'bg-red-500' :
                                  incident.severity === 2 ? 'bg-orange-500' :
                                  incident.severity === 3 ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}>
                                  Severity {incident.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {incident.description}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-500 mb-1">Count</p>
                              <p className="text-lg font-bold text-purple-600">
                                {groupDetails?.count || 0}
                              </p>
                            </div>
                          </div>

                          {/* Special Needs */}
                          {groupDetails?.specialNeeds && (
                            <div className="mb-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                              <span className="font-semibold">Special Needs: </span>
                              {groupDetails.specialNeeds}
                            </div>
                          )}

                          {/* Location */}
                          {extraction.locations && extraction.locations.length > 0 && (
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                {extraction.locations.map((loc, locIdx) => (
                                  <div key={locIdx} className="text-sm text-gray-700">
                                    <span className="capitalize">{loc.type}</span>
                                    {loc.name && <span>: {loc.name}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Supplies Needed for This Group */}
                          {extraction.supplies && extraction.supplies.length > 0 && (
                            <div className="flex items-start gap-2 mb-2">
                              <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Supplies Needed:</p>
                                <div className="flex flex-wrap gap-1">
                                  {extraction.supplies.slice(0, 5).map((supply, supIdx) => (
                                    <span key={supIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                      {supply.icon || '📦'}
                                      <span>{supply.item}</span>
                                      {supply.quantity && <span>({supply.quantity})</span>}
                                    </span>
                                  ))}
                                  {extraction.supplies.length > 5 && (
                                    <span className="text-xs text-gray-400">+{extraction.supplies.length - 5} more</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Other Vulnerable Groups in Same Incident */}
                          {extraction.vulnerableGroups && extraction.vulnerableGroups.length > 1 && (
                            <div className="flex items-start gap-2">
                              <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Other Groups:</p>
                                <div className="flex flex-wrap gap-1">
                                  {extraction.vulnerableGroups
                                    .filter(g => g.group !== selectedGroup.group)
                                    .map((group, groupIdx) => (
                                      <span key={groupIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-xs">
                                        <span>{group.icon || '👤'}</span>
                                        <span className="capitalize">{group.group.replace('_', ' ')}</span>
                                        {group.count > 0 && <span>({group.count})</span>}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Responder Info */}
                          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                            Responder: {incident.responder_name || 'Unknown'} • 
                            {new Date(incident.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Priority: <span className="font-semibold capitalize text-gray-700">{selectedGroup.priority}</span>
              </div>
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtractionDashboard;

