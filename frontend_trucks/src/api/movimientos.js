import { api } from './client';

export function registrarMovimiento(data) {
  return api('/movimientos', { method: 'POST', body: data });
}
