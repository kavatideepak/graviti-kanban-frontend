import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Attach the acting user (MVP stand-in for auth) on every request.
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('kanban.userId');
  if (userId) config.headers['X-User-Id'] = userId;
  return config;
});
