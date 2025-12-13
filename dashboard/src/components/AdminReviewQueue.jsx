/**
 * Admin Review Queue Component
 * Allows admins to review, approve, correct, or reject extracted data
 */

import { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle, XCircle, Edit3, AlertTriangle,
  ChevronDown, ChevronUp, Clock, User, Eye, Save, X,
  MessageSquare, Sparkles, RefreshCw
} from 'lucide-react';
import { extractionAPI } from '../services/api';

// Status colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  corrected: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

function AdminReviewQueue({ onDataUpdate, extractionResults = [] }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedItem, setExpandedItem] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [reviewStatuses, setReviewStatuses] = useState(() => {
    // Load persisted review statuses from localStorage
    try {
      const saved = localStorage.getItem('aegis_review_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading review statuses:', error);
      return {};
    }
  });

  // Save review statuses to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('aegis_review_statuses', JSON.stringify(reviewStatuses));
    } catch (error) {
      console.error('Error saving review statuses:', error);
    }
  }, [reviewStatuses]);

  // Build review queue from extraction results
  useEffect(() => {
    buildReviewQueue();
  }, [extractionResults, filter]);

  const buildReviewQueue = async () => {
    setLoading(true);
    try {
      // First, try to fetch from API
      try {
        const apiData = await extractionAPI.getReviewQueue(filter !== 'all' ? filter : undefined);
        if (apiData && apiData.length > 0) {
          setQueue(apiData);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.log('API not available, building from extraction results');
      }

      // Build queue from extraction results
      const reviewItems = extractionResults
        .filter(({ extraction, incident }, index) => {
          const itemId = `rev_${incident.id || `ext_${index}`}`;
          const persistedStatus = reviewStatuses[itemId];
          const currentStatus = persistedStatus?.status || 'pending';
          
          // If item has been processed (has persisted status), always include it
          if (persistedStatus) {
            // Apply filter based on current status
            if (filter === 'pending') {
              return currentStatus === 'pending';
            }
            if (filter === 'approved') {
              return currentStatus === 'approved';
            }
            if (filter === 'corrected') {
              return currentStatus === 'corrected';
            }
            if (filter === 'rejected') {
              return currentStatus === 'rejected';
            }
            if (filter === 'all') {
              return true;
            }
            return false;
          }
          
          // For new items, only include if they need review
          const needsReview = extraction.needsReview || (extraction.confidence || 0) < 0.5;
          if (!needsReview) return false;
          
          // Apply filter for new items
          if (filter === 'pending') {
            return true; // New items needing review are pending
          }
          if (filter === 'all') {
            return true;
          }
          return false; // Don't show new items in other filters
        })
        .map(({ extraction, incident }, index) => {
          const confidence = extraction.confidence || 0;
          const itemId = `rev_${incident.id || `ext_${index}`}`;
          // Get persisted status if exists
          const persistedStatus = reviewStatuses[itemId];
          return {
            id: itemId,
            incidentId: incident.id,
            originalText: extraction.originalText || incident.description,
            extractedData: {
              supplies: extraction.supplies || [],
              locations: extraction.locations || [],
              vulnerableGroups: extraction.vulnerableGroups || []
            },
            confidence: confidence,
            reason: confidence < 0.3 
              ? 'Very low confidence - no keywords matched' 
              : confidence < 0.5
              ? 'Low confidence extraction'
              : extraction.uncertainItems?.length > 0
              ? 'Contains uncertain items'
              : 'Needs verification',
            status: persistedStatus?.status || 'pending',
            adminNotes: persistedStatus?.adminNotes || null,
            correctedData: persistedStatus?.correctedData || null,
            reviewedBy: persistedStatus?.reviewedBy || null,
            reviewedAt: persistedStatus?.reviewedAt || null,
            createdAt: extraction.timestamp || incident.created_at || new Date().toISOString(),
            extractionMethod: extraction.extractionMethod || 'keyword'
          };
        });

      console.log('Review queue built:', {
        totalExtractions: extractionResults.length,
        needsReview: extractionResults.filter(r => r.extraction.needsReview || (r.extraction.confidence || 0) < 0.5).length,
        reviewItems: reviewItems.length,
        filter
      });

      // If no items from extraction, use mock data for demo
      if (reviewItems.length === 0 && filter === 'pending') {
        setQueue(getMockQueue());
      } else {
        setQueue(reviewItems);
      }
    } catch (error) {
      console.error('Error building review queue:', error);
      // Fallback to mock data
      setQueue(getMockQueue());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration - realistic review queue items
  const getMockQueue = () => [
    {
      id: 'rev_001',
      incidentId: 'inc_001',
      originalText: 'URGENT: Severe flooding at Ratnapura Central School. 120 students and 15 teachers trapped on second floor. 8 elders among staff need adult diapers (L size). 2 pregnant teachers require medical attention. Need 150 food packets, 200 water bottles urgently.',
      extractedData: {
        supplies: [
          { item: 'adult diapers', category: 'elderly', quantity: 8, unit: 'packs', priority: 'high', icon: '👴' },
          { item: 'food packets', category: 'food', quantity: 150, unit: 'packets', priority: 'critical', icon: '🍚' },
          { item: 'water bottles', category: 'water', quantity: 200, unit: 'bottles', priority: 'critical', icon: '💧' }
        ],
        locations: [{ type: 'school', name: 'Ratnapura Central School', icon: '🏫' }],
        vulnerableGroups: [
          { group: 'elderly', count: 8, icon: '👴' },
          { group: 'pregnant', count: 2, icon: '🤰' },
          { group: 'children', count: 120, icon: '🧒' }
        ]
      },
      confidence: 0.72,
      reason: 'Contains uncertain items - verify quantities',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rev_002',
      incidentId: 'inc_002',
      originalText: 'Critical landslide in Kiriella village near Buddhist Temple. 45 people trapped including 12 elderly and 6 children. 3 month old baby needs Lactogen milk powder. 2 diabetic patients need insulin. Need stretchers and oxygen cylinders.',
      extractedData: {
        supplies: [
          { item: 'Lactogen milk powder', category: 'baby', quantity: 1, unit: 'tin', priority: 'critical', icon: '👶' },
          { item: 'insulin', category: 'medical', quantity: 2, unit: 'doses', priority: 'critical', icon: '💊' },
          { item: 'stretchers', category: 'equipment', quantity: null, unit: 'units', priority: 'high', icon: '🔦' },
          { item: 'oxygen cylinders', category: 'medical', quantity: null, unit: 'units', priority: 'critical', icon: '💊' }
        ],
        locations: [{ type: 'religious', name: 'Buddhist Temple (Maha Vihara)', icon: '🛕' }],
        vulnerableGroups: [
          { group: 'elderly', count: 12, icon: '👴' },
          { group: 'infant', count: 1, specialNeeds: '3 month old', icon: '👶' },
          { group: 'children', count: 6, icon: '🧒' },
          { group: 'medical_conditions', count: 2, specialNeeds: 'diabetic', icon: '🏥' }
        ]
      },
      confidence: 0.58,
      reason: 'Low confidence - some quantities unclear',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'rev_003',
      incidentId: 'inc_003',
      originalText: 'Flood at Weligepola mosque. 50 displaced people need halal food packets and clean water. 4 month old baby needs Nan milk powder and pampers small size. Elderly man needs kidney medicine.',
      extractedData: {
        supplies: [
          { item: 'halal food packets', category: 'food', quantity: 50, unit: 'packets', priority: 'high', icon: '🍚' },
          { item: 'clean water', category: 'water', quantity: null, unit: 'liters', priority: 'critical', icon: '💧' },
          { item: 'Nan milk powder', category: 'baby', quantity: 1, unit: 'tin', priority: 'critical', icon: '👶' },
          { item: 'pampers', category: 'baby', quantity: null, unit: 'packs', priority: 'high', icon: '👶' },
          { item: 'kidney medicine', category: 'medical', quantity: null, unit: 'doses', priority: 'critical', icon: '💊' }
        ],
        locations: [{ type: 'religious', name: 'Weligepola Mosque', icon: '🛕' }],
        vulnerableGroups: [
          { group: 'infant', count: 1, specialNeeds: '4 month old', icon: '👶' },
          { group: 'elderly', count: 1, specialNeeds: 'kidney patient', icon: '👴' }
        ]
      },
      confidence: 0.55,
      reason: 'Multiple uncertain items - verify medicine details',
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const handleApprove = async (item) => {
    setProcessing(true);
    try {
      // Try API first
      try {
        await extractionAPI.processReview(item.id, {
          status: 'approved',
          adminNotes: adminNotes || 'Approved by admin',
          reviewedBy: 'admin'
        });
      } catch (apiError) {
        console.log('API not available, saving locally');
      }
      
      // Update persisted status
      const updatedStatus = {
        status: 'approved',
        adminNotes: adminNotes || 'Approved by admin',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString()
      };
      
      setReviewStatuses(prev => ({
        ...prev,
        [item.id]: updatedStatus
      }));
      
      // Update local state
      setQueue(queue.map(q => 
        q.id === item.id ? { ...q, ...updatedStatus } : q
      ));
      
      setAdminNotes('');
      setExpandedItem(null);
      onDataUpdate?.();
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (item) => {
    setProcessing(true);
    try {
      // Try API first
      try {
        await extractionAPI.processReview(item.id, {
          status: 'rejected',
          adminNotes: adminNotes || 'Rejected by admin',
          reviewedBy: 'admin'
        });
      } catch (apiError) {
        console.log('API not available, saving locally');
      }
      
      // Update persisted status
      const updatedStatus = {
        status: 'rejected',
        adminNotes: adminNotes || 'Rejected by admin',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString()
      };
      
      setReviewStatuses(prev => ({
        ...prev,
        [item.id]: updatedStatus
      }));
      
      // Update local state
      setQueue(queue.map(q => 
        q.id === item.id ? { ...q, ...updatedStatus } : q
      ));
      
      setAdminNotes('');
      setExpandedItem(null);
    } catch (error) {
      console.error('Error rejecting item:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveCorrection = async (item) => {
    if (!editedData) return;
    
    setProcessing(true);
    try {
      // Try API first
      try {
        await extractionAPI.processReview(item.id, {
          status: 'corrected',
          adminNotes: adminNotes || 'Corrected by admin',
          correctedData: editedData,
          reviewedBy: 'admin'
        });
      } catch (apiError) {
        console.log('API not available, saving locally');
      }
      
      // Update persisted status
      const updatedStatus = {
        status: 'corrected',
        adminNotes: adminNotes || 'Corrected by admin',
        correctedData: editedData,
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString()
      };
      
      setReviewStatuses(prev => ({
        ...prev,
        [item.id]: updatedStatus
      }));
      
      // Update local state
      setQueue(queue.map(q => 
        q.id === item.id ? { ...q, ...updatedStatus } : q
      ));
      
      setAdminNotes('');
      setEditMode(null);
      setEditedData(null);
      setExpandedItem(null);
      onDataUpdate?.();
    } catch (error) {
      console.error('Error saving correction:', error);
    } finally {
      setProcessing(false);
    }
  };

  const startEdit = (item) => {
    setEditMode(item.id);
    // Use correctedData if available, otherwise use extractedData
    const dataToEdit = item.correctedData || item.extractedData;
    setEditedData(JSON.parse(JSON.stringify(dataToEdit)));
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditedData(null);
  };

  const updateEditedSupply = (index, field, value) => {
    const newData = { ...editedData };
    newData.supplies[index][field] = value;
    setEditedData(newData);
  };

  const addSupply = () => {
    const newData = { ...editedData };
    newData.supplies = [...(newData.supplies || []), { item: '', category: 'food', quantity: 1, priority: 'medium' }];
    setEditedData(newData);
  };

  const removeSupply = (index) => {
    const newData = { ...editedData };
    newData.supplies.splice(index, 1);
    setEditedData(newData);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Stats
  const stats = {
    pending: queue.filter(q => q.status === 'pending').length,
    approved: queue.filter(q => q.status === 'approved').length,
    corrected: queue.filter(q => q.status === 'corrected').length,
    rejected: queue.filter(q => q.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading review queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Review Queue</h2>
              <p className="text-sm text-purple-100">Review and approve extracted data</p>
            </div>
          </div>
          <button
            onClick={buildReviewQueue}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div 
          className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${filter === 'pending' ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
          onClick={() => setFilter('pending')}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div 
          className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${filter === 'approved' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
          onClick={() => setFilter('approved')}
        >
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-xs text-gray-500">Approved</p>
        </div>
        <div 
          className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${filter === 'corrected' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => setFilter('corrected')}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.corrected}</p>
          <p className="text-xs text-gray-500">Corrected</p>
        </div>
        <div 
          className={`text-center cursor-pointer p-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setFilter('all')}
        >
          <p className="text-2xl font-bold text-gray-600">{queue.length}</p>
          <p className="text-xs text-gray-500">All</p>
        </div>
      </div>

      {/* Queue Items */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No items in review queue</p>
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="border-l-4" style={{ borderLeftColor: item.status === 'pending' ? '#f59e0b' : item.status === 'approved' ? '#10b981' : item.status === 'corrected' ? '#3b82f6' : '#ef4444' }}>
              {/* Item Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                      <span className="text-xs text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {item.originalText}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {item.reason}
                    </p>
                  </div>
                  <div className="ml-4">
                    {expandedItem === item.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedItem === item.id && (
                <div className="px-4 pb-4 bg-gray-50">
                  {/* Original Text */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Original Description</p>
                    <p className="text-sm text-gray-700">{item.originalText}</p>
                  </div>

                  {/* Extracted Data */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      {item.correctedData ? 'Corrected Data' : 'Extracted Data'}
                      {item.correctedData && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          Corrected
                        </span>
                      )}
                    </p>
                    
                    {editMode === item.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        {/* Supplies Editor */}
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600">Supplies</span>
                            <button 
                              onClick={addSupply}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              + Add Supply
                            </button>
                          </div>
                          {editedData?.supplies?.map((supply, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                value={supply.item}
                                onChange={(e) => updateEditedSupply(idx, 'item', e.target.value)}
                                placeholder="Item name"
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <input
                                type="number"
                                value={supply.quantity}
                                onChange={(e) => updateEditedSupply(idx, 'quantity', parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <select
                                value={supply.priority}
                                onChange={(e) => updateEditedSupply(idx, 'priority', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                              <button 
                                onClick={() => removeSupply(idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* View Mode - Use correctedData if available, otherwise use extractedData */
                      (() => {
                        const displayData = item.correctedData || item.extractedData;
                        return (
                          <div className="grid grid-cols-3 gap-3">
                            {/* Supplies */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <span className="text-xs font-semibold text-gray-600">Supplies</span>
                              <div className="mt-2 space-y-1">
                                {displayData.supplies?.map((s, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span>{s.item}</span>
                                    <span className="font-semibold">{s.quantity || '-'}</span>
                                  </div>
                                )) || <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </div>

                            {/* Locations */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <span className="text-xs font-semibold text-gray-600">Locations</span>
                              <div className="mt-2 space-y-1">
                                {displayData.locations?.map((l, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="capitalize">{l.type}</span>
                                    {l.name && <span className="text-gray-500">: {l.name}</span>}
                                  </div>
                                )) || <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </div>

                            {/* Vulnerable Groups */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <span className="text-xs font-semibold text-gray-600">Vulnerable Groups</span>
                              <div className="mt-2 space-y-1">
                                {displayData.vulnerableGroups?.map((g, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="capitalize">{g.group}</span>
                                    <span className="font-semibold">{g.count || '-'}</span>
                                  </div>
                                )) || <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Admin Notes */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Admin Notes</p>
                    {item.status === 'pending' ? (
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes (optional)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        rows={2}
                      />
                    ) : item.adminNotes ? (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">{item.adminNotes}</p>
                        {item.reviewedBy && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed by: {item.reviewedBy} • {item.reviewedAt && formatDate(item.reviewedAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No notes added</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      {editMode === item.id ? (
                        <>
                          <button
                            onClick={() => handleSaveCorrection(item)}
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            Save Corrections
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit & Correct
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            disabled={processing}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Status Message for Processed Items */}
                  {item.status !== 'pending' && (
                    <div className={`p-3 rounded-lg border ${
                      item.status === 'approved' ? 'bg-green-50 border-green-200' :
                      item.status === 'corrected' ? 'bg-blue-50 border-blue-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {item.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {item.status === 'corrected' && <Edit3 className="w-4 h-4 text-blue-600" />}
                        {item.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                        <p className={`text-sm font-medium ${
                          item.status === 'approved' ? 'text-green-700' :
                          item.status === 'corrected' ? 'text-blue-700' :
                          'text-red-700'
                        }`}>
                          {item.status === 'approved' && 'This item has been approved and added to the system.'}
                          {item.status === 'corrected' && 'This item has been corrected with updated data.'}
                          {item.status === 'rejected' && 'This item has been rejected and will not be processed.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminReviewQueue;

