import { useEffect, useState } from "react";
import { reportesDano } from "../../api/reportes";

function InformeDaños() {
    const [reportes, setReportes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtros, setFiltros] = useState({ fecha_desde: "", fecha_hasta: "" });
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [imagen, setImagen] = useState(null);

    const perPage = 10;
    const totalPaginas = Math.max(1, Math.ceil(total / perPage));

    useEffect(() => {
        let activo = true;
        reportesDano({ ...filtros, page: pagina, per_page: perPage })
            .then((res) => {
                if (!activo) return;
                setReportes(res.data || []);
                setTotal((res.pagination && res.pagination.total) || 0);
                setError("");
            })
            .catch((err) => { if (activo) { setReportes([]); setTotal(0); setError(err.message); } })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [filtros, pagina]);

    const formatearFecha = (v) => {
        if (!v) return "—";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
    };

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <h2 className="fs-4 fw-bolder text-ink">Informe de Daños</h2>
                <p className="small text-muted mt-1">Reportes de producto dañado/fallado registrados por el almacén.</p>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button onClick={() => setMostrarFiltros((v) => !v)} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Filtrar</button>
                </div>

                {mostrarFiltros && (
                    <div className="mt-3 rounded-3 border border-line bg-white p-4 d-flex flex-wrap align-items-end gap-3">
                        <div className="d-flex flex-column">
                            <label className="form-label-sm">Desde</label>
                            <input type="date" className="form-control form-control-sm rounded-2" value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} />
                        </div>
                        <div className="d-flex flex-column">
                            <label className="form-label-sm">Hasta</label>
                            <input type="date" className="form-control form-control-sm rounded-2" value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} />
                        </div>
                        <div className="d-flex gap-2 ms-auto">
                            <button onClick={() => { setFiltros({ fecha_desde: "", fecha_hasta: "" }); setPagina(1); }} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Limpiar</button>
                            <button onClick={() => { setFiltros({ ...filtros }); setPagina(1); setMostrarFiltros(false); }} className="btn btn-accent btn-sm rounded-2 fw-bold">Aplicar</button>
                        </div>
                    </div>
                )}

                <div className="mt-3 rounded-3 border border-line bg-white overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                                <tr>
                                    <th className="px-3 py-3">Fecha</th>
                                    <th className="px-3 py-3">Código</th>
                                    <th className="px-3 py-3">Producto</th>
                                    <th className="px-3 py-3">Cantidad</th>
                                    <th className="px-3 py-3">Descripción</th>
                                    <th className="px-3 py-3">Registrado por</th>
                                    <th className="px-3 py-3">Evidencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando && (<tr><td colSpan="7" className="px-3 py-5 text-center small text-muted">Cargando informes...</td></tr>)}
                                {!cargando && error && (<tr><td colSpan="7" className="px-3 py-5 text-center small text-danger">{error}</td></tr>)}
                                {!cargando && !error && reportes.length === 0 && (<tr><td colSpan="7" className="px-3 py-5 text-center small text-muted">No hay reportes de daño.</td></tr>)}
                                {reportes.map((r) => (
                                    <tr key={r.id} className="small text-ink align-top">
                                        <td className="px-3 py-3 text-nowrap">{formatearFecha(r.fecha)}</td>
                                        <td className="px-3 py-3">{r.producto_codigo || "—"}</td>
                                        <td className="px-3 py-3">{r.producto_nombre || "—"}</td>
                                        <td className="px-3 py-3 fw-bold text-danger">{r.cantidad ?? "—"}</td>
                                        <td className="px-3 py-3" style={{ maxWidth: "17rem" }}>{r.descripcion || "—"}</td>
                                        <td className="px-3 py-3">{r.usuario_nombre || "—"}</td>
                                        <td className="px-3 py-3">
                                            {r.evidencia_url
                                                ? <button onClick={() => setImagen(r.evidencia_url)} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Ver</button>
                                                : <span className="small text-muted">Sin evidencia</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top border-line flex-wrap gap-2">
                        <p className="small text-muted mb-0">Página {pagina} de {totalPaginas} ({total} informes)</p>
                        <div className="d-flex gap-2">
                            <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">← Anterior</button>
                            <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Siguiente →</button>
                        </div>
                    </div>
                </div>
            </div>

            {imagen && (
                <div className="modal-overlay" onClick={() => setImagen(null)}>
                    <div className="max-w-700 w-100 text-center" onClick={(e) => e.stopPropagation()}>
                        <img src={imagen} alt="Evidencia del daño" className="w-100 rounded-3" style={{ maxHeight: "calc(100vh - 4rem)", objectFit: "contain" }} />
                        <button onClick={() => setImagen(null)} className="btn btn-outline-brand rounded-3 fw-bold mt-3">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InformeDaños;