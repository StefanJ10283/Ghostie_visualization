import { API } from './config';

/**
 * Returns a fetch wrapper that automatically attaches the JWT
 * and routes through the middleware.
 *
 * Usage:
 *   const api = useApiClient();
 *   const res = await api('/analytical-model/sentiment?...');
 */
export function makeApiClient(token) {
  return (path, options = {}) => {
    const url = `${API.middleware}${path}`;
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };
}
