import { useCallback, useEffect, useState } from 'react';
import { confirmarDano, listarDanos, rechazarDano } from '../../api/gestion';

const fecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

export default function DanosPendientes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [imagen, setImagen] = useState(null);
  const [procesando, setProcesando] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    listarDanos('PENDIENTE')
      .then((res) => setReportes(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const confirmar = async (r) => {
    if (!window.confirm(`¿Confirmar la baja de ${r.cantidad} unidad(es) de ${r.productoCodigo}? El stock se descontará ahora.`)) return;
    setProcesando(r.id);
    setMensaje('');
    try {
      await confirmarDano(r.id);
      setMensaje(`Baja confirmada para ${r.productoCodigo}.`);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const rechazar = async (r) => {
    if (!window.confirm(`¿Rechazar el reporte de ${r.productoCodigo}? El stock no se modificará.`)) return;
    setProcesando(r.id);
    setMensaje('');
    try {
      await rechazarDano(r.id);
      setMensaje(`Reporte de ${r.productoCodigo} rechazado.`);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="container-fluid py-4 px-4 bg-light min-vh-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h2 className="fw-bolder mb-1">Daños pendientes de confirmación</h2>
          <p className="text-muted small mb-0">
            El almacenero registra el reporte; solo el administrador puede dar de baja y descontar stock.
          </p>
        </div>
        <button className="btn btn-outline-secondary" onClick={cargar} disabled={cargando}>Actualizar</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Código</th>
                <th>Producto</th>
                <th className="text-center">Cantidad</th>
                <th>Descripción</th>
                <th>Reportado por</th>
                <th>Evidencia</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan="8" className="text-center text-muted py-4">Cargando reportes...</td></tr>
              )}
              {!cargando && reportes.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted py-4">No hay daños pendientes.</td></tr>
              )}
              {!cargando && reportes.map((r) => (
                <tr key={r.id}>
                  <td className="small text-nowrap">{fecha(r.fecha)}</td>
                  <td className="fw-semibold">{r.productoCodigo || '—'}</td>
                  <td>{r.productoNombre || '—'}</td>
                  <td className="text-center fw-bold text-danger">{r.cantidad}</td>
                  <td className="small" style={{ maxWidth: '16rem' }}>{r.descripcion || '—'}</td>
                  <td className="small">{r.reportadoPor || '—'}</td>
                  <td>
                    {r.evidenciaUrl
                      ? <button className="btn btn-sm btn-outline-secondary" onClick={() => setImagen(r.evidenciaUrl)}>Ver</button>
                      : <span className="small text-muted">Sin evidencia</span>}
                  </td>
                  <td className="text-end text-nowrap">
                    <button
                      className="btn btn-sm btn-danger me-1"
                      disabled={procesando === r.id}
                      onClick={() => confirmar(r)}
                    >
                      Confirmar baja
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={procesando === r.id}
                      onClick={() => rechazar(r)}
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {imagen && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.65)' }} onClick={() => setImagen(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Evidencia del daño</h5>
                <button className="btn-close" onClick={() => setImagen(null)} />
              </div>
              <div className="modal-body text-center">
                <img src={imagen} alt="Evidencia del daño" className="img-fluid rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
