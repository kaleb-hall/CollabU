import axios from 'axios';
import { tokens } from '../lib/tokens';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokens.access();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// The auth provider registers what to do when the session is no longer valid.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Requests whose 401 means "wrong password" or "log in again", never "refresh and retry"
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh'];

// While one refresh is in flight, every expired request waits for that same one
let refreshing = null;
function refreshAccessToken() {
  refreshing ??= api
    .post('/auth/refresh', null, { headers: { Authorization: `Bearer ${tokens.refresh()}` } })
    .then((response) => {
      tokens.save(response.data);
      return response.data.access_token;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || NO_REFRESH.includes(config?.url)) return Promise.reject(error);

    const expired = response.data?.error?.code === 'TOKEN_EXPIRED';
    if (expired && !config.retried && tokens.refresh()) {
      try {
        const access = await refreshAccessToken();
        return api({ ...config, retried: true, headers: { ...config.headers, Authorization: `Bearer ${access}` } });
      } catch {
        // The refresh token is gone or expired too: fall through and log out
      }
    }
    onUnauthorized();
    return Promise.reject(error);
  }
);

export default api;
