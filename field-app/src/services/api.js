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

// Helper to get auth token
const getToken = () => {
  const auth = localStorage.getItem('aegis_auth');
  if (auth) {
    const parsed = JSON.parse(auth);
    return parsed.token;
  }
  return null;
};

// Generic fetch wrapper with auth
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
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

// Auth API
export const authAPI = {
  login: (username, password) => 
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  verify: () => fetchAPI('/auth/verify'),
};

// Incidents API
export const incidentsAPI = {
  getAll: () => fetchAPI('/incidents'),
  
  create: (incident) =>
    fetchAPI('/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    }),
  
  sync: (incidents) =>
    fetchAPI('/incidents/sync', {
      method: 'POST',
      body: JSON.stringify({ incidents }),
    }),
  
  getStats: () => fetchAPI('/incidents/stats'),
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export default { authAPI, incidentsAPI, healthCheck };
