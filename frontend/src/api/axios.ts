import axios from 'axios';
import { globalCircuitBreaker } from './circuitBreaker';
import { shouldRetry, calculateBackoffDelay, sleep } from './retryPolicy';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15s timeout
});

// Request Interceptor: Circuit Breaker validation + Auth Token injection
api.interceptors.request.use(
  (config) => {
    // Check Circuit Breaker before making the network call
    globalCircuitBreaker.canPass();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Circuit Breaker state update + Exponential Backoff Retry Policy
api.interceptors.response.use(
  (response) => {
    // Record success in Circuit Breaker
    globalCircuitBreaker.recordSuccess();
    return response;
  },
  async (error: any) => {
    const config = error?.config;

    // Evaluate Retry Policy
    if (config && shouldRetry(error)) {
      config._retryCount = (config._retryCount || 0) + 1;

      const retryAfterHeader = error.response?.headers
        ? (error.response.headers['retry-after'] as string | undefined)
        : undefined;

      const delay = calculateBackoffDelay(config._retryCount, undefined, retryAfterHeader);

      console.warn(
        `[RetryPolicy] Reintentando ${config.method?.toUpperCase()} ${config.url} (Intento ${config._retryCount}/3) en ${Math.round(delay)}ms...`
      );

      await sleep(delay);
      return api(config);
    }

    // If retries exhausted or not retryable, record failure in Circuit Breaker on network/server errors
    if (!error.response || (error.response.status >= 500 && error.response.status <= 599)) {
      globalCircuitBreaker.recordFailure(error);
    }

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { globalCircuitBreaker };
