import { useCallback, useEffect, useState } from 'react';
import { inventarioPorUbicacion, listarUbicaciones } from '../../api/gestion';

export default function InventarioFisico() {
  const [codigo, setCodigo] = useState('A2');
  const [ubicaciones, setUbicaciones] = useState([]);
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    listarUbicaciones()
      .then((res) => setUbicaciones(res.data || []))
      .catch(() => { /* el filtro manual sigue funcionando */ });
  }, []);

  const buscar = useCallback((valor = codigo) => {
    const ubicacion = String(valor || '').trim();
    if (!ubicacion) {
      setError('Ingresa una ubicación (ej. A2).');
      return;
    }
    setCargando(true);
    setError('');
    inventarioPorUbicacion(ubicacion)
      .then((res) => {
        setRows(res.data || []);
        setBuscado(true);
      })
      .catch((err) => {
        setRows([]);
        setError(err.message);
      })
      .finally(() => setCargando(false));
  }, [codigo]);

  useEffect(() => {
    buscar('A2');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-fluid py-4 px-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bolder mb-1">Control de inventario físico</h2>
        <p className="text-muted small mb-0">
          Conteo por jornada filtrado exclusivamente por ubicación.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold text-uppercase text-secondary">Ubicación</label>
              <input
                className="form-control"
                list="lista-ubicaciones"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
                placeholder="Ej. A2"
              />
              <datalist id="lista-ubicaciones">
                {ubicaciones.map((u) => <option key={u.id} value={u.codigo}>{u.descripcion || u.codigo}</option>)}
              </datalist>
            </div>
            <div className="col-12 col-md-auto">
              <button className="btn btn-primary fw-bold" onClick={() => buscar()} disabled={cargando}>
                {cargando ? 'Buscando...' : 'Buscar ubicación'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center border-0 pt-3">
          <h3 className="h6 fw-bold text-uppercase text-secondary mb-0">
            Ubicación: {codigo || '—'}
          </h3>
          <span className="badge text-bg-primary">{rows.length} registro(s)</span>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Descripción</th>
                <th>Unidad de medida</th>
                <th className="text-end">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan="5" className="text-center text-muted py-4">Consultando inventario...</td></tr>
              )}
              {!cargando && rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    {buscado ? 'No hay productos en esta ubicación.' : 'Selecciona una ubicación para comenzar.'}
                  </td>
                </tr>
              )}
              {!cargando && rows.map((p) => (
                <tr key={`${p.codigo}-${p.ubicacion}`}>
                  <td className="fw-semibold">{p.codigo}</td>
                  <td>{p.ubicacion || '—'}</td>
                  <td>{p.descripcion || '—'}</td>
                  <td>{p.unidadMedida || '—'}</td>
                  <td className="text-end fw-bold">{p.cantidad ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
