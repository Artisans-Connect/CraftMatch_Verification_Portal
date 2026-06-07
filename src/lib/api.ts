const apiBaseUrl = import.meta.env.VITE_EXPRESS_API_BASE_URL || import.meta.env.EXPRESS_API_BASE_URL || '';
const verificationAdminKey = import.meta.env.VITE_VERIFICATION_ADMIN_KEY || '';

function adminHeaders(): HeadersInit {
  return verificationAdminKey
    ? { 'x-verification-admin-key': verificationAdminKey }
    : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  if (!apiBaseUrl) throw new Error('Missing VITE_EXPRESS_API_BASE_URL');

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || 'Request failed');
  }
  return (json?.data ?? json) as T;
}

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

export async function adminGet<T>(path: string): Promise<T> {
  if (!apiBaseUrl) throw new Error('Missing VITE_EXPRESS_API_BASE_URL');

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...adminHeaders(),
    },
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || 'Request failed');
  }
  return (json?.data ?? json) as T;
}

export async function adminPatch<T>(path: string, body: unknown): Promise<T> {
  if (!apiBaseUrl) throw new Error('Missing VITE_EXPRESS_API_BASE_URL');

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...adminHeaders(),
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || 'Request failed');
  }
  return (json?.data ?? json) as T;
}
