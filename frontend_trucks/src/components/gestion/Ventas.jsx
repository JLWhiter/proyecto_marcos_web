import { useState } from 'react';
import { listarProductos } from '../../api/productos';
import { registrarVenta } from '../../api/ventas';

/**
 * Vista de venta rápida. No muestra el precio unitario interno: solo el
 * precio final sugerido, que el vendedor puede editar si negocia con el cliente.
 */
export default function Ventas() {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioFinal, setPrecioFinal] = useState('');
  const [cliente, setCliente] = useState('');
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const buscar = (texto) => {
    setBusqueda(texto);
    if (texto.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    listarProductos(8, texto)
      .then((res) => setSugerencias(res.data?.items || res.data || []))
      .catch(() => setSugerencias([]));
  };

  const elegir = (p) => {
    setProducto(p);
    setBusqueda(`${p.codigo} - ${p.nombre}`);
    setPrecioFinal(String(p.precio_venta ?? ''));
    setSugerencias([]);
    setError('');
    setMensaje('');
  };

  const registrar = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (!producto) { setError('Selecciona un producto.'); return; }
    const cant = Number(cantidad);
    const precio = Number(precioFinal);
    if (!Number.isInteger(cant) || cant <= 0) { setError('La cantidad debe ser mayor a 0.'); return; }
    if (!Number.isFinite(precio) || precio <= 0) { setError('El precio final debe ser mayor a 0.'); return; }

    setGuardando(true);
    try {
      await registrarVenta({
        id_producto: producto.id,
        cantidad: cant,
        nombre_cliente: cliente,
        moneda: '$',
        tasa_cambio: 1,
        medio_pago: medioPago,
        precio_final: precio,
      });
      setMensaje(`Venta registrada: ${cant} × ${producto.codigo}.`);
      setProducto(null);
      setBusqueda('');
      setCantidad(1);
      setPrecioFinal('');
      setCliente('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bolder mb-1">Ventas</h2>
        <p className="text-muted small mb-0">
          El precio unitario interno no se muestra. El precio final es editable para negociaciones.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <form className="card border-0 shadow-sm" onSubmit={registrar}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-5 position-relative">
              <label className="form-label small fw-bold text-uppercase text-secondary">Producto</label>
              <input
                className="form-control"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setProducto(null); buscar(e.target.value); }}
                placeholder="Buscar por código o nombre..."
              />
              {sugerencias.length > 0 && (
                <div className="list-group position-absolute w-100 shadow" style={{ zIndex: 20 }}>
                  {sugerencias.map((p) => (
                    <button
                      key={p.id} type="button"
                      className="list-group-item list-group-item-action"
                      onClick={() => elegir(p)}
                    >
                      <span className="fw-bold">{p.codigo}</span> · {p.nombre}
                    </button>
                  ))}
                </div>
              )}
              {producto && (
                <div className="form-text">
                  Stock disponible: <strong>{producto.stock_actual ?? '—'}</strong> · Unidad: {producto.unidad_medida || 'unidad'}
                </div>
              )}
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label small fw-bold text-uppercase text-secondary">Cantidad</label>
              <input type="number" min="1" className="form-control" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label small fw-bold text-uppercase text-secondary">Precio final sugerido</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input type="number" step="0.01" min="0" className="form-control" value={precioFinal} onChange={(e) => setPrecioFinal(e.target.value)} title="Editable si hay negociación" />
              </div>
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label small fw-bold text-uppercase text-secondary">Cliente</label>
              <input className="form-control" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label small fw-bold text-uppercase text-secondary">Medio de pago</label>
              <select className="form-select" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Yape/Plin</option>
                <option>Credito</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <p className="mb-0 text-muted small">
              Total: <strong className="fs-5 text-dark">$ {((Number(cantidad) || 0) * (Number(precioFinal) || 0)).toFixed(2)}</strong>
            </p>
            <button className="btn btn-primary fw-bold px-4" disabled={guardando || !producto}>
              {guardando ? 'Registrando...' : 'Registrar venta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
