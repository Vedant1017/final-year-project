export type ApiResult<T> = { success: true } & T;

const defaultBase = 'http://localhost:3001/api/v1';
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? defaultBase;

export async function apiFetch<T>(
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

