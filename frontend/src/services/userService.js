import api from './api';

export const userService = {
  searchUsers: async (query = '') => {
    const response = await api.get('/users', { params: { search: query } });
    return response.data;
  },
};
