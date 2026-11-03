// Thin fetch wrapper. Sends the session cookie, surfaces API errors, and
// prefixes VITE_API_URL when the SPA is hosted separately from the API.

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!res.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return payload as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body });
export const put = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body });
