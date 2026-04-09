import axios from 'axios';

// Create an Axios instance with base configuration
export const apiClient = axios.create({
  baseURL: '/api/v1', // Proxied by Vite to http://localhost:8000
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Helper to manage access token in memory
let accessToken: string | null = localStorage.getItem('access_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = () => accessToken;

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables to handle atomic token refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Response interceptor to handle token refresh with atomic locking
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // If an update is already in progress, wait for it
        if (isRefreshing) {
          const newToken = await refreshPromise;
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }

        // Start new refresh process
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const refreshResponse = await axios.post('/api/v1/auth/token/refresh', {}, { withCredentials: true });
            const newToken = refreshResponse.data?.access_token;
            if (newToken) {
              setAccessToken(newToken);
              return newToken;
            }
            return null;
          } catch (e) {
            return null;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();

        const newToken = await refreshPromise;
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          // Refresh failed definitely
          setAccessToken(null);
          const publicPages = ['/login', '/register'];
          if (!publicPages.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
