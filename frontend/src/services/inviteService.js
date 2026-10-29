import api from './api';

export const inviteService = {
  // Public: anyone with the link can see who invited them
  get: async (token) => {
    const response = await api.get(`/invites/${token}`);
    return response.data;
  },

  accept: async (token) => {
    const response = await api.post(`/invites/${token}/accept`);
    return response.data;
  },

  listForProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/invites`);
    return response.data;
  },

  create: async (projectId, invite) => {
    const response = await api.post(`/projects/${projectId}/invites`, invite);
    return response.data;
  },

  cancel: async (projectId, inviteId) => {
    await api.delete(`/projects/${projectId}/invites/${inviteId}`);
  },
};
