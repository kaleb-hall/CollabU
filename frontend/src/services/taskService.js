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

  // Run the deadline scheduling algorithm. Work hours are in the user's timezone.
  calculateSchedule: async (projectId, timezone) => {
    const response = await api.post(`/projects/${projectId}/schedule`, { timezone });
    return response.data;
  },
};
