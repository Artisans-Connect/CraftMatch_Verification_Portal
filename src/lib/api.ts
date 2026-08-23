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
    const errorMsg = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : null) || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }
  return (json?.data ?? json) as T;
}

export async function apiPostMultipart<T>(path: string, formData: FormData): Promise<T> {
  if (!apiBaseUrl) throw new Error('Missing VITE_EXPRESS_API_BASE_URL');

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : null) || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }
  return (json?.data ?? json) as T;
}

import { supabaseAdminClient } from './supabase';

async function fallbackAdminGet<T>(path: string): Promise<T> {
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/admin/blocked-and-reported') {
    const { data: accounts } = await supabaseAdminClient
      .from('profiles')
      .select('id, full_name, phone, signup_type, last_active_mode, avatar_url, account_status, suspended_at, suspension_reason, created_at, updated_at, workers(id, is_available, is_verified, rating, total_jobs, skills, service_areas)')
      .in('account_status', ['suspended', 'warned'])
      .order('updated_at', { ascending: false });

    let reports: any[] = [];
    try {
      const { data } = await supabaseAdminClient.from('reports').select('*').order('created_at', { ascending: false });
      reports = data || [];
    } catch (_) {}

    return {
      blockedAccounts: accounts || [],
      reports: reports || [],
    } as unknown as T;
  }

  if (cleanPath === '/admin/accounts') {
    const url = new URL(path, 'http://localhost');
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');
    const q = url.searchParams.get('q');

    let query = supabaseAdminClient
      .from('profiles')
      .select('id, full_name, phone, signup_type, last_active_mode, avatar_url, account_status, suspended_at, suspension_reason, created_at, updated_at, workers(id, is_available, is_verified, rating, total_jobs, skills, service_areas)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status === 'active' || status === 'suspended' || status === 'warned') {
      query = query.eq('account_status', status);
    }
    if (role === 'client' || role === 'worker') {
      query = query.or(`signup_type.eq.${role},last_active_mode.eq.${role}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let accounts = data || [];
    if (role === 'verified_worker') {
      accounts = accounts.filter((a) => {
        const worker = Array.isArray(a.workers) ? a.workers[0] : a.workers;
        return Boolean(worker?.is_verified);
      });
    }
    if (q) {
      const search = q.toLowerCase();
      accounts = accounts.filter(
        (a) =>
          (a.full_name || '').toLowerCase().includes(search) ||
          (a.phone || '').toLowerCase().includes(search) ||
          a.id.toLowerCase() === search,
      );
    }
    return accounts as unknown as T;
  }

  if (cleanPath.startsWith('/admin/accounts/')) {
    const id = cleanPath.replace('/admin/accounts/', '').trim();
    const { data: profile } = await supabaseAdminClient
      .from('profiles')
      .select('*, workers(*)')
      .eq('id', id)
      .maybeSingle();

    const { data: verifications } = await supabaseAdminClient
      .from('worker_verifications')
      .select('*')
      .eq('worker_id', id)
      .order('submitted_at', { ascending: false });

    return {
      profile: { ...profile, workers: profile?.workers },
      auth_user: null,
      verifications: verifications || [],
      recent_jobs: [],
    } as unknown as T;
  }

  if (cleanPath === '/admin/reports') {
    try {
      const { data } = await supabaseAdminClient.from('reports').select('*').order('created_at', { ascending: false });
      return (data || []) as unknown as T;
    } catch (_) {
      return [] as unknown as T;
    }
  }

  if (cleanPath === '/verification/admin/applications') {
    const { data, error } = await supabaseAdminClient
      .from('worker_verifications')
      .select('*, workers(*, profiles(*))')
      .order('submitted_at', { ascending: false });
    if (!error && data) return data as unknown as T;
  }

  if (cleanPath === '/admin/dashboard-stats') {
    const [
      { count: suspendedCount },
      { count: totalCount },
      { count: workerCount },
      { count: verifiedWorkerCount },
    ] = await Promise.all([
      supabaseAdminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'suspended'),
      supabaseAdminClient.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdminClient.from('workers').select('*', { count: 'exact', head: true }),
      supabaseAdminClient.from('workers').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    ]);

    return {
      escrow: { total_locked: 0, platform_fees: 0 },
      jobs: { total: 0, active: 0, completed: 0, cancelled: 0 },
      users: {
        totalAccounts: totalCount ?? 0,
        suspendedAccounts: suspendedCount ?? 0,
        totalWorkers: workerCount ?? 0,
        verifiedWorkers: verifiedWorkerCount ?? 0,
      },
      recent_transactions: [],
    } as unknown as T;
  }

  throw new Error(`Fallback not implemented for ${path}`);
}

async function fallbackAdminRequest<T>(path: string, options: { method: string; body?: any }): Promise<T> {
  const cleanPath = path.split('?')[0];

  if (cleanPath.startsWith('/admin/accounts/') && cleanPath.endsWith('/reactivate')) {
    const id = cleanPath.replace('/admin/accounts/', '').replace('/reactivate', '').trim();
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .update({ account_status: 'active', suspended_at: null, suspension_reason: null, updated_at: now })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as unknown as T;
  }

  if (cleanPath.startsWith('/admin/accounts/') && cleanPath.endsWith('/suspend')) {
    const id = cleanPath.replace('/admin/accounts/', '').replace('/suspend', '').trim();
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .update({ account_status: 'suspended', suspended_at: now, suspension_reason: options.body?.reason || 'Suspended by admin', updated_at: now })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as unknown as T;
  }

  if (cleanPath.startsWith('/admin/accounts/') && cleanPath.endsWith('/warn')) {
    const id = cleanPath.replace('/admin/accounts/', '').replace('/warn', '').trim();
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .update({ account_status: 'warned', suspension_reason: `Official Warning: ${options.body?.reason || 'Policy reminder'}`, updated_at: now })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as unknown as T;
  }

  throw new Error(`Fallback not implemented for request to ${path}`);
}

export async function adminGet<T>(path: string): Promise<T> {
  if (apiBaseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...adminHeaders(),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await response.json().catch(() => null);
      if (response.ok) {
        return (json?.data ?? json) as T;
      }
      const errorMsg = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : null) || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMsg);
    } catch (err: any) {
      if (err instanceof Error && !err.name.includes('AbortError') && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
      // Fallback to direct Supabase query on network failure
    }
  }

  return fallbackAdminGet<T>(path);
}

export async function adminPatch<T>(path: string, body: unknown): Promise<T> {
  return adminRequest<T>(path, { method: 'PATCH', body });
}

export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  return adminRequest<T>(path, { method: 'POST', body });
}

export async function adminPut<T>(path: string, body: unknown): Promise<T> {
  return adminRequest<T>(path, { method: 'PUT', body });
}

export async function adminRequest<T>(
  path: string,
  options: { method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown },
): Promise<T> {
  if (apiBaseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...adminHeaders(),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await response.json().catch(() => null);
      if (response.ok) {
        return (json?.data ?? json) as T;
      }
      const errorMsg = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : null) || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMsg);
    } catch (err: any) {
      if (err instanceof Error && !err.name.includes('AbortError') && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
      // Fallback to direct Supabase request on network failure
    }
  }

  return fallbackAdminRequest<T>(path, options);
}

export async function adminPostMultipart<T>(path: string, formData: FormData): Promise<T> {
  if (!apiBaseUrl) throw new Error('Missing VITE_EXPRESS_API_BASE_URL');

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...adminHeaders(),
    },
    body: formData,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg =
      json?.error?.message ||
      json?.message ||
      (typeof json?.error === 'string' ? json.error : null) ||
      `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }
  return (json?.data ?? json) as T;
}


