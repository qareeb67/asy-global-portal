import axios from 'axios';
import generatedApiUrl from '../generated-api-url.js';

const apiBaseUrl = generatedApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});
