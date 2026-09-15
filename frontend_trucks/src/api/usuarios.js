import { api } from './client';

export function listarUsuarios(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/usuarios${qs ? `?${qs}` : ''}`);
}

export function crearUsuario(data) {
  return api('/usuarios', { method: 'POST', body: data });
}

export function actualizarUsuario(id, data) {
  return api(`/usuarios/${id}`, { method: 'PUT', body: data });
}

export function eliminarUsuario(id) {
  return api(`/usuarios/${id}`, { method: 'DELETE' });
}

export function activarUsuario(id) {
  return api(`/usuarios/${id}/activar`, { method: 'PUT' });
}

export function listarRoles() {
  return api('/usuarios/roles');
}
