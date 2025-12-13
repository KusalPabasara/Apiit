// Auto-detect API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

// Get auth token
const getToken = () => localStorage.getItem('aegis_dashboard_token');

// Generic fetch wrapper
async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('aegis_dashboard_token');
      localStorage.removeItem('aegis_dashboard_user');
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    localStorage.setItem('aegis_dashboard_token', response.token);
    localStorage.setItem('aegis_dashboard_user', JSON.stringify(response.user));
    
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('aegis_dashboard_token');
    localStorage.removeItem('aegis_dashboard_user');
  },
  
  getUser: () => {
    const user = localStorage.getItem('aegis_dashboard_user');
    return user ? JSON.parse(user) : null;
  },
  
  getToken: () => getToken(),
  
  isAuthenticated: () => !!getToken()
};

// Incidents API
export const incidentsAPI = {
  getAll: () => fetchAPI('/incidents'),
  getStats: () => fetchAPI('/incidents/stats'),
  getByType: (type) => fetchAPI(`/incidents/type/${type}`),
};

// Relief Camps API
export const reliefCampsAPI = {
  getAll: () => fetchAPI('/relief-camps'),
  get: (id) => fetchAPI(`/relief-camps/${id}`),
  create: (data) => fetchAPI('/relief-camps', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/relief-camps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/relief-camps/${id}`, { method: 'DELETE' }),
  getStats: () => fetchAPI('/relief-camps/stats/summary'),
};

// Rescue Missions API
export const rescueMissionsAPI = {
  getAll: () => fetchAPI('/rescue-missions'),
  get: (id) => fetchAPI(`/rescue-missions/${id}`),
  create: (data) => fetchAPI('/rescue-missions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/rescue-missions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => fetchAPI(`/rescue-missions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id) => fetchAPI(`/rescue-missions/${id}`, { method: 'DELETE' }),
  getStats: () => fetchAPI('/rescue-missions/stats/summary'),
};

// Alerts API
export const alertsAPI = {
  getAll: () => fetchAPI('/alerts'),
  getActive: () => fetchAPI('/alerts/active'),
  getByArea: (areaName) => fetchAPI(`/alerts/area/${areaName}`),
  create: (data) => fetchAPI('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/alerts/${id}`, { method: 'DELETE' }),
};

// Emergency API
export const emergencyAPI = {
  getAll: () => fetchAPI('/emergency'),
  getActive: () => fetchAPI('/emergency/active'),
  get: (id) => fetchAPI(`/emergency/${id}`),
  start: (data) => fetchAPI('/emergency/start', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id, data) => fetchAPI(`/emergency/${id}/location`, { method: 'POST', body: JSON.stringify(data) }),
  end: (id) => fetchAPI(`/emergency/${id}/end`, { method: 'POST' }),
};

// Extraction API - For intelligent description extraction
export const extractionAPI = {
  // Supplies
  getSupplies: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/extraction/supplies${query ? `?${query}` : ''}`);
  },
  getAggregatedSupplies: () => fetchAPI('/extraction/supplies/aggregated'),
  saveSupplies: (incidentId, supplies) => 
    fetchAPI('/extraction/supplies', { method: 'POST', body: JSON.stringify({ incidentId, supplies }) }),
  updateSupply: (id, data) => 
    fetchAPI(`/extraction/supplies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  
  // Vulnerable Groups
  getVulnerableGroups: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/extraction/vulnerable-groups${query ? `?${query}` : ''}`);
  },
  getAggregatedVulnerableGroups: () => fetchAPI('/extraction/vulnerable-groups/aggregated'),
  saveVulnerableGroups: (incidentId, groups) => 
    fetchAPI('/extraction/vulnerable-groups', { method: 'POST', body: JSON.stringify({ incidentId, groups }) }),
  
  // Locations
  getLocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/extraction/locations${query ? `?${query}` : ''}`);
  },
  getLocationsByType: () => fetchAPI('/extraction/locations/by-type'),
  saveLocations: (incidentId, locations) => 
    fetchAPI('/extraction/locations', { method: 'POST', body: JSON.stringify({ incidentId, locations }) }),
  
  // Review Queue
  getReviewQueue: (status) => 
    fetchAPI(`/extraction/review-queue${status ? `?status=${status}` : ''}`),
  addToReviewQueue: (data) => 
    fetchAPI('/extraction/review-queue', { method: 'POST', body: JSON.stringify(data) }),
  processReview: (id, data) => 
    fetchAPI(`/extraction/review-queue/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  
  // Full extraction save
  saveExtraction: (data) => 
    fetchAPI('/extraction/save-extraction', { method: 'POST', body: JSON.stringify(data) }),
  
  // Statistics
  getStats: () => fetchAPI('/extraction/stats'),
};

export default { authAPI, incidentsAPI, reliefCampsAPI, rescueMissionsAPI, alertsAPI, emergencyAPI, extractionAPI };
