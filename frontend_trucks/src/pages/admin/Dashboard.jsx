import { useEffect, useState } from "react";
import { valorInventario, productosBajoStock, historialDia, setTasaCambio as apiSetTasa } from "../../api/reportes";
import { listarVentas } from "../../api/ventas";
import { listarUsuarios } from "../../api/usuarios";
import { useAuth } from "../../context/AuthContext";
import { useTasaCambio } from "../../context/TasaCambioContext";

const DIVISA = { "$": "USD" };

const fechaLocalHoy = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

function Dashboard() {
    const { user } = useAuth();
    const { tasa, cambiarTasa } = useTasaCambio();
    const [totalProductos, setTotalProductos] = useState(0);
    const [bajoStock, setBajoStock] = useState([]);
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [movimientosHoy, setMovimientosHoy] = useState(0);
    const [ventas, setVentas] = useState([]);
    const [totalVentasDia, setTotalVentasDia] = useState(0);
    const [paginaVentas, setPaginaVentas] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [editandoTasa, setEditandoTasa] = useState(false);

    const perPageVentas = 10;
    const totalPaginasVentas = Math.max(1, Math.ceil(totalVentasDia / perPageVentas));

    const guardarTasa = async () => {
        setEditandoTasa(false);
        const num = Number(tasa) || 0;
        if (num > 0) {
            cambiarTasa(num);
            try {
                await apiSetTasa(num);
            } catch { /* sin importar el error local */ }
        }
    };

    useEffect(() => {
        let activo = true;
        const fecha = fechaLocalHoy();
        Promise.allSettled([
            valorInventario(),
            productosBajoStock(),
            listarUsuarios({ per_page: 100, solo_activos: "1" }),
            historialDia({ fecha_desde: fecha, fecha_hasta: fecha }),
        ])
            .then(([inv, bs, usr, hist]) => {
                if (!activo) return;
                if (inv.status === "fulfilled" && inv.value?.data) {
                    setTotalProductos(inv.value.data.total_productos || 0);
                }
                if (bs.status === "fulfilled" && Array.isArray(bs.value?.data)) {
                    setBajoStock(bs.value.data);
                }
                if (usr.status === "fulfilled" && typeof usr.value?.data?.total === "number") {
                    setTotalUsuarios(usr.value.data.total);
                } else if (usr.status === "fulfilled" && usr.value?.data?.items) {
                    setTotalUsuarios(usr.value.data.items.length);
                }
                if (hist.status === "fulfilled" && Array.isArray(hist.value?.data)) {
                    setMovimientosHoy(hist.value.data.length);
                }
                if (inv.status === "rejected") setError(inv.reason.message);
            })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        let activo = true;
        const fecha = fechaLocalHoy();
        listarVentas({ page: paginaVentas, per_page: perPageVentas, fecha_desde: fecha, fecha_hasta: fecha })
            .then((res) => {
                if (!activo) return;
                setVentas(res.data || []);
                setTotalVentasDia((res.pagination && res.pagination.total) || 0);
            })
            .catch(() => { if (activo) { setVentas([]); setTotalVentasDia(0); } });
        return () => { activo = false; };
    }, [paginaVentas]);

    const tarjetas = [
        { etiqueta: "Artículos Totales", valor: totalProductos, color: "bg-brand-soft text-brand" },
        { etiqueta: "Bajo Stock", valor: bajoStock.length, color: "bg-danger-subtle text-danger" },
        { etiqueta: "Usuarios", valor: totalUsuarios, color: "bg-success-subtle text-success" },
        { etiqueta: "Movimientos Hoy", valor: movimientosHoy, color: "bg-warning-subtle text-warning" },
    ];

    const formatearMoneda = (v, moneda) => {
        const n = Number(v);
        const prefijo = moneda === "S/" ? "S/" : "$";
        return Number.isFinite(n) ? `${prefijo} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
    };

    const formatearFecha = (v) => {
        if (!v) return "—";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                    <div>
                        <h2 className="fs-4 fw-bolder text-ink mb-1">Dashboard</h2>
                        <p className="small text-muted mb-0">Bienvenido, {user?.usuario || "Administrador"}. Resumen general del sistema.</p>
                    </div>
                    <div className="rounded-3 border border-line bg-white p-4 shadow-sm d-flex flex-column align-items-center justify-content-center" style={{ width: "20%", minWidth: "13rem" }}>
                        <p className="small fw-bold text-ink mb-0">Tasa de Cambio</p>
                        {editandoTasa ? (
                            <div className="d-flex align-items-center gap-2 mt-2">
                                <span className="fs-5 fw-bold text-brand">S/</span>
                                <input type="number" step="0.01" min="0" autoFocus value={tasa}
                                    onChange={(e) => cambiarTasa(Number(e.target.value) || 0)}
                                    onBlur={guardarTasa}
                                    onKeyDown={(e) => { if (e.key === "Enter") guardarTasa(); }}
                                    className="form-control text-end fs-4 fw-bolder text-brand" style={{ width: "5rem", borderBottom: "2px solid var(--brand)", borderLeft: 0, borderRight: 0, borderTop: 0, borderRadius: 0, boxShadow: "none" }} />
                            </div>
                        ) : (
                            <button onClick={() => setEditandoTasa(true)} className="btn btn-link text-decoration-none mt-2 p-0 cursor-pointer" title="Click para editar">
                                <p className="fs-4 fw-bolder text-brand mb-0">S/ {tasa.toFixed(2)}</p>
                                <p className="text-muted mb-0" style={{ fontSize: "0.6rem" }}>Click para cambiar</p>
                            </button>
                        )}
                    </div>
                </div>
                {error && <div className="alert alert-danger rounded-3 mt-4 py-3 small" role="alert">{error}</div>}
                {cargando && <p className="mt-4 small text-muted">Cargando indicadores...</p>}

                {!cargando && (
                    <div className="row g-4 mt-1">
                        {tarjetas.map((t) => (
                            <div key={t.etiqueta} className="col-12 col-sm-6 col-lg-3">
                                <div className={`rounded-3 border border-line bg-white p-4 shadow-sm h-100 ${t.color}`} style={{ "--bs-card-color": "inherit" }}>
                                    <p className="small fw-bold text-muted text-uppercase tracking-wide mb-0">{t.etiqueta}</p>
                                    <p className="mt-2 fs-2 fw-bolder text-ink mb-0">{t.valor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!cargando && (
                    <div className="mt-5 rounded-3 border border-line bg-white overflow-hidden shadow-sm">
                        <div className="px-4 py-2 bg-brand-soft border-bottom border-line">
                            <h3 className="fw-bold text-brand small mb-0">Ventas del Día</h3>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-uppercase small fw-bold text-brand">
                                    <tr>
                                        <th className="px-3 py-3">Fecha</th>
                                        <th className="px-3 py-3">Cliente</th>
                                        <th className="px-3 py-3">Producto</th>
                                        <th className="px-3 py-3">Cant.</th>
                                        <th className="px-3 py-3">Monto</th>
                                        <th className="px-3 py-3">Divisa</th>
                                        <th className="px-3 py-3">Fuente</th>
                                        <th className="px-3 py-3">Medio Pago</th>
                                        <th className="px-3 py-3">Estado</th>
                                        <th className="px-3 py-3">Recepcionista</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventas.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="px-3 py-5 text-center small text-muted">No hay ventas registradas hoy.</td>
                                        </tr>
                                    )}
                                    {ventas.map((v) => (
                                        <tr key={v.id} className="small text-ink">
                                            <td className="px-3 py-3 text-nowrap">{formatearFecha(v.fecha_hora)}</td>
                                            <td className="px-3 py-3">{v.nombre_cliente || "—"}</td>
                                            <td className="px-3 py-3">
                                                <span className="fw-medium">{v.codigo_producto || "—"}</span>
                                                {v.nombre_producto && <span className="d-block small text-muted">{v.nombre_producto}</span>}
                                            </td>
                                            <td className="px-3 py-3">{v.cantidad ?? "—"}</td>
                                            <td className="px-3 py-3 fw-semibold">{formatearMoneda(v.precio_final, v.moneda)}</td>
                                            <td className="px-3 py-3">{DIVISA[v.moneda] || v.moneda || "—"}</td>
                                            <td className="px-3 py-3">
                                                {v.tipo_documento
                                                    ? <span className="badge-soft bg-brand-soft text-brand">{v.tipo_documento}</span>
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-3">
                                                {v.medio_pago
                                                    ? <span className="badge-soft bg-brand-soft text-brand">{v.medio_pago}</span>
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`d-inline-flex align-items-center gap-1 badge-soft border ${v.estado_pago === "pagado" ? "bg-success-subtle text-success border-success" : "bg-warning-subtle text-warning border-warning"}`}>
                                                    <span className={`d-inline-block rounded-circle ${v.estado_pago === "pagado" ? "bg-success" : "bg-warning"}`} style={{ width: 6, height: 6 }} />
                                                    {v.estado_pago === "pagado" ? "Pagado" : "Pendiente"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">{v.recepcionista || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>



                        {totalVentasDia > 0 && (
                            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top border-line">
                                <p className="small text-muted mb-0">Página {paginaVentas} de {totalPaginasVentas} ({totalVentasDia} ventas)</p>
                                <div className="d-flex gap-2">
                                    <button disabled={paginaVentas <= 1} onClick={() => setPaginaVentas(paginaVentas - 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">← Anterior</button>
                                    <button disabled={paginaVentas >= totalPaginasVentas} onClick={() => setPaginaVentas(paginaVentas + 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Siguiente →</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;