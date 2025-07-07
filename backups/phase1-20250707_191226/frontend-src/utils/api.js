import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running. Please start it with: npm run dev');
    }
    return Promise.reject(error);
  }
);

// API methods
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

export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
