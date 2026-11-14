import api from './api';

export const commentService = {
  list: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  add: async (taskId, body) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { body });
    return response.data;
  },

  remove: async (taskId, commentId) => {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};
