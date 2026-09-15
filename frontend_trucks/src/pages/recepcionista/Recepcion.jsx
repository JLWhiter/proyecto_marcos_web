import { useEffect, useMemo, useRef, useState } from "react";
import { getUser } from "../../api/client";
import { listarProductos, actualizarProducto, registrarProducto, subirImagenProducto } from "../../api/productos";
import { registrarMovimiento } from "../../api/movimientos";
import { listarProveedores, crearProveedor } from "../../api/proveedores";
import { listarMarcas, crearMarca, listarCategorias, crearCategoria, listarEstadosProducto } from "../../api/catalogos";
import TablaProductos from "./components/TablaProductos";
import FormNuevoProducto from "./components/FormNuevoProducto";
import DetalleProducto from "./components/DetalleProducto";
import ModalAlert from "../../components/ModalAlert";

function construirFilas(productos) {
    return (productos || []).map((p) => {
        const qty = p.stock_actual ?? 0;
        let status = 'DISPONIBLE';
        if (!p.id_inventario) status = 'SIN STOCK';
        else if (qty === 0) status = 'URGENTE';
        else if (qty <= 2) status = 'PENDIENTE';
        const proveedores = (p.proveedores && p.proveedores.length > 0)
            ? p.proveedores.map((pr) => pr.nombre).join(', ')
            : (p.proveedor_nombre || '—');
        return {
            id: p.id,
            code: p.codigo,
            name: p.nombre,
            qty,
            rec: qty,
            status,
            proveedor: proveedores,
            marcas: p.marcas_nombres || p.marca_nombre || '—',
            costo: p.precio_compra,
            price: p.precio_venta,
            idInventario: p.id_inventario,
            ubicacion: p.ubicacion_nombre || null,
            imagen_url: p.imagen_url || null,
        };
    });
}

function Recepcion({ busqueda, onBuscar, pagina, cambiarPagina }) {

    const [selectedId, setSelectedId] = useState(null);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [refreshTick, setRefreshTick] = useState(0);
    const perPage = 15;
    const totalPaginas = Math.max(1, Math.ceil(total / perPage));
    const [filtroAbierto, setFiltroAbierto] = useState(true);
    const [sortAbierto, setSortAbierto] = useState(false);
    const [columnaOrden, setColumnaOrden] = useState('code');
    const [direccion, setDireccion] = useState('asc');
    const [precioEdit, setPrecioEdit] = useState(0);
    const [costoEdit, setCostoEdit] = useState(0);
    const [recEdit, setRecEdit] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [modalAlert, setModalAlert] = useState({ open: false, tipo: "error", titulo: "", mensaje: "" });
    const [pendienteAdquisicion, setPendienteAdquisicion] = useState(false);
    const esAdmin = getUser()?.rol_nombre === "Administrador";
    const tienePrivilegio = esAdmin || getUser()?.privilegio === "editar_precio";

    const [formAbierto, setFormAbierto] = useState(false);
    const [proveedores, setProveedores] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoCodigo, setNuevoCodigo] = useState("");
    const [nuevoProveedor, setNuevoProveedor] = useState("");
    const [nuevoProveedorOtro, setNuevoProveedorOtro] = useState("");
    const [nuevoMarca, setNuevoMarca] = useState("");
    const [nuevoMarcaOtro, setNuevoMarcaOtro] = useState("");
    const [nuevoCategoria, setNuevoCategoria] = useState("");
    const [nuevoCategoriaOtro, setNuevoCategoriaOtro] = useState("");
    const [nuevoEstado, setNuevoEstado] = useState("Nuevo");
    const [nuevaUbicacion, setNuevaUbicacion] = useState("");
    const [nuevoCosto, setNuevoCosto] = useState("");
    const [nuevoVenta, setNuevoVenta] = useState("");
    const [nuevoCantidad, setNuevoCantidad] = useState("");
    const [guardandoNuevo, setGuardandoNuevo] = useState(false);
    const fotoFileRef = useRef(null);
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState("");

    useEffect(() => {
        listarProveedores().then((res) => setProveedores(res.data || [])).catch(() => {});
        listarMarcas().then((res) => setMarcas(res.data || [])).catch(() => {});
        listarCategorias().then((res) => setCategorias(res.data || [])).catch(() => {});
        listarEstadosProducto().then((res) => setEstados(res.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        let activo = true;
        const id = setTimeout(async () => {
            try {
                const res = await listarProductos(perPage, busqueda.trim(), pagina);
                if (!activo) return;
                const filas = construirFilas(res.data || []);
                setRows(filas);
                setTotal((res.pagination && res.pagination.total) || 0);
                const fila = (selectedId != null ? filas.find((f) => f.id === selectedId) : null) || filas[0] || null;
                if (fila) {
                    setSelectedId(fila.id);
                    setPrecioEdit(fila.price ?? 0);
                    setCostoEdit(fila.costo ?? 0);
                    setRecEdit(fila.rec ?? 0);
                } else {
                    setSelectedId(null);
                }
            } catch {
                /* error silently */
            }
        }, 300);
        return () => { activo = false; clearTimeout(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, pagina, refreshTick]);

    const visibleRows = useMemo(() => {
        const arr = [...rows];
        arr.sort((a, b) => {
            let va = a[columnaOrden];
            let vb = b[columnaOrden];
            if (va == null) va = "";
            if (vb == null) vb = "";
            let cmp;
            if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
            else cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
            return direccion === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [rows, columnaOrden, direccion]);

    const selectedProduct = visibleRows.find((row) => row.id === selectedId) || visibleRows[0] || null;

    const handleSelect = (row) => {
        setSelectedId(row.id);
        setPrecioEdit(row.price ?? 0);
        setCostoEdit(row.costo ?? 0);
        setRecEdit(row.rec ?? 0);
    };

    const guardarPrecio = async () => {
        const p = selectedProduct;
        if (!p || !esAdmin) return;
        setGuardando(true);
        setError("");
        setMensaje("");
        try {
            await actualizarProducto(p.id, { precio_venta: Number(precioEdit) });
            setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, price: Number(precioEdit) } : r)));
            setMensaje("Precio de venta actualizado");
        } catch (err) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: err.message });
        } finally {
            setGuardando(false);
        }
    };

    const guardarCosto = async () => {
        const p = selectedProduct;
        if (!p) return;
        setGuardando(true);
        setError("");
        setMensaje("");
        try {
            await actualizarProducto(p.id, { precio_compra: Number(costoEdit) });
            setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, costo: Number(costoEdit) } : r)));
            setMensaje("Costo unitario actualizado");
        } catch (err) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: err.message });
        } finally {
            setGuardando(false);
        }
    };

    const finalizarAdquisicion = async () => {
        setPendienteAdquisicion(false);
        const p = selectedProduct;
        if (!p) return;
        setGuardando(true);
        setError("");
        setMensaje("");
        if (!p.idInventario) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: "El producto no tiene registro de inventario asociado" });
            setGuardando(false);
            return;
        }
        try {
            await registrarMovimiento({
                tipo: 'entrada',
                cantidad: Number(recEdit),
                id_inventario: p.idInventario,
                observacion: 'Recepción de mercadería',
            });
            setModalAlert({ open: true, tipo: "exito", titulo: "Adquisición registrada", mensaje: `Producto: ${p.name} · Cantidad: ${recEdit} unidad(es).` });
            setRefreshTick((t) => t + 1);
        } catch (err) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: err.message });
        } finally {
            setGuardando(false);
        }
    };

    const confirmarAdquisicion = () => {
        const p = selectedProduct;
        if (!p) return;
        if (!p.idInventario) { setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: "El producto no tiene registro de inventario asociado" }); return; }
        if (!recEdit || Number(recEdit) <= 0) { setModalAlert({ open: true, tipo: "aviso", titulo: "Aviso", mensaje: "Ingresa una cantidad válida." }); return; }
        setPendienteAdquisicion(true);
    };

    const guardarNuevoProducto = async (e) => {
        e.preventDefault();
        setGuardandoNuevo(true);
        setError("");
        setMensaje("");
        try {
            let idProvedor;
            if (String(nuevoProveedor) === "otros") {
                const nombreProv = nuevoProveedorOtro.trim();
                if (!nombreProv) throw new Error("Escribe el nombre del proveedor.");
                const existente = proveedores.find((p) => String(p.nombre || "").toLowerCase() === nombreProv.toLowerCase());
                if (existente) {
                    idProvedor = existente.id;
                } else {
                    const creado = await crearProveedor({ nombre: nombreProv });
                    idProvedor = (creado && creado.data && creado.data.id) || undefined;
                    if (creado && creado.data) setProveedores((prev) => [...prev, creado.data]);
                }
            } else {
                const proveedor = proveedores.find((p) => String(p.id) === String(nuevoProveedor));
                idProvedor = proveedor ? proveedor.id : undefined;
            }
            let idMarca;
            if (String(nuevoMarca) === "otros") {
                const nombreMarca = nuevoMarcaOtro.trim();
                if (!nombreMarca) throw new Error("Escribe el nombre de la marca.");
                const existente = marcas.find((m) => String(m.nombre || "").toLowerCase() === nombreMarca.toLowerCase());
                if (existente) {
                    idMarca = existente.id;
                } else {
                    const creada = await crearMarca({ nombre: nombreMarca });
                    idMarca = (creada && creada.data && creada.data.id) || undefined;
                    if (creada && creada.data) setMarcas((prev) => [...prev, creada.data]);
                }
            } else {
                const marca = marcas.find((m) => String(m.id) === String(nuevoMarca));
                idMarca = marca ? marca.id : undefined;
            }
            let idCategoria;
            if (String(nuevoCategoria) === "otros") {
                const nombreCat = nuevoCategoriaOtro.trim();
                if (!nombreCat) throw new Error("Escribe el nombre de la categoría.");
                const existente = categorias.find((c) => String(c.nombre || "").toLowerCase() === nombreCat.toLowerCase());
                if (existente) {
                    idCategoria = existente.id;
                } else {
                    const creada = await crearCategoria({ nombre: nombreCat });
                    idCategoria = (creada && creada.data && creada.data.id) || undefined;
                    if (creada && creada.data) setCategorias((prev) => [...prev, creada.data]);
                }
            } else {
                const categoria = categorias.find((c) => String(c.id) === String(nuevoCategoria));
                idCategoria = categoria ? categoria.id : undefined;
            }
            const estado = estados.find((e) => String(e.nombre || "").toLowerCase() === String(nuevoEstado || "").toLowerCase());
            const codigoTrim = nuevoCodigo.trim();
            const existentes = await listarProductos(100, codigoTrim, 1);
            const duplicado = (existentes.data || []).find((p) =>
                p.codigo === codigoTrim
                && Number(p.id_marca) === Number(idMarca)
                && (p.proveedores || []).some((pr) => Number(pr.id) === Number(idProvedor))
            );
            if (duplicado && duplicado.id_inventario) {
                await registrarMovimiento({
                    tipo: 'entrada',
                    cantidad: Number(nuevoCantidad) || 1,
                    id_inventario: duplicado.id_inventario,
                    observacion: `Stock adicional - producto "${duplicado.nombre}" (código ${codigoTrim})`,
                });
                if (fotoFile) {
                    try { await subirImagenProducto(duplicado.id, fotoFile); } catch { /* silencioso */ }
                }
                setMensaje(`Producto ya existente (mismo código, marca y proveedor). Se agregó ${nuevoCantidad || 1} unidad(es) al stock existente.`);
            } else {
                const res = await registrarProducto({
                    nombre: nuevoNombre.trim(),
                    codigo: codigoTrim,
                    precio_compra: Number(nuevoCosto) || 0,
                    precio_venta: Number(nuevoVenta) || 0,
                    id_marca: idMarca,
                    id_categoria: idCategoria,
                    id_estado_producto: estado ? estado.id : undefined,
                    id_proveedores: idProvedor ? [idProvedor] : [],
                    stock_actual: Number(nuevoCantidad) || 0,
                    stock_minimo: 0,
                    ubicacion: nuevaUbicacion.trim() || undefined,
                });
                if (fotoFile && res.data?.id) {
                    try { await subirImagenProducto(res.data.id, fotoFile); } catch { /* silencioso */ }
                }
                setMensaje("Producto registrado correctamente");
            }
            setFormAbierto(false);
            setFotoFile(null); setFotoPreview("");
            setNuevoNombre(""); setNuevoCodigo(""); setNuevoProveedor(""); setNuevoProveedorOtro("");
            setNuevoMarca(""); setNuevoMarcaOtro("");
            setNuevoCategoria(""); setNuevoCategoriaOtro("");
            setNuevoEstado("Nuevo"); setNuevaUbicacion(""); setNuevoCosto(""); setNuevoVenta(""); setNuevoCantidad("");
            cambiarPagina(1);
            setRefreshTick((t) => t + 1);
        } catch (err) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: err.message });
        } finally {
            setGuardandoNuevo(false);
        }
    };

    return (
        <section className="p-5">
            <div className="row g-5">
                <div className="col-12 col-xl-6 d-flex flex-column gap-4">
                    <div className="d-flex flex-wrap gap-2">
                        <button onClick={() => setFormAbierto((v) => !v)} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Nuevo Producto</button>
                    </div>

                    {formAbierto && (
                        <FormNuevoProducto
                            proveedores={proveedores} marcas={marcas} categorias={categorias}
                            nombre={nuevoNombre} setNombre={setNuevoNombre}
                            codigo={nuevoCodigo} setCodigo={setNuevoCodigo}
                            proveedor={nuevoProveedor} setProveedor={setNuevoProveedor}
                            proveedorOtro={nuevoProveedorOtro} setProveedorOtro={setNuevoProveedorOtro}
                            marca={nuevoMarca} setMarca={setNuevoMarca}
                            marcaOtro={nuevoMarcaOtro} setMarcaOtro={setNuevoMarcaOtro}
                            categoria={nuevoCategoria} setCategoria={setNuevoCategoria}
                            categoriaOtro={nuevoCategoriaOtro} setCategoriaOtro={setNuevoCategoriaOtro}
                            estado={nuevoEstado} setEstado={setNuevoEstado}
                            ubicacion={nuevaUbicacion} setUbicacion={setNuevaUbicacion}
                            costo={nuevoCosto} setCosto={setNuevoCosto}
                            venta={nuevoVenta} setVenta={setNuevoVenta}
                            cantidad={nuevoCantidad} setCantidad={setNuevoCantidad}
                            guardando={guardandoNuevo} onSubmit={guardarNuevoProducto}
                            onCancelar={() => setFormAbierto(false)}
                            fotoFileRef={fotoFileRef} fotoPreview={fotoPreview}
                            onFotoClick={(f) => { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)); }}
                            error={error} mensaje={mensaje}
                        />
                    )}

                    <TablaProductos
                        visibleRows={visibleRows} selectedId={selectedId} onSelect={handleSelect}
                        busqueda={busqueda} onBuscar={onBuscar}
                        filtroAbierto={filtroAbierto} setFiltroAbierto={setFiltroAbierto}
                        sortAbierto={sortAbierto} setSortAbierto={setSortAbierto}
                        columnaOrden={columnaOrden} setColumnaOrden={setColumnaOrden}
                        direccion={direccion} setDireccion={setDireccion}
                        pagina={pagina} totalPaginas={totalPaginas} total={total} cambiarPagina={cambiarPagina}
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <DetalleProducto
                        product={selectedProduct}
                        precioEdit={precioEdit} setPrecioEdit={setPrecioEdit}
                        costoEdit={costoEdit} setCostoEdit={setCostoEdit}
                        recEdit={recEdit} setRecEdit={setRecEdit}
                        guardando={guardando} esAdmin={tienePrivilegio}
                        onGuardarPrecio={guardarPrecio} onGuardarCosto={guardarCosto} onFinalizar={confirmarAdquisicion}
                        error={error} mensaje={mensaje}
                    />
                </div>
            </div>

            {modalAlert.open && <ModalAlert tipo={modalAlert.tipo} titulo={modalAlert.titulo} mensaje={modalAlert.mensaje} onClose={() => setModalAlert({ ...modalAlert, open: false })} />}
            {pendienteAdquisicion && (
                <ModalAlert tipo="confirmar" titulo="¿Finalizar adquisición?" mensaje={`Producto: ${selectedProduct?.name || "—"} · Cantidad: ${recEdit} · Stock después: ${(selectedProduct?.qty || 0) + Number(recEdit)}`}
                    onConfirm={finalizarAdquisicion} onClose={() => setPendienteAdquisicion(false)} textoConfirmar="Confirmar" />
            )}
        </section>
    );
}

export default Recepcion;
