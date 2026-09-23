import axios from 'axios';

const LOCAL_API_ORIGIN = 'http://localhost:5000';
const LIVE_API_ORIGIN = 'https://asy-global-portal-sav2.onrender.com';

const apiOrigin = import.meta.env.PROD
  ? LIVE_API_ORIGIN
  : (import.meta.env.VITE_API_URL || LOCAL_API_ORIGIN);

const normalizedOrigin = apiOrigin.replace(/\/+$/, '');

const baseURL = normalizedOrigin.endsWith('/api')
  ? normalizedOrigin
  : `${normalizedOrigin}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000
});

export { baseURL };