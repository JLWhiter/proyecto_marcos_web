import { api } from './client';

export function login(usuario, contrasena) {
  return api('/auth/login', { method: 'POST', body: { usuario, contrasena } });
}

export function logout() {
  return api('/auth/logout', { method: 'POST' });
}

export function me() {
  return api('/auth/me', { method: 'GET' });
}

export function actualizarPerfil(data) {
  return api('/auth/me', { method: 'PUT', body: data });
}

export function subirFotoPerfil(file) {
  const form = new FormData();
  form.append('file', file);
  const headers = {};
  const token = localStorage.getItem('trucks_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch('/api/v1/auth/me/foto', { method: 'POST', headers, body: form })
    .then(async (res) => {
      let data = null;
      try { data = await res.json(); } catch { /* sin JSON */ }
      if (!res.ok) throw new Error((data && (data.error || data.mensaje)) || `Error ${res.status}`);
      return data || {};
    });
}
