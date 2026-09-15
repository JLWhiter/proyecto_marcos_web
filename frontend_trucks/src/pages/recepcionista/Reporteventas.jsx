import { useEffect, useState, useRef } from "react";
import IconEtiquetaprecio from "../../assets/icons/iconEtiquetaprecio";
import IconCliente from "../../assets/icons/iconCliente";
import IconCodigo from "../../assets/icons/iconCodigo";
import IconProducto from "../../assets/icons/iconProducto";
import IconCantidad from "../../assets/icons/iconCantidad";
import IconMarca from "../../assets/icons/iconMarca";
import IconMoneda from "../../assets/icons/iconMoneda";
import IconTasa from "../../assets/icons/iconTasa";
import IconMedioPago from "../../assets/icons/iconMedioPago";
import IconDestino from "../../assets/icons/iconDestino";
import IconAgencia from "../../assets/icons/iconAgencia";
import IconPuntoRecogo from "../../assets/icons/iconPuntoRecogo";
import IconAdicionales from "../../assets/icons/iconAdicionales";
import IconTipoDocumento from "../../assets/icons/iconTipoDocumento";
import IconObservaciones from "../../assets/icons/iconObservaciones";
import { listarTiposDocumento } from "../../api/catalogos";
import { registrarVenta } from "../../api/ventas";
import { listarProductos } from "../../api/productos";
import ModalAlert from "../../components/ModalAlert";
import { useTasaCambio } from "../../context/TasaCambioContext";

const INPUT = "bg-transparent w-100 px-3 text-ink form-control-plaintext border-0";

const ITEM_VACIO = {
    id_producto: null, codigo_producto: "", nombre_producto: "", proveedor: "", marca: "",
    cantidad: 1, precio_unitario: 0,
};

const FORM_BASE = {
    nombre_cliente: "", ruc_dni: "", moneda: "$", tasa_cambio: 1, medio_pago: "",
    plazos: 1, fecha_pago: "", numero_documento: "",
    destino: "", agencia_devolucion: "", punto_recogo: "", adicionales: "",
    id_tipo_documento: "", observaciones: "", costo_envio: 0, para_taller: false,
    adelanto: 0,
};

const cajaConIcono = "bg-brand-soft rounded-3 border border-line d-flex align-items-center w-100";

function Campo({ icono: Icono, etiqueta, children }) {
    return (
        <label className="d-block">
            <span className="d-block small text-ink mb-2 fw-bold">{etiqueta}</span>
            <div className={cajaConIcono} style={{ height: "2.75rem" }}>
                <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "2.5rem", color: "var(--brand)" }}>
                    <Icono />
                </span>
                {children}
            </div>
        </label>
    );
}

function CampoItem({ icono: Icono, etiqueta, children }) {
    return (
        <label className="d-block">
            <span className="d-block form-label-sm mb-1">{etiqueta}</span>
            <div className="d-flex align-items-center bg-white rounded-2 border border-line overflow-hidden" style={{ height: "2.25rem" }}>
                <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "2rem", color: "var(--brand)" }}>
                    <Icono />
                </span>
                {children}
            </div>
        </label>
    );
}

function Reporteventas() {
    const { tasa: tasaGlobal } = useTasaCambio();
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [modalAlert, setModalAlert] = useState({ open: false, tipo: "error", titulo: "", mensaje: "" });
    const [form, setForm] = useState({ ...FORM_BASE });
    const [items, setItems] = useState([{ ...ITEM_VACIO }]);
    const [sugerenciasIdx, setSugerenciasIdx] = useState(null);
    const [sugerencias, setSugerencias] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        listarTiposDocumento()
            .then((res) => setTiposDocumento(res.data || []))
            .catch(() => {});
    }, []);

    const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

    const setItem = (idx, campo, valor) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
    };

    const agregarItem = () => setItems((prev) => [...prev, { ...ITEM_VACIO }]);

    const eliminarItem = (idx) => {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const buscarProducto = (codigo, idx) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!codigo || codigo.length < 2) {
            setSugerencias([]);
            setMostrarSugerencias(false);
            setSugerenciasIdx(null);
            return;
        }
        debounceRef.current = setTimeout(() => {
            listarProductos(10, codigo)
                .then((res) => {
                    const result = res.data?.items || res.data || [];
                    setSugerencias(result);
                    setSugerenciasIdx(idx);
                    setMostrarSugerencias(result.length > 0);
                })
                .catch(() => { setSugerencias([]); setMostrarSugerencias(false); setSugerenciasIdx(null); });
        }, 300);
    };

    const seleccionarProducto = (p, idx) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? {
            ...it,
            id_producto: p.id,
            codigo_producto: p.codigo || "",
            nombre_producto: p.nombre || "",
            marca: p.marca_nombre || "",
            proveedor: p.proveedor_nombre || "",
            precio_unitario: p.precio_venta || it.precio_unitario,
        } : it)));
        setSugerencias([]);
        setMostrarSugerencias(false);
        setSugerenciasIdx(null);
    };

    const tasaCambio = Number(form.tasa_cambio) || 1;
    const totalBruto = items.reduce((acc, it) => {
        const cant = Number(it.cantidad) || 0;
        const prec = Number(it.precio_unitario) || 0;
        return acc + cant * prec * tasaCambio;
    }, 0);
    const adelanto = form.para_taller ? 0 : Math.min(Number(form.adelanto) || 0, totalBruto);
    const totalVenta = totalBruto - adelanto;
    const esCredito = form.medio_pago === "Credito";
    const numPlazos = Math.max(1, Number(form.plazos) || 1);
    const montoCuota = numPlazos > 0 ? (totalVenta / numPlazos) : totalVenta;

    const limpiar = () => {
        setForm({ ...FORM_BASE });
        setItems([{ ...ITEM_VACIO }]);
    };

    const finalizarVenta = async (e) => {
        e.preventDefault();
        if (!form.nombre_cliente.trim()) { setModalAlert({ open: true, tipo: "error", titulo: "Validación", mensaje: "El nombre del cliente es obligatorio" }); return; }
        if (!form.medio_pago) { setModalAlert({ open: true, tipo: "error", titulo: "Validación", mensaje: "Selecciona un medio de pago" }); return; }

        const validos = items.filter((it) => it.id_producto);
        if (validos.length === 0) { setModalAlert({ open: true, tipo: "error", titulo: "Validación", mensaje: "Agrega al menos un producto válido" }); return; }

        for (let i = 0; i < validos.length; i++) {
            const it = validos[i];
            if (Number(it.cantidad) < 1) { setModalAlert({ open: true, tipo: "error", titulo: "Validación", mensaje: `La cantidad del item ${i + 1} debe ser al menos 1` }); return; }
            if (!form.para_taller && Number(it.precio_unitario) <= 0) { setModalAlert({ open: true, tipo: "error", titulo: "Validación", mensaje: `El precio del item ${i + 1} debe ser mayor a 0` }); return; }
        }

        const confirmar = window.confirm(`¿Estás seguro de registrar esta venta?\n\nProductos: ${validos.length}\nTotal: ${form.moneda}${totalVenta.toFixed(2)}${adelanto > 0 ? `\nAdelanto: ${form.moneda}${adelanto.toFixed(2)}` : ""}`);
        if (!confirmar) return;

        setGuardando(true);
        try {
            let registradas = 0;
            for (const it of validos) {
                const precioBrutoItem = form.para_taller ? 0 : Number(it.cantidad) * Number(it.precio_unitario) * tasaCambio;
                const precioFinalItem = form.para_taller ? 0 : precioBrutoItem - (registradas === 0 ? adelanto : 0);
                await registrarVenta({
                    ...form,
                    id_producto: it.id_producto,
                    codigo_producto: it.codigo_producto,
                    nombre_producto: it.nombre_producto,
                    marca: it.marca,
                    cantidad: Number(it.cantidad),
                    tasa_cambio: tasaCambio,
                    precio_unitario: form.para_taller ? 0 : Number(it.precio_unitario),
                    precio_final: precioFinalItem,
                    plazos: esCredito ? numPlazos : 0,
                    fecha_pago: esCredito && form.fecha_pago ? form.fecha_pago : undefined,
                    id_tipo_documento: form.id_tipo_documento ? Number(form.id_tipo_documento) : undefined,
                    observaciones: [form.observaciones, adelanto > 0 ? `Adelanto: ${form.moneda}${adelanto.toFixed(2)}` : ""].filter(Boolean).join(" | "),
                });
                registradas++;
            }
            setModalAlert({ open: true, tipo: "exito", titulo: "Éxito", mensaje: `Venta registrada correctamente (${registradas} producto${registradas > 1 ? 's' : ''})` });
            limpiar();
        } catch (err) {
            setModalAlert({ open: true, tipo: "error", titulo: "Error", mensaje: err.message });
        } finally {
            setGuardando(false);
        }
    };

    const inputItem = "bg-transparent w-100 small text-ink border-0 px-2";

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <div className="rounded-3 bg-brand-soft border border-line p-4 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-2 bg-brand text-white" style={{ width: "2.75rem", height: "2.75rem" }}>
                            <IconEtiquetaprecio />
                        </div>
                        <div>
                            <h2 className="fw-bolder text-ink mb-0">Reporte Venta</h2>
                            <p className="small text-muted mb-0">Revise los detalles del artículo y finalice el precio.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={finalizarVenta}>
                    <div className="row g-4 mt-3">
                        <div className="col-12 col-md-6 col-xl-4 col-xxl-3">
                            <Campo icono={IconCliente} etiqueta="Nombre del Cliente">
                                <input className={INPUT} value={form.nombre_cliente} onChange={(e) => setCampo("nombre_cliente", e.target.value)} placeholder="Ej. Juan Pérez" />
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconMoneda} etiqueta="Moneda">
                                <select className={`${INPUT} form-select-plaintext`} value={form.moneda} onChange={(e) => { setCampo("moneda", e.target.value); setCampo("tasa_cambio", e.target.value === "S/" ? (Number(tasaGlobal) || 3.4) : 1); }}>
                                    <option value="$">$ (Dólares)</option>
                                    <option value="S/">S/ (Soles)</option>
                                </select>
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconTasa} etiqueta="Tasa de Cambio">
                                <input type="number" step="0.0001" min="0" className={INPUT} value={form.tasa_cambio} onChange={(e) => setCampo("tasa_cambio", e.target.value)} />
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconMedioPago} etiqueta="Medio de Pago">
                                <select className={`${INPUT} form-select-plaintext`} value={form.medio_pago} onChange={(e) => setCampo("medio_pago", e.target.value)}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Yape/Plin">Yape/Plin</option>
                                    <option value="Credito">Crédito</option>
                                </select>
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconDestino} etiqueta="Destino">
                                <input className={INPUT} value={form.destino} onChange={(e) => setCampo("destino", e.target.value)} placeholder="Destino del envío" />
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconAgencia} etiqueta="Agencia">
                                <input className={INPUT} value={form.agencia_devolucion} onChange={(e) => setCampo("agencia_devolucion", e.target.value)} placeholder="Nombre de agencia" />
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconPuntoRecogo} etiqueta="Punto Recogo">
                                <input className={INPUT} value={form.punto_recogo} onChange={(e) => setCampo("punto_recogo", e.target.value)} placeholder="Punto de recogo" />
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconAdicionales} etiqueta="Adicionales">
                                <input className={INPUT} value={form.adicionales} onChange={(e) => setCampo("adicionales", e.target.value)} placeholder="Adicionales" />
                            </Campo>
                        </div>
                        <div className="col-6 col-md-4 col-xl-3 col-xxl-2">
                            <Campo icono={IconTipoDocumento} etiqueta="Tipo Documento">
                                <select className={`${INPUT} form-select-plaintext`} value={form.id_tipo_documento} onChange={(e) => { setCampo("id_tipo_documento", e.target.value); setCampo("numero_documento", ""); }}>
                                    <option value="">Seleccionar...</option>
                                    {tiposDocumento.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
                                </select>
                            </Campo>
                        </div>
                    </div>

                    {(() => {
                        const docSeleccionado = tiposDocumento.find((t) => String(t.id) === String(form.id_tipo_documento));
                        const nombreDoc = (docSeleccionado?.nombre || "").toLowerCase();
                        const requiereNumero = nombreDoc === "factura" || nombreDoc === "boleta" || nombreDoc === "ruc" || nombreDoc === "dni";
                        if (!requiereNumero) return null;
                        return (
                            <div className="mt-4">
                                <Campo icono={IconTipoDocumento} etiqueta={`Número de ${docSeleccionado.nombre}`}>
                                    <input className={INPUT} value={form.numero_documento}
                                        onChange={(e) => setCampo("numero_documento", e.target.value)}
                                        placeholder={`Ej. F001-0001234`} />
                                </Campo>
                            </div>
                        );
                    })()}

                    <div className="mt-5">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h3 className="small fw-bolder text-ink text-uppercase mb-0">Productos</h3>
                            <button type="button" onClick={agregarItem} className="btn btn-brand btn-sm rounded-2 fw-bold d-flex align-items-center gap-1">
                                + Agregar Producto
                            </button>
                        </div>

                        <div className="d-flex flex-column gap-4">
                            {items.map((it, idx) => (
                                <div key={idx} className="rounded-3 border border-line bg-white p-3 shadow-sm position-relative">
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => eliminarItem(idx)} className="btn btn-sm rounded-circle bg-danger-subtle text-danger fw-bold position-absolute top-0 end-0 m-2" style={{ width: "1.5rem", height: "1.5rem", lineHeight: 1 }}>&times;</button>
                                    )}
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6 col-xl-2 position-relative">
                                            <CampoItem icono={IconCodigo} etiqueta="Código">
                                                <input className={inputItem}
                                                    value={it.codigo_producto}
                                                    onChange={(e) => { setItem(idx, "codigo_producto", e.target.value); setItem(idx, "id_producto", null); buscarProducto(e.target.value, idx); }}
                                                    onFocus={() => { if (sugerencias.length > 0 && sugerenciasIdx === idx) setMostrarSugerencias(true); }}
                                                    placeholder="Buscar..." />
                                            </CampoItem>
                                            {mostrarSugerencias && sugerenciasIdx === idx && sugerencias.length > 0 && (
                                                <div className="position-absolute top-100 start-0 end-0 mt-1 bg-white border border-line rounded-3 shadow" style={{ zIndex: 50, maxHeight: "12rem", overflowY: "auto" }}>
                                                    {sugerencias.map((p) => (
                                                        <button key={p.id} type="button"
                                                            onClick={() => seleccionarProducto(p, idx)}
                                                            className="w-100 px-3 py-2 text-start bg-transparent border-0 border-bottom border-line">
                                                            <p className="small fw-bold text-ink mb-0">{p.codigo}</p>
                                                            <p className="small text-muted mb-0" style={{ fontSize: "0.65rem" }}>{p.nombre} — {p.marca_nombre || "Sin marca"}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12 col-md-6 col-xl-2">
                                            <CampoItem icono={IconProducto} etiqueta="Producto">
                                                <input className={inputItem} value={it.nombre_producto} readOnly placeholder="Auto" />
                                            </CampoItem>
                                        </div>
                                        <div className="col-12 col-md-6 col-xl-2">
                                            <CampoItem icono={IconMarca} etiqueta="Marca">
                                                <input className={inputItem} value={it.marca} readOnly placeholder="Auto" />
                                            </CampoItem>
                                        </div>
                                        <div className="col-6 col-md-4 col-xl-2">
                                            <CampoItem icono={IconCantidad} etiqueta="Cantidad">
                                                <input type="number" min="1" className={inputItem} value={it.cantidad} onChange={(e) => setItem(idx, "cantidad", e.target.value)} />
                                            </CampoItem>
                                        </div>
                                        <div className="col-6 col-md-4 col-xl-2">
                                            <CampoItem icono={IconEtiquetaprecio} etiqueta="Precio Unitario">
                                                <input type="number" step="0.01" min="0" className={inputItem} value={it.precio_unitario} onChange={(e) => setItem(idx, "precio_unitario", e.target.value)} />
                                            </CampoItem>
                                        </div>
                                        <div className="col-12 col-md-4 col-xl-2 d-flex flex-column justify-content-end">
                                            <div className="bg-accent-soft rounded-2 border border-accent-soft text-center small fw-bold text-accent-deep d-flex align-items-center justify-content-center" style={{ height: "2.25rem", borderColor: "rgba(230,126,34,.3)" }}>
                                                Subtotal: {form.moneda}{((Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0) * tasaCambio).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {esCredito && (
                        <div className="mt-4 rounded-3 border p-4" style={{ borderColor: "rgba(230,126,34,.3)", backgroundColor: "rgba(230,126,34,.08)" }}>
                            <p className="small fw-bold text-accent-deep text-uppercase mb-3">Plan de Crédito</p>
                            <div className="row g-4">
                                <div className="col-12 col-md-3">
                                    <label className="d-flex flex-column gap-1">
                                        <span className="form-label-sm">N° de Plazos</span>
                                        <input type="number" min="1" max="36" className="form-input"
                                            value={form.plazos} onChange={(e) => setCampo("plazos", e.target.value)} />
                                    </label>
                                </div>
                                <div className="col-12 col-md-3">
                                    <label className="d-flex flex-column gap-1">
                                        <span className="form-label-sm">Fecha de Pago</span>
                                        <input type="date" className="form-input"
                                            value={form.fecha_pago} onChange={(e) => setCampo("fecha_pago", e.target.value)} />
                                    </label>
                                </div>
                                <div className="col-12 col-md-3">
                                    <div className="d-flex flex-column gap-1">
                                        <span className="form-label-sm">Cuota Mensual</span>
                                        <div className="bg-white rounded-2 border border-line px-3 py-2 small fw-bold text-brand">
                                            {form.moneda} {montoCuota.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-3">
                                    <div className="d-flex flex-column gap-1">
                                        <span className="form-label-sm">Total a Crédito</span>
                                        <div className="bg-white rounded-2 border border-line px-3 py-2 small fw-bold text-ink">
                                            {form.moneda} {totalVenta.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {numPlazos > 1 && (
                                <div className="mt-3 d-flex flex-wrap gap-2">
                                    {Array.from({ length: numPlazos }, (_, i) => (
                                        <span key={i} className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill bg-white border border-line small fw-bold text-ink">
                                            Cuota {i + 1}: {form.moneda} {montoCuota.toFixed(2)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="d-flex flex-column flex-lg-row justify-content-between mt-4 gap-4">
                        <div className="w-100 flex-grow-1">
                            <label className="d-block small text-ink mb-2 fw-bold">Observaciones</label>
                            <div className="d-flex align-items-start bg-brand-soft rounded-3 border border-line w-100" style={{ minHeight: "5rem" }}>
                                <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "2.5rem", color: "var(--brand)" }}><IconObservaciones /></span>
                                <textarea rows="3" className="w-100 bg-transparent ps-3 pt-3 small text-ink form-control-plaintext border-0 flex-grow-1" style={{ resize: "none", minHeight: "5rem" }} value={form.observaciones} onChange={(e) => setCampo("observaciones", e.target.value)} placeholder="Observaciones de la venta..." />
                            </div>
                            <label className="d-flex align-items-center gap-2 mt-3 cursor-pointer user-select-none">
                                <input type="checkbox" checked={form.para_taller} onChange={(e) => setCampo("para_taller", e.target.checked)}
                                    className="form-check-input border-line" />
                                <span className="small text-ink fw-bold">Para taller</span>
                            </label>
                        </div>

                        <div className="flex-grow-0">
                            <label className="d-block small text-ink mb-2 fw-bold">Dinero Adelanto</label>
                            <div className="bg-brand-soft rounded-3 border border-line d-flex align-items-center px-3" style={{ height: "2.75rem" }}>
                                <span className="small fw-bold text-muted me-2">{form.moneda}</span>
                                <input type="number" step="0.01" min="0" max={totalBruto}
                                    className="bg-transparent w-100 h-100 small text-ink form-control-plaintext"
                                    value={form.adelanto} onChange={(e) => setCampo("adelanto", e.target.value)} placeholder="0.00" />
                            </div>
                            {adelanto > 0 && (
                                <p className="small text-brand fw-bold mt-1 mb-0" style={{ fontSize: "0.65rem" }}>Se descuenta {form.moneda} {adelanto.toFixed(2)}</p>
                            )}
                        </div>

                        <div className="d-flex flex-column align-items-center gap-2 border rounded-3 px-3 py-3 mt-3 mt-lg-0" style={{ borderColor: "rgba(230,126,34,.3)", backgroundColor: "rgba(230,126,34,.08)", minWidth: "15rem" }}>
                            <div className="d-flex gap-1 align-items-center">
                                <IconEtiquetaprecio />
                                <span className="text-accent-deep small fw-medium">Precio Final</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-center rounded-2 border bg-white px-3 py-2 text-accent" style={{ borderColor: "var(--accent)", minWidth: "8.75rem" }}>
                                <span className="fw-bold me-1">{form.moneda}</span>
                                <span className="fw-bolder fs-5">{form.para_taller ? "0.00" : totalVenta.toFixed(2)}</span>
                            </div>
                            {adelanto > 0 && !form.para_taller && (
                                <p className="small text-muted mb-0 text-decoration-line-through" style={{ fontSize: "0.65rem" }}>{form.moneda} {totalBruto.toFixed(2)}</p>
                            )}
                            <p className="small text-muted mb-0" style={{ fontSize: "0.65rem" }}>{items.filter((it) => it.id_producto).length} producto{items.filter((it) => it.id_producto).length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <button type="submit" disabled={guardando}
                        className="mt-5 w-100 btn btn-accent rounded-3 fw-bold py-3">
                        {guardando ? "REGISTRANDO..." : "Finalizar Venta"}
                    </button>
                </form>
            </div>

            {modalAlert.open && <ModalAlert tipo={modalAlert.tipo} titulo={modalAlert.titulo} mensaje={modalAlert.mensaje} onClose={() => setModalAlert({ ...modalAlert, open: false })} />}
        </div>
    );
}

export default Reporteventas;