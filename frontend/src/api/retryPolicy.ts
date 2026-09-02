/**
 * Retry Policy with Exponential Backoff and Jitter
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
  retryableMethods: string[];
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 400,
  maxDelayMs: 4000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS'],
};

/**
 * Calculates exponential backoff delay with jitter
 */
export const calculateBackoffDelay = (
  retryCount: number,
  config: RetryConfig = defaultRetryConfig,
  retryAfterHeader?: string
): number => {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return Math.min(seconds * 1000, config.maxDelayMs);
    }
  }

  const exponential = config.baseDelayMs * Math.pow(2, retryCount - 1);
  const jitter = Math.random() * (config.baseDelayMs * 0.5);
  return Math.min(exponential + jitter, config.maxDelayMs);
};

/**
 * Determines whether an Axios error should trigger a retry attempt.
 */
export const shouldRetry = (
  error: any,
  config: RetryConfig = defaultRetryConfig
): boolean => {
  const customConfig = error?.config;
  if (!customConfig || customConfig._skipRetry) {
    return false;
  }

  const currentCount = customConfig._retryCount || 0;
  if (currentCount >= config.maxRetries) {
    return false;
  }

  const method = (customConfig.method || 'GET').toUpperCase();

  // Network errors (no response received, disconnection, timeout)
  if (!error.response) {
    return config.retryableMethods.includes(method) || error.code === 'ECONNABORTED';
  }

  const status = error.response.status;

  // Rate Limiting (429) is retryable for any method if retry count allows
  if (status === 429) {
    return true;
  }

  // Idempotent methods can retry on server 5xx and timeout 408
  if (config.retryableMethods.includes(method) && config.retryableStatuses.includes(status)) {
    return true;
  }

  return false;
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
