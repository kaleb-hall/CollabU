import api from './api';

export const projectService = {
  // Get all projects
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Get single project
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create project
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Remove member from project
  removeMember: async (projectId, memberId) => {
    await api.delete(`/projects/${projectId}/members/${memberId}`);
  },

  // This week's hours per member
  getWorkload: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/workload`);
    return response.data;
  },

  // Activity feed, newest first. Pass the previous page's next_cursor as `before`.
  getActivity: async (projectId, before) => {
    const response = await api.get(`/projects/${projectId}/activity`, { params: { before } });
    return response.data;
  },

  // Finishing a project
  complete: async (projectId) => (await api.post(`/projects/${projectId}/complete`)).data,
  reopen: async (projectId) => (await api.post(`/projects/${projectId}/reopen`)).data,
  setLocked: async (projectId, locked) => (await api.put(`/projects/${projectId}/lock`, { locked })).data,
  setArchived: async (projectId, archived) => (await api.put(`/projects/${projectId}/archive`, { archived })).data,
  sendFinalNote: async (projectId, message) => (await api.post(`/projects/${projectId}/final-note`, { message })).data,
  getSummary: async (projectId) => (await api.get(`/projects/${projectId}/summary`)).data,

  // My own settings on one project (email me big updates)
  updateMySettings: async (projectId, settings) => (await api.put(`/projects/${projectId}/my-settings`, settings)).data,
};
