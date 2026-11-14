import api from './api';

export const notificationService = {
  list: async (before) => {
    const response = await api.get('/notifications', { params: { before } });
    return response.data;
  },

  unreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};
