/**
 * Supply Needs Table Component
 * Displays extracted supply needs from incident descriptions
 * Organized by priority and category
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Package, AlertTriangle, CheckCircle, Clock, Filter,
  ChevronDown, ChevronUp, Search, Download, RefreshCw,
  Baby, Pill, Utensils, Droplet, Shirt, Home, Sparkles, Wrench,
  X, MapPin, Users, FileText, CheckCircle2
} from 'lucide-react';
import { extractionAPI } from '../services/api';
import { extractFromDescription, aggregateSupplyNeeds } from '../services/descriptionExtractor';

// Category icons mapping
const categoryIcons = {
  medical: Pill,
  baby: Baby,
  elderly: Pill,
  food: Utensils,
  water: Droplet,
  clothing: Shirt,
  shelter: Home,
  hygiene: Sparkles,
  equipment: Wrench
};

// Priority colors
const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

const priorityBadgeColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

function SupplyNeedsTable({ incidents = [], onRefresh }) {
  const [supplies, setSupplies] = useState([]);
  const [extractionResults, setExtractionResults] = useState([]); // Store full extraction results
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'all',
    priority: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [supplyStatuses, setSupplyStatuses] = useState(() => {
    // Load persisted statuses from localStorage on mount
    try {
      const saved = localStorage.getItem('aegis_supply_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading supply statuses:', error);
      return {};
    }
  }); // Track status per supply

  // Save statuses to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('aegis_supply_statuses', JSON.stringify(supplyStatuses));
    } catch (error) {
      console.error('Error saving supply statuses:', error);
    }
  }, [supplyStatuses]);

  // Extract supplies from incidents
  useEffect(() => {
    async function processIncidents() {
      setLoading(true);
      try {
        // Extract from each incident
        const extractions = await Promise.all(
          incidents.map(async (incident) => {
            if (!incident.description) return null;
            const extraction = await extractFromDescription(incident.description, { useLLM: false });
            return { extraction, incident };
          })
        );

        // Filter out nulls and aggregate
        const validExtractions = extractions.filter(e => e !== null);
        const aggregated = aggregateSupplyNeeds(validExtractions);
        
        setSupplies(aggregated);
        setExtractionResults(validExtractions); // Store for modal details
      } catch (error) {
        console.error('Error extracting supplies:', error);
      } finally {
        setLoading(false);
      }
    }

    if (incidents.length > 0) {
      processIncidents();
    } else {
      setLoading(false);
    }
  }, [incidents]);

  // Filtered and sorted supplies
  const filteredSupplies = useMemo(() => {
    let result = [...supplies];

    // Apply filters
    if (filter.category !== 'all') {
      result = result.filter(s => s.category === filter.category);
    }
    if (filter.priority !== 'all') {
      result = result.filter(s => s.priority === filter.priority);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      result = result.filter(s => 
        s.item.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortBy === 'quantity') {
        const diff = a.totalQuantity - b.totalQuantity;
        return sortOrder === 'asc' ? -diff : diff;
      }
      if (sortBy === 'incidents') {
        const diff = a.incidentCount - b.incidentCount;
        return sortOrder === 'asc' ? -diff : diff;
      }
      return 0;
    });

    return result;
  }, [supplies, filter, sortBy, sortOrder]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(supplies.map(s => s.category))];
  }, [supplies]);

  // Summary statistics
  const stats = useMemo(() => {
    return {
      total: supplies.length,
      critical: supplies.filter(s => s.priority === 'critical').length,
      high: supplies.filter(s => s.priority === 'high').length,
      totalQuantity: supplies.reduce((sum, s) => sum + s.totalQuantity, 0),
      categories: categories.length
    };
  }, [supplies, categories]);

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Get incidents that need a specific supply
  const getIncidentsForSupply = (supply) => {
    const supplyKey = `${supply.category}-${supply.item}`.toLowerCase();
    return extractionResults
      .filter(({ extraction, incident }) => {
        return extraction.supplies?.some(s => 
          `${s.category}-${s.item}`.toLowerCase() === supplyKey
        );
      })
      .map(({ incident, extraction }) => ({
        incident,
        extraction,
        supplyDetails: extraction.supplies?.find(s => 
          `${s.category}-${s.item}`.toLowerCase() === supplyKey
        )
      }));
  };

  // Handle supply card click
  const handleSupplyClick = (supply) => {
    setSelectedSupply(supply);
    setShowModal(true);
  };

  // Helper to get normalized supply key
  const getSupplyKey = (supply) => {
    return `${supply.category}-${supply.item}`.toLowerCase().trim();
  };

  // Update supply status
  const updateSupplyStatus = async (supply, newStatus) => {
    const key = getSupplyKey(supply);
    setSupplyStatuses(prev => ({
      ...prev,
      [key]: newStatus
    }));
    
    // Here you could also save to backend
    try {
      // await extractionAPI.updateSupply(supply.id, { status: newStatus });
      console.log('Status updated:', supply.item, newStatus, 'Key:', key);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Item', 'Category', 'Quantity', 'Unit', 'Priority', 'Incidents'];
    const rows = filteredSupplies.map(s => [
      s.item, s.category, s.totalQuantity, s.unit || 'units', s.priority, s.incidentCount
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-needs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Extracting supply needs from incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Supply Needs</h2>
              <p className="text-sm text-blue-100">Extracted from incident descriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          <p className="text-xs text-gray-500">Critical</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
          <p className="text-xs text-gray-500">High Priority</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.categories}</p>
          <p className="text-xs text-gray-500">Categories</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search supplies..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8"></th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('item')}
              >
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantity')}
              >
                Qty Needed
                {sortBy === 'quantity' && (
                  sortOrder === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />
                )}
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('priority')}
              >
                Priority
                {sortBy === 'priority' && (
                  sortOrder === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />
                )}
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('incidents')}
              >
                Incidents
                {sortBy === 'incidents' && (
                  sortOrder === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />
                )}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSupplies.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No supply needs found. Add incident descriptions to see extracted data.
                </td>
              </tr>
            ) : (
              filteredSupplies.map((supply, index) => {
                const CategoryIcon = categoryIcons[supply.category] || Package;
                const isExpanded = expandedRows.has(index);
                
                return (
                  <>
                    <tr 
                      key={index}
                      className={`hover:bg-gray-50 cursor-pointer ${priorityColors[supply.priority]?.includes('critical') ? 'bg-red-50/50' : ''}`}
                      onClick={(e) => {
                        // Don't open modal if clicking the expand/collapse icon
                        if (e.target.closest('td:first-child')) {
                          toggleRow(index);
                        } else {
                          handleSupplyClick(supply);
                        }
                      }}
                    >
                      <td className="px-2 py-3 text-center">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{supply.icon || '📦'}</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {supply.item}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 capitalize">{supply.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {supply.totalQuantity}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{supply.unit || 'units'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColors[supply.priority]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityBadgeColors[supply.priority]}`}></span>
                          {supply.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {supply.incidentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const status = supplyStatuses[getSupplyKey(supply)] || 'pending';
                          return status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">Target Groups</p>
                              <p className="text-sm text-gray-700">
                                {supply.targetGroup || 'General population'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">Related Incidents</p>
                              <p className="text-sm text-gray-700">
                                Found in {supply.incidentCount} incident report(s)
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 flex items-center justify-between">
        <span>
          Showing {filteredSupplies.length} of {supplies.length} items
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Auto-extracted from descriptions
        </span>
      </div>

      {/* Supply Details Modal */}
      {showModal && selectedSupply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{selectedSupply.icon || '📦'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">{selectedSupply.item}</h2>
                  <p className="text-sm text-blue-100 capitalize">{selectedSupply.category} • {selectedSupply.totalQuantity} {selectedSupply.unit || 'units'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Status Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Current Status</p>
                    {(() => {
                      const status = supplyStatuses[getSupplyKey(selectedSupply)] || 'pending';
                      return status === 'success' ? (
                        <span className="inline-flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Success - Supply Delivered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-yellow-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Pending - Awaiting Delivery</span>
                        </span>
                      );
                    })()}
                  </div>
                  {supplyStatuses[getSupplyKey(selectedSupply)] !== 'success' && (
                    <button
                      onClick={() => {
                        updateSupplyStatus(selectedSupply, 'success');
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>

              {/* Incidents Needing This Supply */}
              {(() => {
                const relatedIncidents = getIncidentsForSupply(selectedSupply);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Needed in {relatedIncidents.length} Incident{relatedIncidents.length !== 1 ? 's' : ''}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {relatedIncidents.map(({ incident, extraction, supplyDetails }, idx) => (
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
                              <p className="text-xs text-gray-500 mb-1">Quantity Needed</p>
                              <p className="text-lg font-bold text-blue-600">
                                {supplyDetails?.quantity || 1} {supplyDetails?.unit || selectedSupply.unit || 'units'}
                              </p>
                            </div>
                          </div>

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

                          {/* Vulnerable Groups */}
                          {extraction.vulnerableGroups && extraction.vulnerableGroups.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div className="flex-1 flex flex-wrap gap-2">
                                {extraction.vulnerableGroups.map((group, groupIdx) => (
                                  <span key={groupIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                    <span>{group.icon || '👤'}</span>
                                    <span className="capitalize">{group.group.replace('_', ' ')}</span>
                                    {group.count > 0 && <span>({group.count})</span>}
                                  </span>
                                ))}
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
                Priority: <span className="font-semibold capitalize text-gray-700">{selectedSupply.priority}</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
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

export default SupplyNeedsTable;

