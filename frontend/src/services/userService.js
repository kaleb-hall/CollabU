import api from './api';

export const userService = {
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (changes) => {
    const response = await api.put('/users/me', changes);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.put('/users/me/password', { current_password: currentPassword, new_password: newPassword });
  },
};
