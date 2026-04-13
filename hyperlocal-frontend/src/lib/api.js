import axios from 'axios';

/** Supports VITE_API_BASE_URL=http://localhost:3001 or .../api/v1 */
function apiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
  if (raw.endsWith('/api/v1')) return raw;
  return `${raw}/api/v1`;
}

const baseURL = apiBaseUrl();

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Leading "/" would drop the /api/v1 segment when resolving against baseURL in the browser.
api.interceptors.request.use((config) => {
  const u = config.url;
  if (typeof u === 'string' && u.startsWith('/')) {
    config.url = u.slice(1);
  }
  return config;
});

/** Call from login / hydrate / logout so protected routes send the token automatically. */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message ?? err.message ?? 'Request failed';
    return Promise.reject(new Error(msg));
  }
);
