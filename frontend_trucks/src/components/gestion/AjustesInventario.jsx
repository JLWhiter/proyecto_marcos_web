import { useCallback, useEffect, useState } from 'react';
import { ajustarInventario, listarAjustes, listarProductosInventario } from '../../api/gestion';

const fecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

export default function AjustesInventario() {
  const [q, setQ] = useState('');
  const [productos, setProductos] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [nuevoStock, setNuevoStock] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarProductos = useCallback((texto = q) => {
    setCargando(true);
    setError('');
    listarProductosInventario(texto)
      .then((res) => setProductos(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [q]);

  const cargarAjustes = useCallback(() => {
    listarAjustes()
      .then((res) => setAjustes(res.data || []))
      .catch(() => { /* histórico opcional */ });
  }, []);

  useEffect(() => {
    cargarProductos('');
    cargarAjustes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!seleccionado) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape' && !guardando) setSeleccionado(null);
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [seleccionado, guardando]);

  const abrir = (p) => {
    setSeleccionado(p);
    setNuevoStock(String(p.stockActual ?? 0));
    setMotivo('');
    setError('');
    setMensaje('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!seleccionado) return;
    const stock = Number(nuevoStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError('El nuevo stock debe ser un entero mayor o igual a 0.');
      return;
    }
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const res = await ajustarInventario({
        productoId: seleccionado.productoId,
        nuevoStock: stock,
        motivo,
      });
      setMensaje(`Stock ajustado: ${res.data?.stockAnterior} → ${res.data?.stockNuevo} (${seleccionado.codigo}).`);
      setSeleccionado(null);
      setMotivo('');
      cargarProductos();
      cargarAjustes();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bolder mb-1">Ajuste de inventario</h2>
        <p className="text-muted small mb-0">
          Uso exclusivo del administrador para cuadrar diferencias entre el stock físico y el sistema.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <label className="form-label small fw-bold text-uppercase text-secondary">Buscar producto</label>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Código o nombre"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); cargarProductos(); } }}
            />
            <button className="btn btn-outline-secondary" onClick={() => cargarProductos()} disabled={cargando}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Ubicación</th>
                <th className="text-end">Stock actual</th>
                <th className="text-end">Stock mínimo</th>
                <th>Unidad</th>
                <th className="text-end">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan="7" className="text-center text-muted py-4">Buscando...</td></tr>}
              {!cargando && productos.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Sin resultados.</td></tr>
              )}
              {!cargando && productos.map((p) => (
                <tr key={p.productoId} className={seleccionado?.productoId === p.productoId ? 'table-primary' : ''}>
                  <td className="fw-semibold">{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.ubicacion || '—'}</td>
                  <td className="text-end fw-bold">{p.stockActual}</td>
                  <td className="text-end">{p.stockMinimo}</td>
                  <td>{p.unidadMedida || '—'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-primary" onClick={() => abrir(p)}>Ajustar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {seleccionado && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ajuste-inventario-titulo"
          onClick={() => { if (!guardando) setSeleccionado(null); }}
          style={{ backgroundColor: 'rgba(8, 18, 42, 0.55)', zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content shadow">
              <div className="modal-header">
                <div className="min-w-0">
                  <h2 className="modal-title fs-5 fw-bold text-break" id="ajuste-inventario-titulo">
                    Ajustar: {seleccionado.codigo} · {seleccionado.nombre}
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-close flex-shrink-0"
                  aria-label="Cerrar"
                  disabled={guardando}
                  onClick={() => setSeleccionado(null)}
                />
              </div>
              <form onSubmit={guardar}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="ajuste-stock-actual" className="form-label small fw-bold text-uppercase text-secondary">Stock actual</label>
                    <input id="ajuste-stock-actual" className="form-control bg-light" value={seleccionado.stockActual} readOnly />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="ajuste-nuevo-stock" className="form-label small fw-bold text-uppercase text-secondary">Nuevo stock físico</label>
                    <input
                      id="ajuste-nuevo-stock"
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      value={nuevoStock}
                      onChange={(e) => setNuevoStock(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="ajuste-motivo" className="form-label small fw-bold text-uppercase text-secondary">Motivo</label>
                    <input
                      id="ajuste-motivo"
                      className="form-control"
                      placeholder="Ej. error de despacho, conteo físico..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </div>
                  {error && <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">{error}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" disabled={guardando} onClick={() => setSeleccionado(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar ajuste'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3">
          <h3 className="h6 fw-bold text-uppercase text-secondary mb-0">Últimos ajustes</h3>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Código</th>
                <th>Producto</th>
                <th className="text-end">Anterior</th>
                <th className="text-end">Nuevo</th>
                <th className="text-end">Diferencia</th>
                <th>Motivo</th>
                <th>Administrador</th>
              </tr>
            </thead>
            <tbody>
              {ajustes.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted py-4">Aún no hay ajustes registrados.</td></tr>
              )}
              {ajustes.map((a) => (
                <tr key={a.id}>
                  <td className="small text-nowrap">{fecha(a.fecha)}</td>
                  <td className="fw-semibold">{a.codigo}</td>
                  <td>{a.producto}</td>
                  <td className="text-end">{a.stockAnterior}</td>
                  <td className="text-end">{a.stockNuevo}</td>
                  <td className={`text-end fw-bold ${a.cantidadAjuste >= 0 ? 'text-success' : 'text-danger'}`}>
                    {a.cantidadAjuste > 0 ? '+' : ''}{a.cantidadAjuste}
                  </td>
                  <td className="small">{a.motivo || '—'}</td>
                  <td className="small">{a.administrador || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
