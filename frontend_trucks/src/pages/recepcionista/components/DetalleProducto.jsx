export default function DetalleProducto({
    product, precioEdit, setPrecioEdit,
    costoEdit, setCostoEdit,
    recEdit, setRecEdit, guardando, esAdmin,
    onGuardarPrecio, onGuardarCosto, onFinalizar, error, mensaje,
}) {
    const infoClase = "rounded-3 border border-line bg-brand-soft px-3 py-3 small text-ink";

    return (
        <div className="d-flex flex-column gap-4">
            <p className="fs-5 fw-bolder text-ink">Detalles del Producto</p>

            <div className="d-flex align-items-start gap-3 bg-white p-3 rounded-3 border border-line shadow-sm">
                <div className="d-flex rounded-3 bg-brand-soft align-items-center justify-content-center border overflow-hidden flex-shrink-0" style={{ width: "4rem", height: "4rem", borderColor: "rgba(15,27,76,.12)" }}>
                    {product?.imagen_url
                        ? <img src={product.imagen_url} alt="Producto" className="w-100 h-100 object-cover" />
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="#8e8e8e"><path d="M17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12M19.36,4H16.78L15.36,2.36C15.04,2.03 14.56,1.89 14.1,2H9.9C9.44,2 8.96,2.03 8.64,2.36L7.22,4H4.64C3.19,4 2,5.19 2,6.64V17.36C2,18.81 3.19,20 4.64,20H19.36C20.81,20 22,18.81 22,17.36V6.64C22,5.19 20.81,4 19.36,4M19,16.25C19,16.94 18.44,17.5 17.75,17.5H6.25C5.56,17.5 5,16.94 5,16.25V7.75C5,7.06 5.56,6.5 6.25,6.5H17.75C18.44,6.5 19,7.06 19,7.75V16.25Z"/></svg>
                    }
                </div>
                <div>
                    <p className="fs-6 fw-bold text-ink mb-0">{product?.name || "Producto"}</p>
                    <p className="small text-muted mb-0">SKU: {product?.code}</p>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-12 col-sm-6">
                    <div className="d-flex flex-column gap-1">
                        <p className="form-label-sm text-brand mb-0">Proveedor</p>
                        <div className={infoClase}>{product?.proveedor}</div>
                    </div>
                </div>
                <div className="col-12 col-sm-6">
                    <div className="d-flex flex-column gap-1">
                        <p className="form-label-sm text-brand mb-0">Ubicación</p>
                        <div className={infoClase}>{product?.ubicacion || '—'}</div>
                    </div>
                </div>
                <div className="col-12 col-sm-6">
                    <div className="d-flex flex-column gap-1">
                        <p className="form-label-sm text-brand mb-0">Marca(s)</p>
                        <div className={infoClase}>{product?.marcas || '—'}</div>
                    </div>
                </div>
                <div className="col-12 col-sm-6">
                    <div className="d-flex flex-column gap-1">
                        <p className="form-label-sm text-brand mb-0">Costo Unitario</p>
                        {esAdmin ? (
                            <div className="rounded-3 border bg-white px-3 py-2 small text-ink d-flex align-items-center gap-2" style={{ borderColor: "var(--accent)" }}>
                                <span className="fw-bold text-accent">$</span>
                                <input
                                    type="number" step="0.01" min="0"
                                    value={costoEdit}
                                    onChange={(e) => setCostoEdit(e.target.value)}
                                    className="bg-transparent w-100 small fw-bold text-ink border-0"
                                />
                                <button
                                    onClick={onGuardarCosto}
                                    disabled={guardando}
                                    className="btn btn-accent btn-sm rounded-2 fw-bold flex-shrink-0"
                                >
                                    {guardando ? "..." : "Guardar"}
                                </button>
                            </div>
                        ) : (
                            <div className={infoClase}>$ {product?.costo ?? 0}</div>
                        )}
                    </div>
                </div>
                <div className="col-12 col-sm-6">
                    <div className="d-flex flex-column gap-1">
                        <p className="form-label-sm text-brand mb-0">Cantidad Recibida</p>
                        <div className={infoClase}>
                            <input type="number" min="0" value={recEdit} onChange={(e) => setRecEdit(e.target.value)} className="bg-transparent w-100 small fw-bold text-ink border-0" />
                        </div>
                    </div>
                </div>
            </div>

            {esAdmin && (
                <div className="rounded-3 border p-3" style={{ borderColor: "rgba(230,126,34,.3)", backgroundColor: "rgba(230,126,34,.08)" }}>
                    <p className="small fw-bold text-accent-deep text-uppercase mb-3">Precio de Venta</p>

                    <div className="d-flex align-items-center justify-content-between gap-3 bg-white p-3 rounded-3" style={{ border: "2px solid var(--accent)" }}>
                        <div className="d-flex align-items-center gap-2 w-100">
                            <span className="fs-5 fw-bold text-accent">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={precioEdit}
                                onChange={(e) => setPrecioEdit(e.target.value)}
                                className="fs-5 fw-bold text-accent bg-transparent w-100 border-0"
                                style={{ borderBottom: "2px solid var(--accent)", borderRadius: 0 }}
                            />
                        </div>
                        <button
                            onClick={onGuardarPrecio}
                            disabled={guardando}
                            className="btn btn-accent btn-sm rounded-2 fw-bold text-uppercase flex-shrink-0"
                        >
                            {guardando ? "GUARDANDO..." : "Guardar"}
                        </button>
                    </div>
                    <div className="d-flex justify-content-between mt-3">
                        <p className="small text-muted fw-bold text-uppercase mb-0">Recomendado</p>
                        <p className="small fw-bold text-brand mb-0">$ {product?.costo ? (product.costo * 1.3).toFixed(2) : "0.00"}</p>
                    </div>
                </div>
            )}

            {!esAdmin && (
                <div className="rounded-3 border border-line bg-white p-3">
                    <p className="small fw-bold text-muted text-uppercase mb-1">Precio de Venta</p>
                    <p className="fs-5 fw-bolder text-ink mb-0">$ {product?.price ?? 0}</p>
                </div>
            )}

            <div className="border-top border-line pt-3">
                <button onClick={onFinalizar} disabled={guardando} className="w-100 btn btn-accent rounded-3 fw-bold text-uppercase py-3" style={{ letterSpacing: "0.15em" }}>
                    {guardando ? "REGISTRANDO..." : "Finalizar Adquisición"}
                </button>
                {error && <p className="small text-danger mt-2 mb-0">{error}</p>}
                {mensaje && <p className="small text-success mt-2 mb-0">{mensaje}</p>}
            </div>
        </div>
    );
}