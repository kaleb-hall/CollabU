import api from './api';

export const userService = {
  // Search users
  searchUsers: async (query) => {
    const response = await api.get(`/users?search=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update current user
  updateProfile: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },
};
