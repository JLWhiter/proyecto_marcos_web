import { api } from './client';

export function listarInventario(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/inventario${qs ? `?${qs}` : ''}`);
}

export function obtenerInventario(id) {
  return api(`/inventario/${id}`);
}

export function actualizarInventario(id, data) {
  return api(`/inventario/${id}`, { method: 'PUT', body: data });
}
