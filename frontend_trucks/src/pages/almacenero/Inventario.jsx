import { useRef, useEffect, useState } from "react";
import ReporteDano from "../../assets/icons/reporteDano";
import StockT from "../../assets/icons/stockT";
import Enviar from "../../assets/icons/enviar";
import ModalAlert from "../../components/ModalAlert";
import { valorInventario, productosBajoStock } from "../../api/reportes";
import { registrarProducto, subirImagenProducto } from "../../api/productos";
import { listarProveedores, crearProveedor } from "../../api/proveedores";
import { listarCategorias, listarEstadosProducto, listarMarcas, crearMarca, crearCategoria } from "../../api/catalogos";
import { Campo, Panel } from "./components/ui.jsx";

const ESTADOS_BD = { "Nuevo": "Nuevo", "Semi Nuevo": "Seminuevo", "dañado": "Dañado" };
const OPCION_OTROS = "__otros__";

const VACIO = {
    codigo: "", nombre: "", cantidad: "1", categoria: "", marca: "", proveedor: "",
    ubicacion: "A2b", estado: "Nuevo", descripcion: "", marcaOtros: "", proveedorOtros: "", categoriaOtros: "",
};

function Inventario() {
    const fileRef = useRef(null);
    const [totalArticulos, setTotalArticulos] = useState(0);
    const [bajoStock, setBajoStock] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [estados, setEstados] = useState([]);
    const [form, setForm] = useState(VACIO);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [modalAlert, setModalAlert] = useState({ open: false, tipo: "error", titulo: "", mensaje: "" });
    const [pendienteConfirmar, setPendienteConfirmar] = useState(false);
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState("");

    const cargarIndicadores = () => {
        valorInventario().then((res) => { if (res.data) setTotalArticulos(res.data.total_productos || 0); }).catch(() => {});
        productosBajoStock().then((res) => { if (Array.isArray(res.data)) setBajoStock(res.data); }).catch(() => {});
    };

    useEffect(() => {
        cargarIndicadores();
        listarProveedores().then((res) => setProveedores(res.data || [])).catch(() => {});
        listarMarcas().then((res) => setMarcas(res.data || [])).catch(() => {});
        listarCategorias().then((res) => setCategorias(res.data || [])).catch(() => {});
        listarEstadosProducto().then((res) => setEstados(res.data || [])).catch(() => {});
    }, []);

    const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
    const limpiar = () => { setForm(VACIO); setError(""); setMensaje(""); setFotoFile(null); setFotoPreview(""); };

    const resolverId = (lista, nombre) => {
        const n = (nombre || "").trim().toLowerCase();
        const item = lista.find((x) => String(x.nombre || "").toLowerCase() === n);
        return item ? item.id : undefined;
    };

    const resolverMarca = async () => {
        if (form.marca === OPCION_OTROS) {
            const nombre = form.marcaOtros.trim();
            if (!nombre) throw new Error("Escriba el nombre de la nueva marca");
            const res = await crearMarca({ nombre });
            setMarcas((m) => [...m, res.data]);
            return res.data.id;
        }
        return resolverId(marcas, form.marca);
    };

    const resolverProveedor = async () => {
        if (form.proveedor === OPCION_OTROS) {
            const nombre = form.proveedorOtros.trim();
            if (!nombre) throw new Error("Escriba el nombre del nuevo proveedor");
            const res = await crearProveedor({ nombre });
            setProveedores((p) => [...p, res.data]);
            return res.data.id;
        }
        return resolverId(proveedores, form.proveedor);
    };

    const resolverCategoria = async () => {
        if (form.categoria === OPCION_OTROS) {
            const nombre = form.categoriaOtros.trim();
            if (!nombre) throw new Error("Escriba el nombre de la nueva categoría");
            const res = await crearCategoria({ nombre });
            setCategorias((c) => [...c, res.data]);
            return res.data.id;
        }
        return resolverId(categorias, form.categoria);
    };

    const registrar = async (e) => {
        if (e) e.preventDefault();
        setPendienteConfirmar(false);
        setGuardando(true); setError(""); setMensaje("");
        try {
            const idMarca = await resolverMarca();
            const idProveedor = await resolverProveedor();
            const idCategoria = await resolverCategoria();
            const codigo = form.codigo.trim() || `TRK${Date.now().toString().slice(-7)}`;
            const res = await registrarProducto({
                nombre: form.nombre.trim(),
                codigo,
                precio_compra: 0, precio_venta: 0,
                id_categoria: idCategoria, id_marca: idMarca,
                id_proveedores: idProveedor ? [idProveedor] : [],
                stock_actual: Number(form.cantidad) || 0, stock_minimo: 0,
                ubicacion: form.ubicacion.trim() || undefined,
                id_estado_producto: resolverId(estados, ESTADOS_BD[form.estado]),
            });
            if (fotoFile && res.data?.id) {
                await subirImagenProducto(res.data.id, fotoFile);
            }
            const stock = Number(form.cantidad) || 0;
            setModalAlert({ open: true, tipo: "exito", titulo: "Producto registrado", mensaje: stock > 0 ? `"${form.nombre}" registrado con ${stock} unidad(es) como entrada de inventario.` : `"${form.nombre}" registrado correctamente.` });
            setForm(VACIO);
            setFotoFile(null); setFotoPreview("");
            cargarIndicadores();
        } catch (err) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: err.message });
        } finally {
            setGuardando(false);
        }
    };

    const confirmarRegistro = (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) { setModalAlert({ open: true, tipo: "aviso", titulo: "Aviso", mensaje: "El nombre del producto es obligatorio." }); return; }
        setPendienteConfirmar(true);
    };

    return (
        <section className="bg-surface min-vh-100 p-5">
            <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center gap-3 bg-white border border-line rounded-3 p-4 shadow-sm h-100">
                        <div className="d-flex rounded-3 bg-warning-subtle align-items-center justify-content-center flex-shrink-0" style={{ width: "2.5rem", height: "2.5rem" }}>
                            <ReporteDano />
                        </div>
                        <div className="d-flex flex-column">
                            <span className="small fw-bold text-ink">Alerta de Stock Bajo</span>
                            {bajoStock.length > 0 && (
                                <span className="badge-soft bg-danger-subtle text-danger border border-danger mt-1 w-fit">
                                    {bajoStock.filter(p => p.stock_actual < 2).length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center gap-3 bg-white border border-line rounded-3 p-4 shadow-sm h-100">
                        <div className="d-flex rounded-3 bg-brand-soft align-items-center justify-content-center flex-shrink-0" style={{ width: "2.5rem", height: "2.5rem" }}>
                            <StockT />
                        </div>
                        <div className="d-flex flex-column">
                            <span className="small fw-bold text-ink">Artículos Totales</span>
                            <span className="fs-2 fw-bolder text-ink">{totalArticulos}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Panel titulo="INSERTAR PRODUCTOS">
                <form className="d-flex flex-column gap-3" onSubmit={confirmarRegistro}>
                    <div className="row g-3">
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="CÓDIGO DEL PRODUCTO">
                                <input value={form.codigo} onChange={(e) => setCampo("codigo", e.target.value)} placeholder="Código Ejemplo" className="form-input" />
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="NOMBRE PRODUCTO">
                                <input value={form.nombre} onChange={(e) => setCampo("nombre", e.target.value)} placeholder="Nombre Ejemplo" className="form-input" />
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="CANTIDAD PRODUCTO">
                                <input value={form.cantidad} onChange={(e) => setCampo("cantidad", e.target.value)} className="form-input" />
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="CATEGORÍA">
                                <select value={form.categoria} onChange={(e) => setCampo("categoria", e.target.value)} className="form-input">
                                    <option value="">-- Seleccione --</option>
                                    {categorias.map((c) => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}
                                    <option value={OPCION_OTROS}>Otros...</option>
                                </select>
                                {form.categoria === OPCION_OTROS && (<div className="mt-1"><input value={form.categoriaOtros} onChange={(e) => setCampo("categoriaOtros", e.target.value)} placeholder="Nueva categoría" className="form-input" /></div>)}
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="MARCA">
                                <select value={form.marca} onChange={(e) => setCampo("marca", e.target.value)} className="form-input">
                                    <option value="">-- Seleccione --</option>
                                    {marcas.map((m) => (<option key={m.id} value={m.nombre}>{m.nombre}</option>))}
                                    <option value={OPCION_OTROS}>Otros...</option>
                                </select>
                                {form.marca === OPCION_OTROS && (<div className="mt-1"><input value={form.marcaOtros} onChange={(e) => setCampo("marcaOtros", e.target.value)} placeholder="Nueva marca" className="form-input" /></div>)}
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="PROVEEDOR">
                                <select value={form.proveedor} onChange={(e) => setCampo("proveedor", e.target.value)} className="form-input">
                                    <option value="">-- Seleccione --</option>
                                    {proveedores.map((p) => (<option key={p.id} value={p.nombre}>{p.nombre}</option>))}
                                    <option value={OPCION_OTROS}>Otros...</option>
                                </select>
                                {form.proveedor === OPCION_OTROS && (<div className="mt-1"><input value={form.proveedorOtros} onChange={(e) => setCampo("proveedorOtros", e.target.value)} placeholder="Nuevo proveedor" className="form-input" /></div>)}
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="UBICACIÓN">
                                <input value={form.ubicacion} onChange={(e) => setCampo("ubicacion", e.target.value)} className="form-input" />
                            </Campo>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                            <Campo etiqueta="ESTADO">
                                <select value={form.estado} onChange={(e) => setCampo("estado", e.target.value)} className="form-input">
                                    <option value="Nuevo">Nuevo</option>
                                    <option value="Semi Nuevo">Semi Nuevo</option>
                                    <option value="Dañado">Dañado</option>
                                </select>
                            </Campo>
                        </div>
                    </div>

                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-lg-9">
                            <Campo etiqueta="DESCRIPCIÓN DEL PRODUCTO">
                                <textarea rows="2" value={form.descripcion} onChange={(e) => setCampo("descripcion", e.target.value)} placeholder="Detalle del producto..." className="form-input"></textarea>
                            </Campo>
                        </div>
                        <div className="col-12 col-lg-3">
                            <Campo etiqueta="FOTO DEL PRODUCTO">
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="d-none"
                                    onChange={(e) => {
                                        const f = e.target.files[0];
                                        if (f) { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)); }
                                        e.target.value = "";
                                    }} />
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="border border-dashed border-line bg-brand-soft d-flex flex-column align-items-center gap-1 rounded-3 py-3 w-100"
                                    style={{ borderColor: "var(--brand)", backgroundColor: "rgba(15, 27, 76, 0.06)" }}>
                                    {fotoPreview
                                        ? <img src={fotoPreview} alt="Preview" className="rounded object-cover" style={{ height: "4rem" }} />
                                        : <>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#595F63"><path d="M17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12M19.36,4H16.78L15.36,2.36C15.04,2.03 14.56,1.89 14.1,2H9.9C9.44,2 8.96,2.03 8.64,2.36L7.22,4H4.64C3.19,4 2,5.19 2,6.64V17.36C2,18.81 3.19,20 4.64,20H19.36C20.81,20 22,18.81 22,17.36V6.64C22,5.19 20.81,4 19.36,4M19,16.25C19,16.94 18.44,17.5 17.75,17.5H6.25C5.56,17.5 5,16.94 5,16.25V7.75C5,7.06 5.56,6.5 6.25,6.5H17.75C18.44,6.5 19,7.06 19,7.75V16.25Z"/></svg>
                                            <span className="text-muted fw-bold" style={{ fontSize: "0.6rem" }}>SUBIR FOTO</span>
                                        </>}
                                </button>
                            </Campo>
                        </div>
                        <div className="col-12 d-flex align-items-center gap-3">
                            <button type="button" onClick={limpiar} className="btn btn-link p-0 text-muted small fw-bold text-uppercase tracking-wide">LIMPIAR</button>
                            <button type="submit" disabled={guardando} className="btn btn-accent btn-sm rounded-2 fw-bold d-flex align-items-center gap-2">
                                {guardando ? "REGISTRANDO..." : "REGISTRAR PRODUCTO"}{!guardando && <Enviar />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="small text-danger fw-semibold mb-0">{error}</p>}
                    {mensaje && <p className="small text-success fw-semibold mb-0">{mensaje}</p>}
                </form>
            </Panel>

            {modalAlert.open && <ModalAlert tipo={modalAlert.tipo} titulo={modalAlert.titulo} mensaje={modalAlert.mensaje} onClose={() => setModalAlert({ ...modalAlert, open: false })} />}
            {pendienteConfirmar && (
                <ModalAlert tipo="confirmar" titulo="¿Registrar producto?" mensaje={`Nombre: ${form.nombre || "—"} · Código: ${form.codigo || "autogenerado"} · Cantidad: ${form.cantidad || 0}${Number(form.cantidad) > 0 ? " — Se registrará como ENTRADA de inventario" : ""}`}
                    onConfirm={registrar} onClose={() => setPendienteConfirmar(false)} textoConfirmar="Registrar" />
            )}
        </section>
    );
}

export default Inventario;