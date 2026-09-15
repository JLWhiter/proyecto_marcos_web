import { useEffect, useState } from "react";
import { historialDia } from "../../api/reportes";
import { useAuth } from "../../context/AuthContext";

function Historial() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [orden, setOrden] = useState("desc");
    const [pagina, setPagina] = useState(1);
    const perPage = 15;
    const totalPaginas = Math.max(1, Math.ceil(productos.length / perPage));
    const productosVisibles = productos.slice((pagina - 1) * perPage, pagina * perPage);

    const [filtros, setFiltros] = useState({
        fecha_desde: "",
        fecha_hasta: "",
        codigo: "",
        disponibilidad: "",
    });

    useEffect(() => {
        let activo = true;
        const params = { ...filtros, orden };
        if (user?.rol_nombre !== "Administrador" && user?.id) {
            params.usuario_id = user.id;
        }
        historialDia(params)
            .then((res) => { if (activo) setProductos(res.data || []); })
            .catch((err) => { if (activo) setError(err.message); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [filtros, orden, user?.id, user?.rol_nombre]);

    const limpiarFiltros = () => {
        setPagina(1);
        setFiltros({ fecha_desde: "", fecha_hasta: "", codigo: "", disponibilidad: "" });
    };

    const formatearFecha = (v) => {
        if (!v) return "—";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const tipoBadge = (tipo) => {
        let base = "badge-soft border text-uppercase ";
        switch ((tipo || "").toLowerCase()) {
            case "entrada": return base + "bg-success-subtle text-success border-success";
            case "salida": return base + "bg-danger-subtle text-danger border-danger";
            case "venta": return base + "bg-info-subtle text-info border-info";
            case "daño":
            case "dano": return base + "bg-warning-subtle text-warning border-warning";
            default: return base + "bg-body-secondary text-secondary border-secondary";
        }
    };

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <h2 className="fs-4 fw-bolder text-ink">Historial del Día</h2>

                <div className="mt-4 rounded-3 border border-line bg-white p-4 d-flex flex-wrap align-items-end gap-3">
                    <div className="d-flex flex-column">
                        <label className="form-label-sm">Desde</label>
                        <input type="date" className="form-control form-control-sm rounded-2" value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} />
                    </div>
                    <div className="d-flex flex-column">
                        <label className="form-label-sm">Hasta</label>
                        <input type="date" className="form-control form-control-sm rounded-2" value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} />
                    </div>
                    <div className="d-flex flex-column">
                        <label className="form-label-sm">Código</label>
                        <input type="text" placeholder="Ej: 1522349" className="form-control form-control-sm rounded-2" value={filtros.codigo} onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })} />
                    </div>
                    <div className="d-flex flex-column">
                        <label className="form-label-sm">Disponibilidad</label>
                        <select className="form-select form-select-sm rounded-2" value={filtros.disponibilidad} onChange={(e) => setFiltros({ ...filtros, disponibilidad: e.target.value })}>
                            <option value="">Todas</option>
                            <option value="disponible">Disponible</option>
                            <option value="agotado">Agotado</option>
                            <option value="bajo_stock">Bajo stock</option>
                        </select>
                    </div>
                    <div className="d-flex gap-2 ms-auto">
                        <button onClick={limpiarFiltros} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Limpiar</button>
                        <button onClick={() => { setPagina(1); setFiltros({ ...filtros }); }} className="btn btn-accent btn-sm rounded-2 fw-bold">Aplicar</button>
                    </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                    <button onClick={() => { setPagina(1); setOrden((o) => (o === "desc" ? "asc" : "desc")); }} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">
                        Clasificar: {orden === "desc" ? "Descendente ↓" : "Ascendente ↑"}
                    </button>
                </div>

                <div className="mt-3 rounded-3 border border-line bg-white overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                                <tr>
                                    <th className="px-3 py-3">Fecha</th>
                                    <th className="px-3 py-3">Código</th>
                                    <th className="px-3 py-3">Nombre</th>
                                    <th className="px-3 py-3">Marca</th>
                                    <th className="px-3 py-3">Cant.</th>
                                    <th className="px-3 py-3">Movimiento</th>
                                    <th className="px-3 py-3">Stock</th>
                                    <th className="px-3 py-3">Observación</th>
                                    <th className="px-3 py-3">Registrado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando && (<tr><td colSpan="9" className="px-3 py-5 text-center small text-muted">Cargando historial...</td></tr>)}
                                {!cargando && error && (<tr><td colSpan="9" className="px-3 py-5 text-center small text-danger">{error}</td></tr>)}
                                {!cargando && !error && productos.length === 0 && (<tr><td colSpan="9" className="px-3 py-5 text-center small text-muted">No hay movimientos que coincidan con los filtros.</td></tr>)}
                                {productosVisibles.map((item, index) => (
                                    <tr key={index} className="small text-ink">
                                        <td className="px-3 py-3 text-nowrap">{formatearFecha(item.fecha_hora)}</td>
                                        <td className="px-3 py-3 fw-medium">{item.codigo || "—"}</td>
                                        <td className="px-3 py-3">{item.nombre || "—"}</td>
                                        <td className="px-3 py-3">{item.marca || "—"}</td>
                                        <td className="px-3 py-3 fw-bold">{item.cantidad ?? "—"}</td>
                                        <td className="px-3 py-3">
                                            <span className={tipoBadge(item.movimiento)}>{item.movimiento || "—"}</span>
                                        </td>
                                        <td className="px-3 py-3 small text-muted">{item.stock_actual ?? "—"}</td>
                                        <td className="px-3 py-3 small text-muted" style={{ maxWidth: "10rem" }} title={item.observacion || ""}>{item.observacion || "—"}</td>
                                        <td className="px-3 py-3">
                                            <span className="badge-soft bg-brand-soft text-brand">{item.usuario_completo || item.usuario_nombre || "—"}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!cargando && productos.length > 0 && (
                    <div className="d-flex align-items-center justify-content-between mt-4 flex-wrap gap-2">
                        <p className="small text-muted mb-0">Página {pagina} de {totalPaginas} ({productos.length} registros)</p>
                        <div className="d-flex gap-2">
                            <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">← Anterior</button>
                            <button disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Historial;