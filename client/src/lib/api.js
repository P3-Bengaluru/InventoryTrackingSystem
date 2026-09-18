const API_BASE = import.meta.env.VITE_API_URL;

const api = {
  get: async (endpoint, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API error');
    }
    return response.json();
  },
  post: async (endpoint, data, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API error');
    }
    return response.json();
  },
  put: async (endpoint, data, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API error');
    }
    return response.json();
  },
  patch: async (endpoint, data, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API error');
    }
    return response.json();
  },
  delete: async (endpoint, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API error');
    }
    return response.json();
  },
};

export default api;
