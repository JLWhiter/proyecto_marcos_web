const API_BASE = '/api/v1';
const TOKEN_KEY = 'trucks_token';
const USER_KEY = 'trucks_user';
let currentUser = null;

export async function api(path, { method = 'GET', body, ...rest } = {}) {
  const isFormData = body instanceof FormData;
  const headers = { ...rest.headers };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...rest,
    credentials: 'same-origin',
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
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
  currentUser = data?.usuario || null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentUser = null;
}

export function getUser() {
  return currentUser;
}
