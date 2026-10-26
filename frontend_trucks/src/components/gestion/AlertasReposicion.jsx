import { useCallback, useEffect, useState } from 'react';
import { emitirOrdenCompra, listarAlertas, listarOrdenesCompra } from '../../api/gestion';
import { listarProveedores } from '../../api/proveedores';

const fecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

export default function AlertasReposicion() {
  const [alertas, setAlertas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({});
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    Promise.all([listarAlertas(), listarOrdenesCompra(), listarProveedores()])
      .then(([al, or, pr]) => {
        const alertasData = al.data || [];
        setAlertas(alertasData);
        setOrdenes(or.data || []);
        setProveedores(pr.data || []);
        setForm((prev) => {
          const next = { ...prev };
          alertasData.forEach((a) => {
            if (!next[a.id]) {
              next[a.id] = {
                proveedorId: '',
                cantidad: Math.max(a.stockMinimo * 2 - a.stockMomento, 1),
              };
            }
          });
          return next;
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiar = (id, campo, valor) => {
    setForm((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const emitir = async (a) => {
    const datos = form[a.id] || {};
    const proveedorId = datos.proveedorId ? Number(datos.proveedorId) : null;
    const cantidad = Number(datos.cantidad);
    if (!proveedorId) {
      setError('Selecciona un proveedor para emitir la orden de compra.');
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError('La cantidad de la orden debe ser un entero mayor a 0.');
      return;
    }
    if (!window.confirm(`¿Emitir orden de compra de ${cantidad} unidad(es) de ${a.codigo}?`)) return;
    setProcesando(a.id);
    setError('');
    setMensaje('');
    try {
      await emitirOrdenCompra(a.id, { proveedorId, cantidad });
      setMensaje(`Orden de compra emitida para ${a.codigo}.`);
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
          <h2 className="fw-bolder mb-1">Alertas de reposición</h2>
          <p className="text-muted small mb-0">
            El sistema alerta cuando el stock llega al mínimo. Solo el administrador emite la orden de compra.
          </p>
        </div>
        <button className="btn btn-outline-secondary" onClick={cargar} disabled={cargando}>Actualizar</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {proveedores.length === 0 && (
        <div className="alert alert-warning">
          No hay proveedores registrados. Crea uno desde el módulo de inventario para emitir órdenes.
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pt-3">
          <h3 className="h6 fw-bold text-uppercase text-secondary mb-0">Alertas pendientes</h3>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Código</th>
                <th>Producto</th>
                <th className="text-end">Stock</th>
                <th className="text-end">Mínimo</th>
                <th>Proveedor</th>
                <th className="text-end">Cantidad</th>
                <th className="text-end">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan="8" className="text-center text-muted py-4">Cargando alertas...</td></tr>}
              {!cargando && alertas.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted py-4">No hay alertas pendientes.</td></tr>
              )}
              {!cargando && alertas.map((a) => {
                const f = form[a.id] || {};
                return (
                  <tr key={a.id}>
                    <td className="small text-nowrap">{fecha(a.fecha)}</td>
                    <td className="fw-semibold">{a.codigo}</td>
                    <td>{a.producto}</td>
                    <td className="text-end fw-bold text-danger">{a.stockMomento}</td>
                    <td className="text-end">{a.stockMinimo}</td>
                    <td style={{ minWidth: '12rem' }}>
                      <select
                        className="form-select form-select-sm"
                        value={f.proveedorId || ''}
                        onChange={(e) => cambiar(a.id, 'proveedorId', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{ minWidth: '6rem' }}>
                      <input
                        type="number" min="1" className="form-control form-control-sm text-end"
                        value={f.cantidad ?? ''}
                        onChange={(e) => cambiar(a.id, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-primary text-nowrap"
                        disabled={procesando === a.id}
                        onClick={() => emitir(a)}
                      >
                        Emitir orden
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3">
          <h3 className="h6 fw-bold text-uppercase text-secondary mb-0">Órdenes de compra emitidas</h3>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th className="text-end">Cantidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">Aún no hay órdenes emitidas.</td></tr>
              )}
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td className="small text-nowrap">{fecha(o.fecha)}</td>
                  <td className="fw-semibold">{o.codigo}</td>
                  <td>{o.producto}</td>
                  <td>{o.proveedor || '—'}</td>
                  <td className="text-end">{o.cantidad}</td>
                  <td><span className="badge text-bg-success">{o.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
