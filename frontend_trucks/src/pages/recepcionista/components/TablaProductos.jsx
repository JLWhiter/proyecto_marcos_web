export default function TablaProductos({
    visibleRows, selectedId, onSelect,
    busqueda, onBuscar, filtroAbierto, setFiltroAbierto,
    sortAbierto, setSortAbierto, columnaOrden, setColumnaOrden,
    direccion, setDireccion, pagina, totalPaginas, total, cambiarPagina,
}) {
    const toggleClase = (activo) =>
        `btn btn-sm rounded-2 fw-bold ${activo ? "btn-brand" : "btn-outline-secondary"}`;

    return (
        <div className="d-flex flex-column gap-4">
            <div className="d-flex flex-wrap gap-2">
                <button onClick={() => setFiltroAbierto((v) => !v)} className={toggleClase(filtroAbierto)}>Filtrar</button>
                <button onClick={() => setSortAbierto((v) => !v)} className={toggleClase(sortAbierto)}>Clasificar</button>
            </div>

            {filtroAbierto && (
                <div className="d-flex gap-2 align-items-center">
                    <input type="text" placeholder="Buscar por código o nombre..." value={busqueda} onChange={(e) => onBuscar(e.target.value)} className="form-input" />
                    <button onClick={() => onBuscar("")} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold flex-shrink-0">Limpiar</button>
                </div>
            )}

            {sortAbierto && (
                <div className="d-flex gap-2 align-items-center flex-wrap">
                    <select value={columnaOrden} onChange={(e) => setColumnaOrden(e.target.value)} className="form-select form-select-sm rounded-2" style={{ width: "auto" }}>
                        <option value="code">Código</option>
                        <option value="name">Nombre</option>
                        <option value="marcas">Marca</option>
                        <option value="proveedor">Proveedor</option>
                        <option value="qty">Cantidad</option>
                        <option value="rec">Recibido</option>
                        <option value="ubicacion">Ubicación</option>
                    </select>
                    <button onClick={() => setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'))} className="btn btn-outline-secondary btn-sm rounded-2 fw-bold">
                        {direccion === 'asc' ? '↑ Ascendente' : '↓ Descendente'}
                    </button>
                </div>
            )}

            <div className="bg-white rounded-3 border border-line overflow-hidden shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                            <tr>
                                <th className="px-3 py-3">Código</th>
                                <th className="px-3 py-3">Nombre</th>
                                <th className="px-3 py-3">Marca</th>
                                <th className="px-3 py-3">Proveedor</th>
                                <th className="px-3 py-3">Cantidad</th>
                                <th className="px-3 py-3">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRows.map((row) => {
                                const isSelected = selectedId === row.id;
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => onSelect(row)}
                                        className={`cursor-pointer ${isSelected ? "bg-accent-soft" : ""}`}
                                        style={isSelected ? { boxShadow: "inset 3px 0 0 #E67E22" } : undefined}
                                    >
                                        <td className="px-3 py-3 small fw-medium text-ink">{row.code}</td>
                                        <td className="px-3 py-3 small fw-semibold text-ink">{row.name}</td>
                                        <td className="px-3 py-3 small text-muted">{row.marcas || '—'}</td>
                                        <td className="px-3 py-3 small text-muted">{row.proveedor || '—'}</td>
                                        <td className="px-3 py-3 small fw-semibold text-ink">{row.qty}</td>
                                        <td className="px-3 py-3 small text-muted">{row.ubicacion || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <p className="small text-muted mb-0">Página {pagina} de {totalPaginas} ({total} productos)</p>
                <div className="d-flex gap-2">
                    <button disabled={pagina <= 1} onClick={() => cambiarPagina(pagina - 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">← Anterior</button>
                    <button disabled={pagina >= totalPaginas} onClick={() => cambiarPagina(pagina + 1)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Siguiente →</button>
                </div>
            </div>
        </div>
    );
}