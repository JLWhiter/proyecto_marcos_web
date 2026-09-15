import { api } from './client';

export function listarProductos(perPage = 20, q = "", page = 1) {
  const params = new URLSearchParams();
  params.set('per_page', String(perPage));
  params.set('page', String(page));
  if (q) params.set('q', q);
  return api(`/productos?${params.toString()}`);
}

export function listarInventario(perPage = 200, q = "") {
  const params = new URLSearchParams();
  params.set('per_page', String(perPage));
  if (q) params.set('q', q);
  return api(`/inventario?${params.toString()}`);
}

export function registrarProducto(data) {
  return api('/productos/registrar', { method: 'POST', body: data });
}

export function actualizarProducto(id, data) {
  return api(`/productos/${id}`, { method: 'PUT', body: data });
}

export function eliminarProducto(id) {
  return api(`/productos/${id}`, { method: 'DELETE' });
}

export function subirImagenProducto(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('trucks_token');
  return fetch(`/api/v1/productos/${id}/imagen`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(r => r.json());
}

