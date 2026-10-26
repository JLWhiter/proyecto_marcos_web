import { api } from './client';

function qs(params = {}) {
  return new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
}

export function inventarioPorUbicacion(codigo) {
  return api(`/gestion/inventario/ubicacion?${qs({ codigo })}`);
}

export function listarProductosInventario(q = '') {
  return api(`/gestion/inventario/productos?${qs({ q })}`);
}

export function listarUbicaciones() {
  return api('/gestion/ubicaciones');
}

export function listarDanos(estado = '') {
  return api(`/gestion/danos?${qs({ estado })}`);
}

export function confirmarDano(id) {
  return api(`/gestion/danos/${id}/confirmar`, { method: 'POST' });
}

export function rechazarDano(id) {
  return api(`/gestion/danos/${id}/rechazar`, { method: 'POST' });
}

export function ajustarInventario(data) {
  return api('/gestion/ajustes', { method: 'POST', body: data });
}

export function listarAjustes() {
  return api('/gestion/ajustes');
}

export function listarAlertas() {
  return api('/gestion/alertas');
}

export function emitirOrdenCompra(alertaId, data) {
  return api(`/gestion/alertas/${alertaId}/orden-compra`, { method: 'POST', body: data });
}

export function listarOrdenesCompra() {
  return api('/gestion/ordenes-compra');
}

export function dashboard(periodo = 'mes') {
  return api(`/gestion/dashboard?${qs({ periodo })}`);
}
