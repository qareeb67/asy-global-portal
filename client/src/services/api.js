import axios from 'axios';

// Production fallback keeps the deployed frontend connected even if
// VITE_API_URL was missed in Render.
const productionFallback = 'https://asy-global-portal-sav2.onrender.com';

const configuredBaseUrl =
  (import.meta.env.VITE_API_URL || productionFallback).trim();

const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');

const apiBaseUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 20000
});

export { apiBaseUrl };