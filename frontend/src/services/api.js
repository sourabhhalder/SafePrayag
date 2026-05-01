import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const signup        = (d) => api.post('/auth/signup', d);
export const login         = (d) => api.post('/auth/login', d);
export const getProfile    = ()  => api.get('/auth/profile');
export const updateProfile = (d) => api.put('/auth/profile', d);

// Route
export const analyseRoute  = (d) => api.post('/route/analyse', d);
export const predictPoint  = (p) => api.get('/predict', { params: p });

// SOS
export const triggerSOS   = (d) => api.post('/sos/trigger', d);
export const sendLocation = (d) => api.post('/sos/location-update', d);

// Incidents
export const reportIncident = (d) => api.post('/incidents/report', d);

// Data
export const getHeatmap      = ()      => api.get('/heatmap');
export const getDashboard    = ()      => api.get('/stats/dashboard');
export const getExtraStats   = ()      => api.get('/stats/extra');
export const getPoliceStations = (lat, lon) =>
  api.get('/police-stations', { params: lat ? { lat, lon } : {} });

export default api;
