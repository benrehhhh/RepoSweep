let csrfToken = null;
let sessionExpiredHandler = null;

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export function getCsrfToken() {
  return csrfToken;
}

export function onSessionExpired(fn) {
  sessionExpiredHandler = fn;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response, path) {
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      !path.startsWith('/auth/') &&
      sessionExpiredHandler
    ) {
      // Session expired server-side (idle/absolute timeout): re-check auth
      // so the app signs the user out and redirects, instead of showing a
      // stale page. Auth endpoints are skipped to avoid a logout() loop.
      sessionExpiredHandler();
    }
    const message =
      (data && data.error) ||
      (response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : response.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : response.status >= 500
            ? 'Something went wrong on the server. Please try again.'
            : 'The request failed. Please try again.');
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function request(method, path, body) {
  const options = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  if (method !== 'GET' && method !== 'HEAD' && csrfToken) {
    options.headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    const response = await fetch(`/api${path}`, options);
    return await handleResponse(response, path);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Could not reach RepoSweep. Make sure the backend is running.',
      0,
      null
    );
  }
}

export const http = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  del: (path) => request('DELETE', path),
};