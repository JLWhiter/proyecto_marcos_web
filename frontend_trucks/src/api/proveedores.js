import { api } from './client';

export function listarProveedores() {
  return api('/proveedores');
}

export function crearProveedor(data) {
  return api('/proveedores', { method: 'POST', body: data });
}
