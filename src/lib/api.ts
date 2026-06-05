const apiBaseUrl = import.meta.env.VITE_EXPRESS_API_BASE_URL || import.meta.env.EXPRESS_API_BASE_URL || '';

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!apiBaseUrl) throw new Error('Missing VITE_EXPRESS_API_BASE_URL');

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || 'Request failed');
  }
  return (json?.data ?? json) as T;
}
