import { api } from './client';

export function listarMarcas() {
  return api('/marcas');
}

export function crearMarca(data) {
  return api('/marcas', { method: 'POST', body: data });
}

export function listarCategorias() {
  return api('/categorias');
}

export function crearCategoria(data) {
  return api('/categorias', { method: 'POST', body: data });
}

export function listarEstadosProducto() {
  return api('/estados-producto');
}

export function listarTiposDocumento() {
  return api('/tipos-documento');
}
