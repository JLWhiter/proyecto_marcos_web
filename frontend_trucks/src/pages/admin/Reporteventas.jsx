import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { listarVentas, cambiarEstadoPago, actualizarVendedor } from "../../api/ventas";
import { listarUsuarios } from "../../api/usuarios";
import { ventasResumen, evolucionVentas } from "../../api/reportes";

function Reporteventas() {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const [totalVentas, setTotalVentas] = useState(0);
    const [variacionVentas, setVariacionVentas] = useState(0);
    const [evolucion, setEvolucion] = useState([]);
    const [menuGrafico, setMenuGrafico] = useState(false);
    const [monedaEvolucion, setMonedaEvolucion] = useState("$");
    const [vendedores, setVendedores] = useState([]);
    const [editandoVendedor, setEditandoVendedor] = useState(null);
    const [nuevoVendedorId, setNuevoVendedorId] = useState("");

    const tablaRef = useRef(null);
    const perPage = 10;
    const totalPaginas = Math.max(1, Math.ceil(total / perPage));

    useEffect(() => {
        let activo = true;
        listarVentas({
            page: pagina,
            per_page: perPage,
            fecha_desde: fechaDesde || undefined,
            fecha_hasta: fechaHasta || undefined,
        })
            .then((res) => {
                if (!activo) return;
                setVentas(res.data || []);
                setTotal((res.pagination && res.pagination.total) || 0);
                setError("");
            })
            .catch((err) => { if (activo) { setVentas([]); setTotal(0); setError(err.message); } })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [pagina, fechaDesde, fechaHasta]);

    useEffect(() => {
        let activo = true;
        const hoy = new Date();
        evolucionVentas({ anio: hoy.getFullYear(), moneda: monedaEvolucion })
            .then((ev) => {
                if (activo) setEvolucion(Array.isArray(ev.data) ? ev.data : []);
            })
            .catch(() => { if (activo) setEvolucion([]); });
        return () => { activo = false; };
    }, [monedaEvolucion]);

    useEffect(() => {
        let activo = true;
        const hoy = new Date();
        const periodo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
        ventasResumen({ periodo })
            .then((vt) => {
                if (!activo) return;
                setTotalVentas((vt.data && vt.data.total_ventas) || 0);
                setVariacionVentas((vt.data && vt.data.variacion) || 0);
            })
            .catch(() => {});
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        listarUsuarios({ per_page: 100, solo_activos: "1", id_rol: 2 })
            .then((res) => setVendedores(res.data?.items || []))
            .catch(() => {});
    }, []);

    const handleGuardarVendedor = async (ventaId) => {
        if (!nuevoVendedorId) return;
        try {
            const res = await actualizarVendedor(ventaId, Number(nuevoVendedorId));
            const data = res.data;
            setVentas((prev) =>
                prev.map((v) =>
                    v.id === ventaId
                        ? { ...v, id_usuario: data.id_usuario, vendedor_nombre: data.vendedor_nombre }
                        : v
                )
            );
            setEditandoVendedor(null);
            setNuevoVendedorId("");
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleEstadoPago = async (ventaId) => {
        try {
            await cambiarEstadoPago(ventaId);
            setVentas((prev) =>
                prev.map((v) =>
                    v.id === ventaId
                        ? { ...v, estado_pago: v.estado_pago === "pagado" ? "pendiente" : "pagado" }
                        : v
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

    const formatearMoneda = (v, moneda) => {
        const n = Number(v);
        const simbolo = moneda === "S/" ? "S/" : "$";
        return Number.isFinite(n) ? `${simbolo} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
    };

    const formatearFecha = (v) => {
        if (!v) return "—";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const formatearFechaCelda = (v) => {
        if (!v) return "";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const exportarExcel = (datos, cabeceras, nombreArchivo) => {
        const wsData = [cabeceras, ...datos];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const colWidths = cabeceras.map((h, i) => {
            let maxLen = h.length;
            datos.forEach((fila) => {
                const val = String(fila[i] ?? "");
                if (val.length > maxLen) maxLen = val.length;
            });
            return { wch: Math.min(maxLen + 2, 40) };
        });
        ws["!cols"] = colWidths;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ventas");
        XLSX.writeFile(wb, nombreArchivo);
    };

    const descargarExcel = () => {
        let totalDolares = 0;
        let totalSoles = 0;
        const filas = ventas.map((v) => {
            const monto = Number(v.precio_final) || 0;
            if (v.moneda === "S/") totalSoles += monto;
            else totalDolares += monto;
            return [
                formatearFechaCelda(v.fecha_hora),
                v.nombre_cliente || "",
                v.ruc_dni || "",
                v.codigo_producto || "",
                v.nombre_producto || "",
                v.cantidad ?? "",
                Number(v.precio_unitario) || 0,
                Number(v.precio_final) || 0,
                v.moneda || "",
                v.medio_pago || "",
                v.plazos || 0,
                v.estado_pago || "",
                v.numero_documento || "",
                v.vendedor_nombre || "",
                v.destino || "",
                v.observaciones || "",
            ];
        });
        filas.push([]);
        filas.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        filas.push(["TOTALES", "", "", "", "", "", "", `$ ${totalDolares.toFixed(2)}`, "$", "", "", "", "", "", "", ""]);
        filas.push(["", "", "", "", "", "", "", `S/ ${totalSoles.toFixed(2)}`, "S/", "", "", "", "", "", "", ""]);
        exportarExcel(
            filas,
            ["Fecha", "Cliente", "RUC/DNI", "Código", "Producto", "Cant.", "P. Unitario", "Monto Total", "Divisa", "Medio Pago", "Plazos", "Estado Pago", "N° Documento", "Vendedor", "Destino", "Observaciones"],
            `reporte_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
    };

    const verDetalleEvolucion = () => {
        setMenuGrafico(false);
        tablaRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const exportarEvolucion = () => {
        setMenuGrafico(false);
        const filas = meses.map((m) => [m.etiqueta, Number(m.total) || 0]);
        exportarExcel(
            filas,
            ["Mes", `Total Ventas (${monedaEvolucion})`],
            `evolucion_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
    };

    const mesActual = new Date().getMonth() + 1;
    const meses = evolucion.filter((m) => m.mes <= mesActual).slice(-6);
    const maxMes = Math.max(1, ...meses.map((m) => Number(m.total) || 0));

    const badgeVariacion = (v) => {
        const n = Number(v) || 0;
        let base = "badge-soft border ";
        if (n > 0) return base + "bg-success-subtle text-success border-success";
        if (n < 0) return base + "bg-danger-subtle text-danger border-danger";
        return base + "bg-body-secondary text-secondary border-secondary";
    };

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <h2 className="fs-4 fw-bolder text-ink">Reporte Venta</h2>
                <p className="small text-muted mt-1">Indicadores del inventario y registro de ventas del sistema.</p>

                <div className="mt-4 rounded-3 border border-line bg-white p-5 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between gap-4 flex-wrap">
                        <div>
                            <p className="form-label-sm mb-0">Total Sales</p>
                            <p className="mt-1 fs-2 fw-bolder text-ink">{formatearMoneda(totalVentas)}</p>
                            <p className="small text-muted mt-1" style={{ maxWidth: "26rem" }}>
                                Representa el monto total de dinero generado por las ventas durante el período seleccionado.
                            </p>
                        </div>
                        <span className={badgeVariacion(variacionVentas)}>
                            {variacionVentas > 0 ? "+" : ""}{variacionVentas}% vs. last period
                        </span>
                    </div>
                </div>

                <div className="mt-4 rounded-3 border border-line bg-white p-5 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between">
                        <h3 className="fw-bold text-ink small mb-0">Evolución de Ventas <span className="text-brand">({monedaEvolucion === "S/" ? "Soles" : "Dólares"})</span></h3>
                        <div className="position-relative">
                            <button onClick={() => setMenuGrafico((m) => !m)} className="btn rounded-circle p-1 border-0 text-muted" style={{ width: "2rem", height: "2rem" }} aria-label="Opciones del gráfico">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                            </button>
                            {menuGrafico && (
                                <div className="position-absolute top-100 end-0 mt-1 rounded-3 border border-line bg-white py-1 shadow" style={{ width: "12rem", zIndex: 10 }}>
                                    <button className={`d-block w-100 px-3 py-2 mb-0 text-start bg-transparent border-0 small ${monedaEvolucion === "$" ? "fw-bold text-brand" : "text-ink"}`} onClick={() => { setMonedaEvolucion("$"); setMenuGrafico(false); }}>Ver en Dólares ($)</button>
                                    <button className={`d-block w-100 px-3 py-2 mb-0 text-start bg-transparent border-0 small ${monedaEvolucion === "S/" ? "fw-bold text-brand" : "text-ink"}`} onClick={() => { setMonedaEvolucion("S/"); setMenuGrafico(false); }}>Ver en Soles (S/)</button>
                                    <div className="border-top border-line my-1" />
                                    <button className="d-block w-100 px-3 py-2 mb-0 text-start bg-transparent border-0 small text-ink" onClick={verDetalleEvolucion}>Ver detalle</button>
                                    <button className="d-block w-100 px-3 py-2 mb-0 text-start bg-transparent border-0 small text-ink" onClick={exportarEvolucion}>Exportar datos</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 d-flex align-items-end">
                        <div className="d-flex flex-column justify-content-between pe-2 text-end small text-muted" style={{ height: "12rem", fontSize: "0.65rem" }}>
                            <span>{formatearMoneda(maxMes, monedaEvolucion)}</span>
                            <span>{formatearMoneda(maxMes / 2, monedaEvolucion)}</span>
                            <span>{monedaEvolucion} 0</span>
                        </div>
                        <div className="position-relative flex-grow-1">
                            {(() => (
                                <div className="d-flex flex-column justify-content-between position-absolute top-0 start-0 end-0 bottom-0 pe-none">
                                    <div className="border-top border-dashed border-line" />
                                    <div className="border-top border-dashed border-line" />
                                    <div className="border-top border-dashed border-line" />
                                </div>
                            ))()}
                            <div className="d-flex align-items-end gap-3 position-relative" style={{ height: "12rem" }}>
                                {meses.map((m) => {
                                    const alto = maxMes > 0 ? Math.max(2, (Number(m.total) / maxMes) * 100) : 2;
                                    const esActual = m.mes === mesActual;
                                    return (
                                        <div key={m.mes} className="flex-1 d-flex flex-column align-items-center gap-1">
                                            <span className="small fw-semibold text-ink" style={{ fontSize: "0.65rem" }}>{formatearMoneda(m.total, monedaEvolucion)}</span>
                                            <div className="w-100 d-flex align-items-end justify-content-center" style={{ height: "9rem" }}>
                                                <div
                                                    title={m.etiqueta}
                                                    className={`w-100 ${esActual ? "bg-brand" : "bg-line"}`}
                                                    style={{ height: `${alto}%`, maxWidth: "2.25rem", borderTopLeftRadius: "0.25rem", borderTopRightRadius: "0.25rem" }}
                                                />
                                            </div>
                                            <span className={`small fw-bold ${esActual ? "text-brand" : "text-muted"}`}>{m.etiqueta}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <p className="mt-2 small text-muted" style={{ fontSize: "0.65rem" }}>Eje horizontal: meses · Eje vertical: monto de ventas. El mes actual aparece resaltado.</p>
                </div>

                {error && <div className="alert alert-danger rounded-3 mt-4 py-3 small" role="alert">{error}</div>}

                <div ref={tablaRef} className="mt-4 rounded-3 border border-line bg-white overflow-hidden shadow-sm">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 border-bottom border-line">
                        <h3 className="fw-bold text-ink small text-uppercase mb-0">Tabla de Ventas</h3>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPagina(1); }} className="form-control form-control-sm rounded-2" />
                            <span className="small text-muted">a</span>
                            <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPagina(1); }} className="form-control form-control-sm rounded-2" />
                            <button onClick={descargarExcel} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Descargar Excel</button>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                                <tr>
                                    <th className="px-3 py-3">Fecha</th>
                                    <th className="px-3 py-3">Cliente</th>
                                    <th className="px-3 py-3">RUC/DNI</th>
                                    <th className="px-3 py-3">Producto</th>
                                    <th className="px-3 py-3">Cant.</th>
                                    <th className="px-3 py-3">Monto</th>
                                    <th className="px-3 py-3">Divisa</th>
                                    <th className="px-3 py-3">Medio Pago</th>
                                    <th className="px-3 py-3">Plazos</th>
                                    <th className="px-3 py-3">Estado Pago</th>
                                    <th className="px-3 py-3">Documento</th>
                                    <th className="px-3 py-3">Vendedor</th>
                                    <th className="px-3 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando && (
                                    <tr><td colSpan="13" className="px-3 py-5 text-center small text-muted">Cargando ventas...</td></tr>
                                )}
                                {!cargando && ventas.length === 0 && (
                                    <tr><td colSpan="13" className="px-3 py-5 text-center small text-muted">No hay ventas registradas.</td></tr>
                                )}
                                {ventas.map((v) => (
                                    <tr key={v.id} className="small text-ink">
                                        <td className="px-3 py-3 text-nowrap">{formatearFecha(v.fecha_hora)}</td>
                                        <td className="px-3 py-3">{v.nombre_cliente || "—"}</td>
                                        <td className="px-3 py-3">{v.ruc_dni || "—"}</td>
                                        <td className="px-3 py-3">
                                            <span className="fw-medium">{v.codigo_producto || "—"}</span>
                                            {v.nombre_producto && <span className="d-block small text-muted">{v.nombre_producto}</span>}
                                        </td>
                                        <td className="px-3 py-3">{v.cantidad ?? "—"}</td>
                                        <td className="px-3 py-3 fw-semibold text-nowrap">{formatearMoneda(v.precio_final, v.moneda)}</td>
                                        <td className="px-3 py-3">{v.moneda || "—"}</td>
                                        <td className="px-3 py-3">
                                            {v.medio_pago
                                                ? <span className="badge-soft bg-brand-soft text-brand text-uppercase">{v.medio_pago}</span>
                                                : "—"}
                                        </td>
                                        <td className="px-3 py-3">{(v.plazos && v.plazos > 1) ? `${v.plazos}x` : (v.plazos || 0)}</td>
                                        <td className="px-3 py-3">
                                            <button
                                                onClick={() => toggleEstadoPago(v.id)}
                                                className={`btn btn-sm rounded-2 fw-bold text-uppercase border cursor-pointer ${
                                                    v.estado_pago === "pagado"
                                                        ? "btn-outline-success"
                                                        : "btn-outline-warning"
                                                }`}
                                            >
                                                <span className={`d-inline-block rounded-circle me-1 ${v.estado_pago === "pagado" ? "bg-success" : "bg-warning"}`} style={{ width: 6, height: 6 }} />
                                                {v.estado_pago === "pagado" ? "Pagado" : "Pendiente"}
                                            </button>
                                        </td>
                                        <td className="px-3 py-3">{v.numero_documento || v.tipo_documento || "—"}</td>
                                        <td className="px-3 py-3">
                                            {editandoVendedor === v.id ? (
                                                <div className="d-flex align-items-center gap-1">
                                                    <select value={nuevoVendedorId} onChange={(e) => setNuevoVendedorId(e.target.value)} className="form-select form-select-sm rounded-2">
                                                        <option value="">Seleccionar...</option>
                                                        {vendedores.map((ve) => (
                                                            <option key={ve.id} value={ve.id}>{ve.nombre} {ve.apellidos}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={() => handleGuardarVendedor(v.id)} className="btn btn-sm text-success fw-bold" title="Guardar">✓</button>
                                                    <button onClick={() => { setEditandoVendedor(null); setNuevoVendedorId(""); }} className="btn btn-sm text-danger fw-bold" title="Cancelar">✕</button>
                                                </div>
                                            ) : (
                                                <span>{v.vendedor_nombre || "—"}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <button
                                                onClick={() => { setEditandoVendedor(v.id); setNuevoVendedorId(v.id_usuario || ""); }}
                                                className="btn btn-link p-1 text-brand"
                                                title="Editar vendedor"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top border-line flex-wrap gap-2">
                        <p className="small text-muted mb-0">Página {pagina} de {totalPaginas} ({total} ventas)</p>
                        <div className="d-flex gap-2">
                            <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">← Anterior</button>
                            <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Siguiente →</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reporteventas;