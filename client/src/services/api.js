import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});
