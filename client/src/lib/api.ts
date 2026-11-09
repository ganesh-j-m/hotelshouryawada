/** Base URL of the API. Empty = same origin (dev proxy or single-service deployment). */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

type Body = Record<string, unknown> | unknown[] | FormData;

async function request<T>(method: string, path: string, body?: Body, signal?: AbortSignal): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, 'Could not reach the server. Please check your connection.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    // Admin session expired → let the dashboard return to the sign-in screen
    if (res.status === 401 && path.startsWith('/api/admin')) window.dispatchEvent(new Event('sw:unauthorized'));
    throw new ApiError(res.status, data?.error ?? 'Something went wrong. Please try again.', data?.fields ?? {});
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: Body) => request<T>('POST', path, body),
  put: <T>(path: string, body: Body) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: Body) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/** Resolves an image URL stored in the DB (relative "/uploads/…" or absolute). */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}
