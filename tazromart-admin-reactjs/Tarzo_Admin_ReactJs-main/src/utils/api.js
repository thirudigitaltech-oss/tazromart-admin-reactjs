import axios from 'axios';

// ⚙️ Same backend, just consumed from the browser instead of the RN app.
// Point this at your existing API base URL (env var keeps it deploy-friendly).
// Vite exposes env vars via `import.meta.env.VITE_*` in the browser.
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.grabzomart.in/api/admin';

export const adminApi = axios.create({
  baseURL: BASE_URL,
});

// Attach the admin token (was AsyncStorage on RN, localStorage on web)
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401, same idea as the RN screens' catch-blocks that
// bounce back to AdminLogin when a request fails.
adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default adminApi;
