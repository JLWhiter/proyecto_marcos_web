export default function FormNuevoProducto({
    proveedores, marcas, categorias,
    nombre, setNombre, codigo, setCodigo,
    proveedor, setProveedor, proveedorOtro, setProveedorOtro,
    marca, setMarca, marcaOtro, setMarcaOtro,
    categoria, setCategoria, categoriaOtro, setCategoriaOtro,
    estado, setEstado, ubicacion, setUbicacion,
    costo, setCosto, venta, setVenta, cantidad, setCantidad,
    guardando, onSubmit, onCancelar,
    fotoFileRef, fotoPreview, onFotoClick,
    error, mensaje,
}) {
    const recomendarVenta = () => {
        const c = Number(costo);
        if (c > 0) setVenta((c * 1.3).toFixed(2));
    };

    const campo = (label, children) => (
        <div className="d-flex flex-column gap-1">
            <label className="form-label-sm">{label}</label>
            {children}
        </div>
    );

    return (
        <form onSubmit={onSubmit} className="bg-white rounded-3 border border-line p-4 d-flex flex-column gap-3 shadow-sm">
            <p className="small fw-bold text-ink mb-0">Registrar nuevo producto</p>
            <div className="row g-3">
                <div className="col-12 col-sm-6">
                    {campo("Nombre del Producto", <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="form-input" placeholder="Ej. Filtro de aceite" />)}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Código", <input required value={codigo} onChange={(e) => setCodigo(e.target.value)} className="form-input" placeholder="Ej. TRK-001" />)}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Proveedor", (
                        <>
                            <select required value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="form-input">
                                <option value="">Seleccionar...</option>
                                {proveedores.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                                <option value="otros">Otros...</option>
                            </select>
                            {proveedor === "otros" && (<input required value={proveedorOtro} onChange={(e) => setProveedorOtro(e.target.value)} className="form-input" placeholder="Nombre del proveedor..." />)}
                        </>
                    ))}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Marca", (
                        <>
                            <select value={marca} onChange={(e) => setMarca(e.target.value)} className="form-input">
                                <option value="">Seleccionar...</option>
                                {marcas.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
                                <option value="otros">Otros...</option>
                            </select>
                            {marca === "otros" && (<input required value={marcaOtro} onChange={(e) => setMarcaOtro(e.target.value)} className="form-input" placeholder="Nombre de la marca..." />)}
                        </>
                    ))}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Categoría", (
                        <>
                            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="form-input">
                                <option value="">Seleccionar...</option>
                                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                                <option value="otros">Otros...</option>
                            </select>
                            {categoria === "otros" && (<input required value={categoriaOtro} onChange={(e) => setCategoriaOtro(e.target.value)} className="form-input" placeholder="Nombre de la categoría..." />)}
                        </>
                    ))}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Estado", (
                        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="form-input">
                            <option value="Nuevo">Nuevo</option>
                            <option value="Semi Nuevo">Semi Nuevo</option>
                            <option value="Dañado">Dañado</option>
                        </select>
                    ))}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Ubicación", <input required value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="form-input" placeholder="Ej. A2-3" />)}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Costo Unitario ($)", <input required type="number" step="0.01" min="0" value={costo} onChange={(e) => { setCosto(e.target.value); recomendarVenta(); }} className="form-input" placeholder="0.00" />)}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Precio de Venta ($)", <input type="number" step="0.01" min="0" value={venta} onChange={(e) => setVenta(e.target.value)} className="form-input" placeholder="0.00" />)}
                </div>
                <div className="col-12 col-sm-6">
                    {campo("Cantidad Recibida", <input type="number" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="form-input" placeholder="0" />)}
                </div>
            </div>
            <div>
                <label className="form-label-sm d-block mb-1">Foto del Producto</label>
                <input ref={fotoFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="d-none"
                    onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) onFotoClick(f);
                        e.target.value = "";
                    }} />
                <button type="button" onClick={() => fotoFileRef?.current?.click()}
                    className="border border-dashed bg-brand-soft rounded-3 py-3 w-100 d-flex flex-column align-items-center gap-1" style={{ borderColor: "var(--line)" }}>
                    {fotoPreview
                        ? <img src={fotoPreview} alt="Preview" className="rounded object-cover" style={{ height: "4rem" }} />
                        : <>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#595F63"><path d="M17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12M19.36,4H16.78L15.36,2.36C15.04,2.03 14.56,1.89 14.1,2H9.9C9.44,2 8.96,2.03 8.64,2.36L7.22,4H4.64C3.19,4 2,5.19 2,6.64V17.36C2,18.81 3.19,20 4.64,20H19.36C20.81,20 22,18.81 22,17.36V6.64C22,5.19 20.81,4 19.36,4M19,16.25C19,16.94 18.44,17.5 17.75,17.5H6.25C5.56,17.5 5,16.94 5,16.25V7.75C5,7.06 5.56,6.5 6.25,6.5H17.75C18.44,6.5 19,7.06 19,7.75V16.25Z"/></svg>
                            <span className="text-muted fw-bold" style={{ fontSize: "0.6rem" }}>SUBIR FOTO</span>
                        </>}
                </button>
            </div>
            <div className="d-flex gap-2">
                <button type="submit" disabled={guardando} className="btn btn-accent btn-sm rounded-2 fw-bold">
                    {guardando ? "GUARDANDO..." : "Guardar Producto"}
                </button>
                <button type="button" onClick={onCancelar} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">Cancelar</button>
            </div>
            {error && <p className="small text-danger fw-semibold mb-0">{error}</p>}
            {mensaje && <p className="small text-success fw-semibold mb-0">{mensaje}</p>}
        </form>
    );
}