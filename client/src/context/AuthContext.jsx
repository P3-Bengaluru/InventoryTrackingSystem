import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
    }
    // If we have a token, try to fetch user data
    if (storedToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch (err) {
      // Token invalid or expired
      console.warn('Failed to fetch user', err);
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken } = response;
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      // Fetch user data
      await fetchUser();
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    // Optionally call logout endpoint to invalidate refresh token
    api.post('/api/auth/logout', {}).catch(() => {});
  };

  const value = { user, token, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
