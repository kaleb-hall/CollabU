import api from './api';

export const calendarService = {
  // Get all calendar blocks for current user
  getCalendarBlocks: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await api.get(`/calendar/blocks?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar blocks:', error);
      return { blocks: [] }; // Return empty blocks on error
    }
  },

  // Create calendar block
  createCalendarBlock: async (blockData) => {
    const response = await api.post('/calendar/blocks', blockData);
    return response.data;
  },

  // Update calendar block
  updateCalendarBlock: async (blockId, blockData) => {
    const response = await api.put(`/calendar/blocks/${blockId}`, blockData);
    return response.data;
  },

  // Delete calendar block
  deleteCalendarBlock: async (blockId) => {
    const response = await api.delete(`/calendar/blocks/${blockId}`);
    return response.data;
  },

  // Get availability
  getAvailability: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/calendar/availability?${params.toString()}`);
    return response.data;
  },
};
