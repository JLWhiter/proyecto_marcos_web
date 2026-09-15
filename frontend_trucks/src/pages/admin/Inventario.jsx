import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { valorInventario, productosBajoStock, movimientosResumen } from "../../api/reportes";
import { listarInventario } from "../../api/inventario";
import { actualizarProducto, eliminarProducto } from "../../api/productos";
import { actualizarInventario } from "../../api/inventario";
import { listarMarcas, listarCategorias, listarEstadosProducto } from "../../api/catalogos";

const fechaLocalHoy = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

function InventarioAdmin() {
    const [totalProductos, setTotalProductos] = useState(0);
    const [valorInventarioValor, setValorInventarioValor] = useState(0);
    const [registradosHoy, setRegistradosHoy] = useState(0);
    const [bajoStock, setBajoStock] = useState([]);

    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [busquedaInput, setBusquedaInput] = useState("");
    const [stockMax, setStockMax] = useState("");
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const perPage = 15;

    const [modalEditar, setModalEditar] = useState(null);
    const [formEditar, setFormEditar] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");

    const [modalEliminar, setModalEliminar] = useState(null);

    const [marcas, setMarcas] = useState([]);
    const [estados, setEstados] = useState([]);

    const totalAlertas = bajoStock.length;

    const cargarProductos = useCallback(async () => {
        setCargando(true);
        try {
            const params = { page: pagina, per_page: perPage };
            if (busqueda) params.q = busqueda;
            if (stockMax !== "") params.stock = stockMax;
            const res = await listarInventario(params);
            const data = res.data || res;
            setProductos(data.items || []);
            setTotal(data.total || 0);
        } catch {
            setProductos([]);
        } finally {
            setCargando(false);
        }
    }, [pagina, busqueda, stockMax]);

    useEffect(() => {
        let activo = true;
        const fecha = fechaLocalHoy();
        Promise.allSettled([
            valorInventario(),
            productosBajoStock(),
            movimientosResumen({ fecha_desde: fecha, fecha_hasta: fecha }),
            listarMarcas(),
            listarCategorias(),
            listarEstadosProducto(),
        ]).then(([inv, bs, mov, m, , e]) => {
            if (!activo) return;
            setTotalProductos((inv.status === "fulfilled" && inv.value?.data?.total_productos) || 0);
            setValorInventarioValor((inv.status === "fulfilled" && inv.value?.data?.valor_venta) || 0);
            const movimientos = (mov.status === "fulfilled" && Array.isArray(mov.value?.data))
                ? mov.value.data
                : [];
            const totalMovimientosHoy = movimientos.reduce((sum, m) => sum + (Number(m.total_movimientos) || 0), 0);
            setRegistradosHoy(totalMovimientosHoy);
            setBajoStock((bs.status === "fulfilled" && Array.isArray(bs.value?.data)) ? bs.value.data : []);
            if (m.status === "fulfilled") setMarcas((m.value?.data || []));
            if (e.status === "fulfilled") setEstados((e.value?.data || []));
        });
        return () => { activo = false; };
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { cargarProductos(); }, [cargarProductos]);

    const formatearMoneda = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? `$ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
    };

    const handleFiltrar = () => {
        setBusqueda(busquedaInput);
        setPagina(1);
    };

    const handleTodos = () => {
        setBusquedaInput("");
        setBusqueda("");
        setStockMax("");
        setPagina(1);
    };

    const handleExportar = async () => {
        try {
            let all = [];
            const pageSize = 100;
            for (let page = 1; ; page++) {
                const params = { per_page: pageSize, page };
                if (busqueda) params.q = busqueda;
                if (stockMax !== "") params.stock = stockMax;
                const res = await listarInventario(params);
                const data = res.data || res;
                const items = data.items || [];
                all = all.concat(items);
                if (items.length < pageSize || all.length >= (data.total || 0)) break;
            }
            const headers = ["Código", "Producto", "Marca", "Proveedor", "Stock Actual", "Stock Mínimo", "Ubicación", "Estado", "Costo", "Venta"];
            const rows = all.map((p) => [
                String(p.producto_codigo || ""),
                String(p.producto_nombre || ""),
                String(p.marca_nombre || ""),
                String(p.proveedor_nombre || ""),
                p.stock_actual ?? 0,
                p.stock_minimo ?? 0,
                String(p.ubicacion_nombre || ""),
                String(p.estado_nombre || ""),
                p.precio_compra ?? 0,
                p.precio_venta ?? 0,
            ]);
            const wsData = [headers, ...rows];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const colWidths = headers.map((h, i) => {
                let maxLen = h.length;
                rows.forEach((fila) => {
                    const val = String(fila[i] ?? "");
                    if (val.length > maxLen) maxLen = val.length;
                });
                return { wch: Math.min(maxLen + 2, 40) };
            });
            ws["!cols"] = colWidths;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventario");
            XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch {
            /* silently fail */
        }
    };

    const abrirEditar = (item) => {
        setFormEditar({
            id: item.id_producto,
            id_inventario: item.id,
            nombre: item.producto_nombre || "",
            codigo: item.producto_codigo || "",
            marca: item.id_marca || "",
            estado: item.id_estado_producto || "",
            ubicacion: item.ubicacion_nombre || "",
            stock_actual: item.stock_actual ?? 0,
            stock_minimo: item.stock_minimo ?? 0,
            precio_compra: item.precio_compra ?? "",
            precio_venta: item.precio_venta ?? "",
        });
        setError("");
        setExito("");
        setModalEditar(item);
    };

    const handleGuardar = async () => {
        setGuardando(true);
        setError("");
        setExito("");
        try {
            const id = formEditar.id;
            const body = {};
            if (formEditar.nombre) body.nombre = formEditar.nombre;
            if (formEditar.codigo) body.codigo = formEditar.codigo;
            if (formEditar.marca) body.id_marca = Number(formEditar.marca);
            if (formEditar.precio_compra !== "") body.precio_compra = Number(formEditar.precio_compra);
            if (formEditar.precio_venta !== "") body.precio_venta = Number(formEditar.precio_venta);
            await actualizarProducto(id, body);
            if (formEditar.id_inventario) {
                const invBody = {};
                if (formEditar.stock_actual !== "") invBody.stock_actual = Number(formEditar.stock_actual);
                if (formEditar.stock_minimo !== "") invBody.stock_minimo = Number(formEditar.stock_minimo);
                if (Object.keys(invBody).length > 0) await actualizarInventario(formEditar.id_inventario, invBody);
            }
            setProductos((prev) => prev.map((p) => p.id === id ? { ...p, ...body, stock_actual: formEditar.stock_actual, stock_minimo: formEditar.stock_minimo } : p));
            setExito("Producto actualizado correctamente");
            setTimeout(() => { setModalEditar(null); setExito(""); }, 1200);
        } catch (err) {
            setError(err.message || "Error al actualizar");
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async () => {
        if (!modalEliminar) return;
        setGuardando(true);
        setError("");
        try {
            await eliminarProducto(modalEliminar.id_producto);
            setModalEliminar(null);
            setExito("Producto eliminado con éxito");
        } catch (err) {
            setError(err.message || "Error al eliminar");
            setTimeout(() => setError(""), 3000);
        } finally {
            setGuardando(false);
        }
    };

    const totalPaginas = Math.max(1, Math.ceil(total / perPage));

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <h2 className="fs-4 fw-bolder text-ink">Inventario</h2>
                <p className="small text-muted mt-1">Indicadores generales del inventario del sistema.</p>

                <div className="mt-4 rounded-3 border border-line bg-white p-5 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <h3 className="fw-bold text-ink small text-uppercase mb-0">Stock General</h3>
                        <span className="small fw-bold text-muted text-uppercase tracking-wide" style={{ fontSize: "0.65rem" }}>Resumen de la cantidad total de productos</span>
                    </div>
                    <div className="row g-4 mt-2">
                        <div className="col-12 col-sm-6 col-lg-4">
                            <div className="rounded-3 border border-line bg-brand-soft p-4 h-100">
                                <p className="form-label-sm mb-0">Total Productos</p>
                                <p className="mt-1 fs-2 fw-bolder text-ink">{totalProductos.toLocaleString("es-PE")}</p>
                                <p className="small text-muted mb-0">Cantidad total de productos registrados</p>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-lg-4">
                            <div className="rounded-3 border border-line bg-success-subtle p-4 h-100">
                                <p className="form-label-sm mb-0">Movimientos Hoy</p>
                                <p className="mt-1 fs-2 fw-bolder text-ink">+{registradosHoy}</p>
                                <p className="small text-muted mb-0">Entradas, salidas, ventas y daños del día</p>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-lg-4">
                            <div className="rounded-3 border border-line bg-warning-subtle p-4 h-100">
                                <p className="form-label-sm mb-0">Valor del Inventario</p>
                                <p className="mt-1 fs-2 fw-bolder text-ink">{formatearMoneda(valorInventarioValor)}</p>
                                <p className="small text-muted mb-0">Valor estimado costo/mercado</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-3 border border-line bg-white p-5 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <h3 className="fw-bold text-ink small text-uppercase mb-0">Todos los Productos</h3>
                        <div className="rounded-3 border border-danger border-opacity-50 bg-danger-subtle px-3 py-2 d-flex align-items-center gap-2">
                            <div className="d-flex rounded-circle bg-danger text-white fw-bold small align-items-center justify-content-center" style={{ width: "2rem", height: "2rem" }}>
                                {totalAlertas}
                            </div>
                            <span className="small fw-bold text-danger">Alertas de stock</span>
                        </div>
                    </div>

                    <div className="mt-4 d-flex flex-wrap align-items-end gap-3">
                        <div className="d-flex flex-column">
                            <label className="form-label-sm">Buscar</label>
                            <input value={busquedaInput} onChange={(e) => setBusquedaInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFiltrar()}
                                className="form-input" placeholder="Nombre, código, marca..." />
                        </div>
                        <div className="d-flex flex-column" style={{ width: "5rem" }}>
                            <label className="form-label-sm">Stock</label>
                            <input type="number" min="0" value={stockMax} onChange={(e) => setStockMax(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFiltrar()}
                                className="form-input" placeholder="<= " />
                        </div>
                        <div className="d-flex flex-column">
                            <label className="form-label-sm">&nbsp;</label>
                            <div className="d-flex gap-2">
                                <button onClick={handleFiltrar} className="btn btn-accent btn-sm rounded-2 fw-bold text-uppercase">Filtrar</button>
                                <button onClick={handleTodos} className="btn btn-brand btn-sm rounded-2 fw-bold text-uppercase">Todos</button>
                                <button onClick={handleExportar} className="btn btn-success btn-sm rounded-2 fw-bold text-uppercase">Exportar Excel</button>
                            </div>
                        </div>
                    </div>

                    {exito && (
                        <div className="mt-4 d-flex align-items-center justify-content-between rounded-3 border border-success-subtle bg-success-subtle px-4 py-3 flex-wrap gap-2">
                            <p className="small fw-bold text-success mb-0">{exito}</p>
                            <button onClick={() => { setExito(""); cargarProductos(); }} className="btn btn-success btn-sm rounded-2 fw-bold">Refrescar</button>
                        </div>
                    )}

                    <div className="mt-3 rounded-3 border border-line overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                                    <tr>
                                        <th className="px-3 py-3">Código</th>
                                        <th className="px-3 py-3">Producto</th>
                                        <th className="px-3 py-3">Marca</th>
                                        <th className="px-3 py-3">Proveedor</th>
                                        <th className="px-3 py-3">Ubicación</th>
                                        <th className="px-3 py-3">Estado</th>
                                        <th className="px-3 py-3">Stock</th>
                                        <th className="px-3 py-3">Mínimo</th>
                                        <th className="px-3 py-3">Costo</th>
                                        <th className="px-3 py-3">Venta</th>
                                        <th className="px-3 py-3">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargando && (
                                        <tr><td colSpan="11" className="px-3 py-5 text-center small text-muted">Cargando productos...</td></tr>
                                    )}
                                    {!cargando && productos.length === 0 && (
                                        <tr><td colSpan="11" className="px-3 py-5 text-center small text-muted">No se encontraron productos.</td></tr>
                                    )}
                                    {!cargando && productos.map((p) => {
                                        const esBajo = (p.stock_actual ?? 0) <= (p.stock_minimo ?? 0);
                                        return (
                                            <tr key={p.id} className={`small text-ink ${esBajo ? "bg-danger-subtle" : ""}`}>
                                                <td className="px-3 py-3 fw-medium text-nowrap">{p.producto_codigo}</td>
                                                <td className="px-3 py-3 fw-semibold">{p.producto_nombre}</td>
                                                <td className="px-3 py-3">{p.marca_nombre || "—"}</td>
                                                <td className="px-3 py-3 small">{p.proveedor_nombre || "—"}</td>
                                                <td className="px-3 py-3">{p.ubicacion_nombre || "—"}</td>
                                                <td className="px-3 py-3">
                                                    <span className="badge-soft bg-brand-soft text-brand">{p.estado_nombre || "—"}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={`badge-soft border ${esBajo ? "bg-danger-subtle text-danger border-danger" : "bg-success-subtle text-success border-success"}`}>
                                                        {p.stock_actual}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">{p.stock_minimo}</td>
                                                <td className="px-3 py-3 text-nowrap">{formatearMoneda(p.precio_compra)}</td>
                                                <td className="px-3 py-3 text-nowrap">{formatearMoneda(p.precio_venta)}</td>
                                                <td className="px-3 py-3">
                                                    <button onClick={() => abrirEditar(p)} className="btn btn-sm btn-outline-brand rounded-2 fw-bold">Editar</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {total > 0 && (
                            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top border-line flex-wrap gap-2">
                                <p className="small text-muted mb-0">Página {pagina} de {totalPaginas} ({total} productos)</p>
                                <div className="d-flex gap-2">
                                    <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">← Anterior</button>
                                    <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Siguiente →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalEditar && (
                <div className="modal-overlay" onClick={() => setModalEditar(null)}>
                    <div className="modal-card max-w-600" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <span className="modal-title">Editar Producto</span>
                            <button onClick={() => setModalEditar(null)} className="modal-close" aria-label="Cerrar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="row g-4">
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Nombre</label>
                                    <input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} className="form-input" />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Código</label>
                                    <input value={formEditar.codigo} onChange={(e) => setFormEditar({ ...formEditar, codigo: e.target.value })} className="form-input" />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Marca</label>
                                    <select value={formEditar.marca} onChange={(e) => setFormEditar({ ...formEditar, marca: e.target.value })} className="form-input">
                                        <option value="">Seleccionar...</option>
                                        {marcas.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
                                    </select>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Estado</label>
                                    <select value={formEditar.estado} onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })} className="form-input">
                                        <option value="">Seleccionar...</option>
                                        {estados.map((es) => (<option key={es.id} value={es.id}>{es.nombre}</option>))}
                                    </select>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Ubicación</label>
                                    <input value={formEditar.ubicacion} onChange={(e) => setFormEditar({ ...formEditar, ubicacion: e.target.value })} className="form-input" />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Stock Actual</label>
                                    <input type="number" min="0" value={formEditar.stock_actual} onChange={(e) => setFormEditar({ ...formEditar, stock_actual: e.target.value })} className="form-input" />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Stock Mínimo</label>
                                    <input type="number" min="0" value={formEditar.stock_minimo} onChange={(e) => setFormEditar({ ...formEditar, stock_minimo: e.target.value })} className="form-input" />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Costo ($)</label>
                                    <input type="number" step="0.01" min="0" value={formEditar.precio_compra} onChange={(e) => setFormEditar({ ...formEditar, precio_compra: e.target.value })} className="form-input" />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label-sm">Venta ($)</label>
                                    <input type="number" step="0.01" min="0" value={formEditar.precio_venta} onChange={(e) => setFormEditar({ ...formEditar, precio_venta: e.target.value })} className="form-input" />
                                </div>
                            </div>
                            {error && <p className="small text-danger fw-semibold mt-3 mb-0">{error}</p>}
                            {exito && <p className="small text-success fw-semibold mt-3 mb-0">{exito}</p>}
                        </div>
                        <div className="modal-foot">
                            <button onClick={() => { setModalEliminar(modalEditar); setModalEditar(null); }}
                                className="btn btn-danger btn-sm rounded-2 fw-bold">Eliminar Producto</button>
                            <div className="d-flex gap-2">
                                <button onClick={() => setModalEditar(null)} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Cancelar</button>
                                <button onClick={handleGuardar} disabled={guardando}
                                    className="btn btn-accent btn-sm rounded-2 fw-bold">
                                    {guardando ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalEliminar && (
                <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
                    <div className="modal-card max-w-600" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <span className="modal-title">Eliminar Producto</span>
                            <button onClick={() => { setModalEliminar(null); setModalEditar(null); }} className="modal-close" aria-label="Cerrar">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex rounded-circle bg-danger-subtle align-items-center justify-content-center" style={{ width: "2.5rem", height: "2.5rem" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#dc2626"><path d="M12,2C17.52,2 22,6.48 22,12C22,17.52 17.52,22 12,22C6.48,22 2,17.52 2,12C2,6.48 6.48,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/></svg>
                                </div>
                                <div>
                                    <h3 className="fw-bold text-ink small text-uppercase mb-1">Eliminar Producto</h3>
                                    <p className="small text-muted mb-0">El producto será oculto del sistema.</p>
                                </div>
                            </div>
                            <p className="text-ink mt-3 mb-2">
                                ¿Estás seguro de ocultar <strong>{modalEliminar.producto_nombre}</strong> ({modalEliminar.producto_codigo})?
                            </p>
                            <p className="small text-warning fw-semibold mb-0">El producto no aparecerá en el inventario, pero se mantendrán los registros de ventas existentes.</p>
                            {error && <p className="small text-danger fw-semibold mt-3 mb-0">{error}</p>}
                        </div>
                        <div className="modal-foot">
                            <button onClick={() => setModalEliminar(null)} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Cancelar</button>
                            <button onClick={handleEliminar} disabled={guardando}
                                className="btn btn-danger btn-sm rounded-2 fw-bold">
                                {guardando ? "Eliminando..." : "Sí, Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventarioAdmin;