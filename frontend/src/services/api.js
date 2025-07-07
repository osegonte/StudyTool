import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const filesAPI = {
  getAll: () => api.get('/files'),
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  getMetadata: (fileId) => api.get(`/files/${fileId}/metadata`)
};

export const progressAPI = {
  get: (fileId) => api.get(`/progress/${fileId}`),
  update: (fileId, data) => api.post(`/progress/${fileId}`, data),
  getAll: () => api.get('/progress')
};

export const sessionsAPI = {
  start: (data) => api.post('/sessions/start', data),
  end: (sessionId, data) => api.post(`/sessions/end/${sessionId}`, data),
  getByFile: (fileId) => api.get(`/sessions/file/${fileId}`),
  getAll: (params) => api.get('/sessions/all', { params })
};

export const goalsAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (goalId, data) => api.put(`/goals/${goalId}`, data),
  delete: (goalId) => api.delete(`/goals/${goalId}`)
};

export const topicsAPI = {
  getAll: () => api.get('/topics'),
  create: (data) => api.post('/topics', data),
  update: (topicId, data) => api.put(`/topics/${topicId}`, data),
  delete: (topicId) => api.delete(`/topics/${topicId}`)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getReadingSpeed: (period = '30') => api.get('/analytics/reading-speed', { params: { period } }),
  getDailyActivity: (days = '30') => api.get('/analytics/daily-activity', { params: { days } }),
  getTopicsDistribution: () => api.get('/analytics/topics-distribution')
};

export default api;
