import axios from 'axios';
import TokenService from './token';
import router from '@/router';

const axiosService = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  timeout: 5000,
});

// Handling requests
axiosService.interceptors.request.use(async (request) => {
  // Set JWT according to request
  const token = ['/auth/refresh', '/auth/logout'].includes(request.url)
    ? TokenService.getRefreshToken()
    : await TokenService.getToken(false);

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

// Handling responses
axiosService.interceptors.response.use(
  (response) => {
    if (
      ['/auth/login', '/auth/setup', '/auth/refresh'].some((v) =>
        response.config.url.includes(v)
      )
    ) {
      TokenService.updateToken(response.data.token);
      TokenService.updateRefreshToken(response.data.refreshToken);
    }

    return response;
  },
  async (error) => {
    const originalConfig = error.config;

    if (originalConfig.url !== '/auth/refresh' && error.response) {
      // Access Token was expired
      if (error.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        try {
          // Call for refresh
          // Let the successful-response-handler update tokens
          await axiosService.post('/auth/refresh');

          return axiosService(originalConfig);
        } catch (_error) {
          router.push({ name: 'login' });
          return Promise.reject(_error);
        }
      } else if (error.response.status === 401 && originalConfig._retry) {
        // Refresh failed
        TokenService.removeToken();
        router.push({ name: 'login' });
      }
    }

    return Promise.reject(error);
  }
);

export default axiosService;
