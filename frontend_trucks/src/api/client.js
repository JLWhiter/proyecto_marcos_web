const API_BASE = '/api/v1';
const TOKEN_KEY = 'trucks_token';
const USER_KEY = 'trucks_user';

export async function api(path, { method = 'GET', body, ...rest } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  let data = null;
  try {
    data = await res.json();
  } catch { /* sin JSON */ }

  if (!res.ok) {
    const msg = (data && (data.error || data.mensaje)) || `Error ${res.status}`;
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      clearSession();
      sessionStorage.setItem('trucks_unauthorized', msg);
      window.dispatchEvent(new CustomEvent('trucks:unauthorized', { detail: { message: msg } }));
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data || {};
}

export function setSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}
