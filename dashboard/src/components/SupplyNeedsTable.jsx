/**
 * Supply Needs Table Component
 * Displays extracted supply needs from incident descriptions
 * Organized by priority and category
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Package, AlertTriangle, CheckCircle, Clock, Filter,
  ChevronDown, ChevronUp, Search, Download, RefreshCw,
  Baby, Pill, Utensils, Droplet, Shirt, Home, Sparkles, Wrench
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'all',
    priority: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());

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
                      onClick={() => toggleRow(index)}
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
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
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
    </div>
  );
}

export default SupplyNeedsTable;

