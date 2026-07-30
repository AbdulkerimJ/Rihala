import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
  timeout: 10000, // 10 seconds
});

// We don't store accessToken in localStorage, we will inject it from AuthContext or a closure.
// However, Axios interceptors are global/singleton. To make it work elegantly without circular dependencies,
// we'll provide a way to inject the token getter/setter.
let getAccessToken = () => null;
let setAccessToken = () => {};
let logoutUser = () => {};

export const setupInterceptors = (getToken, setToken, logout) => {
  getAccessToken = getToken;
  setAccessToken = setToken;
  logoutUser = logout;
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      // Authorization header is attached here so every request uses the most up-to-date access token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept refresh or login calls
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // _retry prevents infinite retry loops if the newly issued request also returns 401
      originalRequest._retry = true;

      try {
        // Plain axios is used here instead of the 'api' instance to avoid recursive interceptor loops.
        // withCredentials is required to automatically send the httpOnly refresh token cookie to the server.
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
          withCredentials: true
        });
        
        const newAccessToken = data.data.accessToken; 
        setAccessToken(newAccessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        logoutUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
