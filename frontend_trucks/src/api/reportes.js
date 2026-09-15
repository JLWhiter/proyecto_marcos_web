import { api } from './client';

export function valorInventario() {
  return api('/reportes/valor');
}

export function movimientosResumen(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/reportes/movimientos${qs ? `?${qs}` : ''}`);
}

export function ventasResumen(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/reportes/ventas${qs ? `?${qs}` : ''}`);
}

export function evolucionVentas(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/reportes/evolucion-ventas${qs ? `?${qs}` : ''}`);
}

export function getTasaCambio() {
  return api('/reportes/tasa-cambio');
}

export function setTasaCambio(tasa_cambio) {
  return api('/reportes/tasa-cambio', { method: 'PUT', body: { tasa_cambio } });
}

export function historialDia(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/reportes/historial${qs ? `?${qs}` : ''}`);
}

export function productosBajoStock() {
  return api('/inventario/bajo-stock');
}

export function reportarDano(data) {
  return api('/reportes/dano', { method: 'POST', body: data });
}

export function reportesDano(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/reportes/dano${qs ? `?${qs}` : ''}`);
}

export function subirEvidencia(file) {
  const form = new FormData();
  form.append('file', file);
  const headers = {};
  const token = localStorage.getItem('trucks_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch('/api/v1/reportes/evidencia', { method: 'POST', headers, body: form })
    .then(async (res) => {
      let data = null;
      try { data = await res.json(); } catch { /* sin JSON */ }
      if (!res.ok) throw new Error((data && (data.error || data.mensaje)) || `Error ${res.status}`);
      return (data && data.data) || {};
    });
}
