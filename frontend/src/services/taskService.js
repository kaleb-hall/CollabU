import api from './api';

export const taskService = {
  // Get tasks for a project
  getProjectTasks: async (projectId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/tasks/project/${projectId}?${params}`);
    return response.data;
  },

  // Get my tasks
  getMyTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/tasks/my-tasks?${params}`);
    return response.data;
  },

  // Get single task
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create task
  createTask: async (projectId, taskData) => {
    const response = await api.post(`/tasks/project/${projectId}`, taskData);
    return response.data;
  },

  // Update task
  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (id, status) => {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data;
  },

  // Delete task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Calculate schedule (deadline algorithm!)
  calculateSchedule: async (projectId) => {
    const response = await api.post(`/deadline/projects/${projectId}/calculate-schedule`);
    return response.data;
  },
};
