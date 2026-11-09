export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Subclass of Error so every existing `catch (err) { err.message }` call site
// keeps working unchanged; new code can additionally branch on status/detail
// (e.g. 403 vs 404 vs 409 join_code_requires_paid_tier).
export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function isApiError(err: unknown, status?: number): err is ApiError {
  return err instanceof ApiError && (status === undefined || err.status === status);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Free ngrok tunnels serve an HTML interstitial to browser-originated
      // requests unless this is set, which would break res.json() below.
      // Harmless against a non-ngrok backend (Render ignores it).
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = typeof body.detail === 'string' ? body.detail : `Request failed: ${res.status}`;
    throw new ApiError(res.status, body.detail, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
