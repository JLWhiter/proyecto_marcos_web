import { useRef, useState } from "react";
import Enviar from "../../assets/icons/enviar.jsx";
import { listarProductos } from "../../api/productos";
import { reportarDano, subirEvidencia } from "../../api/reportes";
import { Campo, Panel } from "./components/ui.jsx";
import ModalAlert from "../../components/ModalAlert";

function ReporteDaño() {
    const fileRef = useRef(null);

    const [codigo, setCodigo] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [seleccionado, setSeleccionado] = useState(null);
    const [preview, setPreview] = useState("");
    const [evidenciaUrl, setEvidenciaUrl] = useState("");

    const [guardando, setGuardando] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [modalAlert, setModalAlert] = useState({ open: false, tipo: "error", titulo: "", mensaje: "" });
    const [pendienteConfirmar, setPendienteConfirmar] = useState(false);

    const buscar = async () => {
        setError(""); setMensaje(""); setSeleccionado(null);
        const c = codigo.trim();
        if (!c) { setModalAlert({ open: true, tipo: "aviso", titulo: "Aviso", mensaje: "Ingrese un código." }); return; }
        try {
            const res = await listarProductos(10, c);
            const items = res.data || [];
            const cl = c.toLowerCase();
            const match = items.find((i) => String(i.codigo || "").toLowerCase() === cl)
                || items.find((i) => String(i.codigo || "").toLowerCase().includes(cl))
                || null;
            if (!match) { setModalAlert({ open: true, tipo: "aviso", titulo: "Sin resultados", mensaje: "No se encontró un producto con ese código." }); return; }
            setSeleccionado({
                id: match.id_inventario,
                producto_codigo: match.codigo,
                producto_nombre: match.nombre,
                stock_actual: match.stock_actual || 0,
            });
        } catch {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: "Error al buscar producto." });
        }
    };

    const limpiar = () => {
        setCodigo(""); setCantidad(""); setDescripcion("");
        setSeleccionado(null); setPreview(""); setEvidenciaUrl("");
        setError(""); setMensaje("");
    };

    const subir = (file) => {
        if (!file) return;
        if (!/\.(jpe?g|png)$/i.test(file.name)) { setModalAlert({ open: true, tipo: "aviso", titulo: "Formato no válido", mensaje: "Formato no permitido. Use JPG o PNG." }); return; }
        if (file.size > 5 * 1024 * 1024) { setModalAlert({ open: true, tipo: "aviso", titulo: "Archivo muy grande", mensaje: "El archivo supera los 5MB." }); return; }
        setError(""); setSubiendo(true);
        setPreview(URL.createObjectURL(file));
        subirEvidencia(file)
            .then((r) => { setEvidenciaUrl(r.url || ""); })
            .catch((e) => { setPreview(""); setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: e.message }); })
            .finally(() => setSubiendo(false));
    };

    const enviarReporte = async () => {
        setPendienteConfirmar(false);
        setError(""); setMensaje(""); setGuardando(true);
        try {
            if (!seleccionado) throw new Error("Busca y selecciona un producto por código.");
            const qty = Number(cantidad);
            if (!Number.isInteger(qty) || qty <= 0) throw new Error("La cantidad debe ser un entero mayor a 0.");
            if (qty > seleccionado.stock_actual) throw new Error(`Stock insuficiente. Disponible: ${seleccionado.stock_actual}.`);
            const r = await reportarDano({
                id_inventario: seleccionado.id, cantidad: qty, descripcion,
                evidencia_url: evidenciaUrl || undefined,
            });
            setModalAlert({ open: true, tipo: "exito", titulo: "Reporte enviado", mensaje: `Producto: ${r.data?.producto_codigo || seleccionado.producto_codigo} · ${qty} unidad(es).` });
            limpiar();
        } catch (e) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: e.message });
        } finally {
            setGuardando(false);
        }
    };

    const validarYConfirmar = () => {
        if (!seleccionado) { setModalAlert({ open: true, tipo: "aviso", titulo: "Aviso", mensaje: "Busca y selecciona un producto por código." }); return; }
        const qty = Number(cantidad);
        if (!Number.isInteger(qty) || qty <= 0) { setModalAlert({ open: true, tipo: "aviso", titulo: "Aviso", mensaje: "La cantidad debe ser un entero mayor a 0." }); return; }
        if (qty > seleccionado.stock_actual) { setModalAlert({ open: true, tipo: "aviso", titulo: "Stock insuficiente", mensaje: `Disponible: ${seleccionado.stock_actual}. Solicitas: ${qty}.` }); return; }
        setPendienteConfirmar(true);
    };

    return (
        <section className="bg-surface min-vh-100 p-5">
            <div className="row g-4">
                <div className="col-12 col-xl-6">
                    <Panel titulo="REPORTAR PRODUCTO FALLADO" badge={<span className="badge-soft bg-danger text-white">URGENTE</span>}>
                        <div className="row g-3">
                            <div className="col-12 col-sm-6">
                                <Campo etiqueta="BÚSQUEDA POR CÓDIGO">
                                    <div className="d-flex align-items-center border border-line bg-white rounded-2">
                                        <input value={codigo} onChange={(e) => { setCodigo(e.target.value); setSeleccionado(null); }}
                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscar())}
                                            placeholder="Ingrese el código" className="form-input border-0 flex-grow-1" />
                                        <button type="button" onClick={buscar} aria-label="Buscar producto" className="btn btn-link p-1 me-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#595F63" strokeWidth="2"/><path d="M21 21L16.5 16.5" stroke="#595F63" strokeWidth="2" strokeLinecap="round"/></svg>
                                        </button>
                                    </div>
                                    {seleccionado && <p className="small text-ink fw-semibold mb-0 mt-1">{seleccionado.producto_nombre} · Disponible: {seleccionado.stock_actual}</p>}
                                </Campo>
                            </div>
                            <div className="col-12 col-sm-6">
                                <Campo etiqueta="CANTIDAD AFECTADA">
                                    <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="1" className="form-input" />
                                </Campo>
                            </div>
                        </div>
                        <Campo etiqueta="DESCRIPCIÓN DEL FALLO">
                            <textarea rows="3" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle del daño o defecto..." className="form-input"></textarea>
                        </Campo>
                        <div className="d-flex align-items-center justify-content-between">
                            <button type="button" onClick={limpiar} className="btn btn-link p-0 text-muted small fw-bold text-uppercase tracking-wide">LIMPIAR</button>
                            <button type="button" onClick={validarYConfirmar} disabled={guardando} className="btn btn-accent btn-sm rounded-2 fw-bold d-flex align-items-center gap-1">
                                <Enviar /> {guardando ? "ENVIANDO..." : "ENVIAR REPORTE"}
                            </button>
                        </div>
                        {error && <p className="small text-danger fw-semibold mb-0">{error}</p>}
                        {mensaje && <p className="small text-success fw-semibold mb-0">{mensaje}</p>}
                    </Panel>
                </div>

                <div className="col-12 col-xl-6">
                    <Panel titulo="EVIDENCIA FOTOGRÁFICA">
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="d-none"
                            onChange={(e) => { subir(e.target.files[0]); e.target.value = ""; }} />
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={subiendo}
                            className="border border-dashed bg-brand-soft rounded-3 py-5 w-100 d-flex flex-column align-items-center gap-2"
                            style={{ borderColor: "var(--line)" }}>
                            {preview
                                ? <img src={preview} alt="Evidencia" className="rounded-3" style={{ maxHeight: "110px" }} />
                                : <>
                                    <svg width="40" height="32" viewBox="0 0 24 24" fill="#595F63"><path d="M17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12M19.36,4H16.78L15.36,2.36C15.04,2.03 14.56,1.89 14.1,2H9.9C9.44,2 8.96,2.03 8.64,2.36L7.22,4H4.64C3.19,4 2,5.19 2,6.64V17.36C2,18.81 3.19,20 4.64,20H19.36C20.81,20 22,18.81 22,17.36V6.64C22,5.19 20.81,4 19.36,4M19,16.25C19,16.94 18.44,17.5 17.75,17.5H6.25C5.56,17.5 5,16.94 5,16.25V7.75C5,7.06 5.56,6.5 6.25,6.5H17.75C18.44,6.5 19,7.06 19,7.75V16.25Z"/></svg>
                                    <span className="text-ink fw-bold small">{subiendo ? "SUBINDO..." : "SUBIR IMAGEN DEL DAÑO"}</span>
                                    <span className="text-muted small">JPG, PNG, MÁX 5MB</span>
                                </>}
                        </button>
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-brand-soft rounded-2 border border-line flex-shrink-0" style={{ width: "4rem", height: "3rem" }}></div>
                            <div>
                                <p className="text-ink fw-bold mb-0" style={{ fontSize: "0.65rem" }}>EJEMPLO DE CAPTURA</p>
                                <p className="text-muted small mb-0">Asegúrate de que el daño sea visible.</p>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>

            {modalAlert.open && <ModalAlert tipo={modalAlert.tipo} titulo={modalAlert.titulo} mensaje={modalAlert.mensaje} onClose={() => setModalAlert({ ...modalAlert, open: false })} />}
            {pendienteConfirmar && (
                <ModalAlert tipo="confirmar" titulo="¿Enviar reporte?" mensaje={`Producto: ${seleccionado?.producto_codigo} · Cantidad: ${cantidad} · Stock restante: ${(seleccionado?.stock_actual || 0) - Number(cantidad)}`}
                    onConfirm={enviarReporte} onClose={() => setPendienteConfirmar(false)} textoConfirmar="Enviar" />
            )}
        </section>
    );
}

export default ReporteDaño;