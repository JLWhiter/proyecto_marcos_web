import { useEffect, useState } from "react";
import { listarVentas, cambiarEstadoPago, actualizarFinanciero } from "../../api/ventas";
import { useTasaCambio } from "../../context/TasaCambioContext";

const MONEDA = (m) => (m === "S/" ? "S/" : "$");

function PagosPendientes() {
    const { tasa: tasaGlobal } = useTasaCambio();
    const [ventas, setVentas] = useState([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [ventaSel, setVentaSel] = useState(null);
    const [ventaEdit, setVentaEdit] = useState(null);
    const [editForm, setEditForm] = useState({ moneda: "$", tasa_cambio: 1, precio_unitario: 0, precio_final: 0 });
    const perPage = 20;
    const totalPaginas = Math.max(1, Math.ceil(total / perPage));

    const cargar = (page = pagina) => {
        setCargando(true);
        setError("");
        listarVentas({ per_page: perPage, page, estado_pago: "pendiente" })
            .then((res) => {
                setVentas(res.data || []);
                setTotal(res.pagination?.total || 0);
            })
            .catch((err) => setError(err.message))
            .finally(() => setCargando(false));
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    useEffect(() => { cargar(1); }, []);

    const cobrarCuota = async (ventaId) => {
        setMensaje(""); setError("");
        try {
            const res = await cambiarEstadoPago(ventaId);
            const nueva = res.data || {};
            const plazos = Number(nueva.plazos) || 1;
            const pagadas = Number(nueva.cuotas_pagadas) || 0;
            if (pagadas >= plazos) {
                setMensaje("Venta pagada completamente");
            } else {
                setMensaje(`Cuota ${pagadas}/${plazos} registrada — quedan ${plazos - pagadas}`);
            }
            cargar();
            setVentaSel(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const abrirEdit = (v) => {
        const monedaActual = v.moneda || "$";
        const tasaAdmin = Number(tasaGlobal) || 3.4;
        setEditForm({
            moneda: monedaActual,
            tasa_cambio: monedaActual === "$" ? 1 : tasaAdmin,
            precio_unitario: v.precio_unitario ?? 0,
            precio_final: v.precio_final ?? 0,
        });
        setVentaEdit(v);
        setError(""); setMensaje("");
    };

    const guardarEdit = async () => {
        if (!ventaEdit) return;
        setMensaje(""); setError("");
        const tasa = Number(editForm.tasa_cambio) || 1;
        const precioUnit = Number(editForm.precio_unitario) || 0;
        try {
            await actualizarFinanciero(ventaEdit.id, {
                moneda: editForm.moneda,
                tasa_cambio: tasa,
                precio_unitario: precioUnit,
                precio_final: editForm.moneda === "$" ? precioUnit : precioUnit * tasa,
            });
            setMensaje("Venta financiera actualizada");
            setVentaEdit(null);
            cargar();
        } catch (err) {
            setError(err.message);
        }
    };

    const totalPendiente = ventas.reduce((acc, v) => {
        const precioFinal = Number(v.precio_final) || 0;
        const plazos = Number(v.plazos) || 1;
        const pagadas = Number(v.cuotas_pagadas) || 0;
        const cuotaValor = plazos > 0 ? precioFinal / plazos : precioFinal;
        return acc + cuotaValor * (plazos - pagadas);
    }, 0);

    const formatearFechaCorta = (v) => {
        if (!v) return "—";
        const d = new Date(v + "T00:00:00");
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
    };

    const esVencido = (v) => {
        if (!v.fecha_pago) return false;
        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaPago = new Date(v.fecha_pago + "T00:00:00");
        return fechaPago < inicioHoy;
    };

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h2 className="fs-4 fw-bolder text-ink">Pagos Pendientes</h2>
                        <p className="small text-muted mt-1">Ventas a crédito con pago pendiente.</p>
                    </div>
                    {total > 0 && (
                        <div className="rounded-3 border border-accent-soft bg-accent-soft px-4 py-2">
                            <p className="form-label-sm mb-0">Total pendiente</p>
                            <p className="fs-5 fw-bolder text-accent-deep mb-0">$ {totalPendiente.toFixed(2)}</p>
                        </div>
                    )}
                </div>

                {error && <div className="alert alert-danger rounded-3 mt-4 py-3 small" role="alert">{error}</div>}
                {mensaje && <div className="alert alert-success rounded-3 mt-4 py-3 small" role="alert">{mensaje}</div>}

                <div className="mt-3 rounded-3 border border-line bg-white overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                                <tr>
                                    <th className="px-3 py-3">N°</th>
                                    <th className="px-3 py-3">Cliente</th>
                                    <th className="px-3 py-3">Producto</th>
                                    <th className="px-3 py-3">Total</th>
                                    <th className="px-3 py-3">Cuotas</th>
                                    <th className="px-3 py-3">Pendiente</th>
                                    <th className="px-3 py-3">Fecha de Pago</th>
                                    <th className="px-3 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando && (
                                    <tr><td colSpan="8" className="px-3 py-5 text-center small text-muted">Cargando pagos pendientes...</td></tr>
                                )}
                                {!cargando && ventas.length === 0 && (
                                    <tr><td colSpan="8" className="px-3 py-5 text-center small text-muted">No hay pagos pendientes.</td></tr>
                                )}
                                {ventas.map((v, i) => {
                                    const plazos = Number(v.plazos) || 1;
                                    const pagadas = Number(v.cuotas_pagadas) || 0;
                                    const precioFinal = Number(v.precio_final) || 0;
                                    const cuotaValor = plazos > 0 ? precioFinal / plazos : precioFinal;
                                    const pendiente = cuotaValor * (plazos - pagadas);
                                    const vencido = esVencido(v);
                                    return (
                                        <tr key={v.id} onClick={() => setVentaSel(v)} className="small text-ink cursor-pointer">
                                            <td className="px-3 py-3">{(pagina - 1) * perPage + i + 1}</td>
                                            <td className="px-3 py-3 fw-semibold">{v.nombre_cliente || "—"}</td>
                                            <td className="px-3 py-3">{v.nombre_producto || "—"}</td>
                                            <td className="px-3 py-3 fw-bold text-accent-deep text-nowrap">
                                                {MONEDA(v.moneda)} {precioFinal.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3" style={{ minWidth: "6rem" }}>
                                                <div className="d-flex flex-column gap-1">
                                                    <span className="small fw-bold text-nowrap">{pagadas}/{plazos}</span>
                                                    <div className="progress" style={{ height: 6 }}>
                                                        <div className="progress-bar bg-accent" style={{ width: `${(pagadas / plazos) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 fw-bold text-warning text-nowrap">
                                                {MONEDA(v.moneda)} {pendiente.toFixed(2)}
                                            </td>
                                            <td className={`px-3 py-3 small fw-bold text-nowrap ${vencido ? "text-danger" : "text-muted"}`}>
                                                {formatearFechaCorta(v.fecha_pago)}
                                                {vencido && <span className="badge-soft bg-danger-subtle text-danger border border-danger ms-1">VENCIDO</span>}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="d-flex gap-1 flex-wrap">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); cobrarCuota(v.id); }}
                                                        className="btn btn-sm btn-outline-success rounded-2 fw-bold"
                                                    >
                                                        Cobrar Cuota
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); abrirEdit(v); }}
                                                        className="btn btn-sm btn-outline-brand rounded-2 fw-bold"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-4 flex-wrap gap-2">
                    <p className="small text-muted mb-0">Página {pagina} de {totalPaginas} ({total} pendientes)</p>
                    <div className="d-flex gap-2">
                        <button disabled={pagina <= 1} onClick={() => { setPagina((p) => p - 1); cargar(pagina - 1); }}
                            className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">
                            ← Anterior
                        </button>
                        <button disabled={pagina >= totalPaginas} onClick={() => { setPagina((p) => p + 1); cargar(pagina + 1); }}
                            className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">
                            Siguiente →
                        </button>
                    </div>
                </div>
            </div>

            {ventaSel && (
                <ModalDetalle venta={ventaSel} onClose={() => setVentaSel(null)} onCobrar={cobrarCuota} />
            )}
            {ventaEdit && (
                <ModalEditar
                    venta={ventaEdit}
                    form={editForm}
                    setForm={setEditForm}
                    tasaGlobal={tasaGlobal}
                    onGuardar={guardarEdit}
                    onClose={() => setVentaEdit(null)}
                />
            )}
        </div>
    );
}

function ModalDetalle({ venta, onClose, onCobrar }) {
    const v = venta;
    const moneda = v.moneda || "$";
    const plazos = Number(v.plazos) || 1;
    const pagadas = Number(v.cuotas_pagadas) || 0;
    const precioFinal = Number(v.precio_final) || 0;
    const cuotaValor = plazos > 0 ? precioFinal / plazos : precioFinal;
    const pendiente = cuotaValor * (plazos - pagadas);
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const tieneFechaPago = !!v.fecha_pago;
    const fechaPago = v.fecha_pago ? new Date(v.fecha_pago + "T00:00:00") : null;
    const vencido = tieneFechaPago && fechaPago && fechaPago < inicioHoy;

    const formatearFechaCorta = (val) => {
        if (!val) return "—";
        const d = new Date(val + "T00:00:00");
        return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
    };

    const dato = (etiqueta, valor) => (
        <div>
            <p className="form-label-sm mb-0">{etiqueta}</p>
            <p className="small fw-bold text-ink mb-0">{valor}</p>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card max-w-600" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <span className="modal-title">Detalle del Pago</span>
                    <button onClick={onClose} className="modal-close" aria-label="Cerrar"><span className="fs-4 fw-bold lh-1">&times;</span></button>
                </div>

                <div className="px-4 py-3">
                    <div className="row g-3">
                        {dato("Cliente", v.nombre_cliente || "—")}
                        {dato("DNI/RUC", v.ruc_dni || "—")}
                        {dato("Producto", v.nombre_producto || "—")}
                        {dato("Cantidad", v.cantidad)}
                        {dato("Marca", v.marca || "—")}
                        {dato("Tipo Documento", v.tipo_documento || "—")}
                    </div>

                    <div className="border-top border-line mt-3 pt-3 d-flex justify-content-between align-items-center">
                        <span className="form-label-sm mb-0">Total de la Venta</span>
                        <span className="fs-4 fw-bolder text-accent-deep">{moneda} {precioFinal.toFixed(2)}</span>
                    </div>

                    <div className="bg-brand-soft rounded-3 p-3 mt-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="form-label-sm mb-0">Cuotas: {pagadas}/{plazos}</span>
                            <span className="small fw-bold text-muted">Valor cuota: {moneda} {cuotaValor.toFixed(2)}</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 8 }}>
                            <div className="progress-bar bg-accent" style={{ width: `${(pagadas / plazos) * 100}%` }} />
                        </div>
                        <div className="d-flex justify-content-between">
                            <span className="small fw-bold text-success">Pagado: {moneda} {(cuotaValor * pagadas).toFixed(2)}</span>
                            <span className="small fw-bold text-warning">Pendiente: {moneda} {pendiente.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="row g-3 mt-1">
                        <div>
                            <p className="form-label-sm mb-0">Fecha de Pago</p>
                            <p className={`small fw-bold mb-0 ${vencido ? "text-danger" : "text-ink"}`}>
                                {formatearFechaCorta(v.fecha_pago)}
                                {vencido && <span className="badge-soft bg-danger-subtle text-danger border border-danger ms-2">VENCIDO</span>}
                            </p>
                        </div>
                        {dato("Estado de Pago", <span className="text-warning">Pendiente</span>)}
                        {dato("Observaciones", v.observaciones || "Sin observaciones")}
                        {dato("Recepcionista", v.recepcionista || "—")}
                    </div>
                </div>

                <div className="modal-foot">
                    <button onClick={onClose} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Cerrar</button>
                    <button onClick={() => onCobrar(v.id)} className="btn btn-accent btn-sm rounded-2 fw-bold">Cobrar Cuota</button>
                </div>
            </div>
        </div>
    );
}

function ModalEditar({ venta, form, setForm, onGuardar, onClose, tasaGlobal }) {
    const vr = venta;

    const cambioMoneda = (m) => {
        const tasaAdmin = Number(tasaGlobal) || 3.4;
        const tasa = m === "$" ? 1 : tasaAdmin;
        setForm((f) => ({ ...f, moneda: m, tasa_cambio: tasa, precio_final: tasa === 1 ? (Number(f.precio_unitario) || 0) : (Number(f.precio_unitario) || 0) * tasa }));
    };

    const setPrecioUnitario = (v) => {
        setForm((f) => {
            const pu = Number(v) || 0;
            const tasa = Number(f.tasa_cambio) || 1;
            return { ...f, precio_unitario: v, precio_final: f.moneda === "$" ? pu : pu * tasa };
        });
    };

    const setTasa = (v) => {
        setForm((f) => {
            const tasa = Number(v) || 1;
            return { ...f, tasa_cambio: v, precio_final: f.moneda === "$" ? (Number(f.precio_unitario) || 0) : (Number(f.precio_unitario) || 0) * tasa };
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card max-w-600" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <span className="modal-title">Editar Venta</span>
                    <button onClick={onClose} className="modal-close" aria-label="Cerrar"><span className="fs-4 fw-bold lh-1">&times;</span></button>
                </div>

                <div className="px-4 py-3">
                    <div className="mb-3">
                        <p className="form-label-sm mb-0">Producto</p>
                        <p className="small fw-bold text-ink mb-0">{vr.nombre_producto || "—"}</p>
                    </div>

                    <div className="mb-3">
                        <label className="form-label-sm d-block mb-1">Moneda</label>
                        <select value={form.moneda} onChange={(e) => cambioMoneda(e.target.value)} className="form-input">
                            <option value="$">$ (Dólares)</option>
                            <option value="S/">S/ (Soles)</option>
                        </select>
                    </div>

                    <div className="row g-3">
                        <div className="col-12 col-sm-6">
                            <label className="form-label-sm d-block mb-1">Precio Unitario</label>
                            <input type="number" step="0.01" min="0" value={form.precio_unitario} onChange={(e) => setPrecioUnitario(e.target.value)} className="form-input" />
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label-sm d-block mb-1">Tipo de Cambio</label>
                            <input type="number" step="0.0001" min="0" disabled={form.moneda === "$"} value={form.tasa_cambio} onChange={(e) => setTasa(e.target.value)} className="form-input" />
                        </div>
                    </div>

                    <div className="mt-3">
                        <label className="form-label-sm d-block mb-1">Precio Final (calculado)</label>
                        <div className="form-input bg-brand-soft fw-bold text-brand">
                            {form.moneda} {Number(form.precio_final).toFixed(2)}
                        </div>
                        <p className="small text-muted mb-0">Precio Unitario × Tipo de Cambio</p>
                    </div>
                </div>

                <div className="modal-foot">
                    <button onClick={onClose} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Cancelar</button>
                    <button onClick={onGuardar} className="btn btn-brand btn-sm rounded-2 fw-bold">Guardar</button>
                </div>
            </div>
        </div>
    );
}

export default PagosPendientes;