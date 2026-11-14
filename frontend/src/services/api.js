import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api', timeout: 15000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.response.use((response) => response.data, (error) => {
  const message = error.response?.data?.message || error.message || 'Unable to connect to the API';
  return Promise.reject(new Error(message));
});

export const resourceApi = {
  list: async (resource, params = {}) => await api.get(`/${resource}`, { params }),
  get: async (resource, id) => await api.get(`/${resource}/${id}`),
  create: async (resource, payload) => await api.post(`/${resource}`, payload),
  update: async (resource, id, payload) => await api.put(`/${resource}/${id}`, payload),
  remove: async (resource, id) => await api.delete(`/${resource}/${id}`)
};

export const dashboardApi = {
  summary: async (params = {}) => await api.get('/dashboard/summary', { params }),
  exerciseTrends: async (params = {}) => await api.get('/dashboard/exercise-trends', { params }),
  performanceTrends: async (params = {}) => await api.get('/dashboard/performance-trends', { params }),
  analyse: async (astronautId) => await api.post('/insights/analyse', { astronautId }),
  generateReport: async (payload) => await api.post('/reports/generate', payload)
};

export async function downloadCsv(reportId) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const response = await axios.get(`${base}/reports/${reportId}/export?format=csv`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a'); link.href = url; link.download = `orbitmsk-report-${reportId}.csv`; link.click(); URL.revokeObjectURL(url);
}
export default api;
