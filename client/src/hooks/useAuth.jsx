import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.getMe();
      setUser(response.data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const response = await api.login(credentials);
    if (!response.success) {
      throw new Error(response.error || 'Login failed');
    }
    api.setAuthToken(response.token);
    setUser(response.user);
    // Invalidate and refetch queries after login
    queryClient.invalidateQueries();
    return response;
  };

  const register = async (data) => {
    const response = await api.register(data);
    if (response.success) {
      api.setAuthToken(response.token);
      setUser(response.user);
      // Invalidate and refetch queries after register
      queryClient.invalidateQueries();
    }
    return response;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    queryClient.clear();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}