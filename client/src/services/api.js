import axios from 'axios';

const productionApi =
  'https://asy-global-portal-sav2.onrender.com';

const configuredBaseUrl =
  import.meta.env.PROD
    ? productionApi
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

const normalizedBaseUrl = configuredBaseUrl
  .trim()
  .replace(/\/+$/, '');

const baseURL = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

export const api = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true
});

// Send the login token with every protected request.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('asy_access_token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { baseURL };