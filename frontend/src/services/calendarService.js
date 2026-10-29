import api from './api';

export const calendarService = {
  // One entry per occurrence between start and end (repeating blocks appear many times)
  getCalendarBlocks: async (start, end) => {
    const response = await api.get('/calendar/blocks', {
      params: { start: start.toISOString(), end: end.toISOString() },
    });
    return response.data;
  },

  createCalendarBlock: async (blockData) => {
    const response = await api.post('/calendar/blocks', blockData);
    return response.data;
  },

  updateCalendarBlock: async (blockId, blockData) => {
    const response = await api.put(`/calendar/blocks/${blockId}`, blockData);
    return response.data;
  },

  deleteCalendarBlock: async (blockId) => {
    await api.delete(`/calendar/blocks/${blockId}`);
  },
};
