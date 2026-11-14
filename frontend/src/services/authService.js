import api from './api';
import { userTimeZone } from '../lib/dates';
import { tokens } from '../lib/tokens';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', { ...userData, timezone: userTimeZone() });
    if (response.data.access_token) {
      tokens.save(response.data);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', { ...credentials, timezone: userTimeZone() });
    if (response.data.access_token) {
      tokens.save(response.data);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    tokens.clear();
    localStorage.removeItem('user');
  },

  saveUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
