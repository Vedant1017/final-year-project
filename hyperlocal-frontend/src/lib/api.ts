export type ApiResult<T> = { success: true } & T;

const defaultBase = 'http://localhost:3001/api/v1';
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? defaultBase;

export async function apiFetch<T>(
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const contentType = res.headers.get('content-type') ?? '';
  const text = await res.text();
  const isJson = contentType.toLowerCase().includes('application/json');
  const data = text && isJson ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      data?.message ??
      (isJson
        ? `Request failed (${res.status})`
        : `Request failed (${res.status}). Expected JSON but got: ${contentType || 'unknown'} from ${url}`);
    throw new Error(msg);
  }

  if (!isJson) {
    throw new Error(`Expected JSON but got: ${contentType || 'unknown'} from ${url}`);
  }

  return data as T;
}

