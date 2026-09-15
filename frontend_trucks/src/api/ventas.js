import { api } from './client';

export function registrarVenta(data) {
  return api('/ventas', { method: 'POST', body: data });
}

export function listarVentas(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/ventas${qs ? `?${qs}` : ''}`);
}

export function cambiarEstadoPago(ventaId) {
  return api(`/ventas/${ventaId}/estado-pago`, { method: 'PATCH' });
}

export function actualizarVendedor(ventaId, id_usuario) {
  return api(`/ventas/${ventaId}/vendedor`, { method: 'PATCH', body: { id_usuario } });
}

export function actualizarFinanciero(ventaId, data) {
  return api(`/ventas/${ventaId}/financiero`, { method: 'PATCH', body: data });
}
