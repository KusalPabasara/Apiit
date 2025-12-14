// Get API URL - Returns relative path /api which browser resolves with current protocol
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

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

  const response = await fetch(`${getApiUrl()}${endpoint}`, config);
  
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
    const response = await fetch(`${getApiUrl()}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export default { authAPI, incidentsAPI, healthCheck };
