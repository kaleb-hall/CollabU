import api from './api';

export const fileService = {
  list: async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/files`, { params: { task_id: taskId } });
    return response.data;
  },

  upload: async (projectId, file, taskId) => {
    const form = new FormData();
    form.append('file', file);
    if (taskId) form.append('task_id', taskId);
    // Tell axios this is a form so the browser adds the multipart boundary
    const response = await api.post(`/projects/${projectId}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Downloads need the login token, so fetch the bytes and hand them to the browser
  download: async (file) => {
    const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  remove: async (fileId) => {
    await api.delete(`/files/${fileId}`);
  },
};
