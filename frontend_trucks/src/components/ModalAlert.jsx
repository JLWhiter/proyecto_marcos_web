export default function ModalAlert({ tipo = "error", titulo, mensaje, onClose, onConfirm, textoConfirmar = "Confirmar" }) {
    const colores = {
        error: { borde: "border-danger", aqua: "bg-danger-subtle", icon: "text-danger", btn: "btn-danger text-white" },
        exito: { borde: "border-success", aqua: "bg-success-subtle", icon: "text-success", btn: "btn-success text-white" },
        aviso: { borde: "border-warning", aqua: "bg-warning-subtle", icon: "text-warning", btn: "btn-warning text-dark" },
        confirmar: { borde: "border-brand", aqua: "bg-brand-soft", icon: "text-brand", btn: "btn-brand text-white" },
    };
    const c = colores[tipo] || colores.error;
    const iconos = {
        error: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
        exito: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        aviso: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
        confirmar: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
            <div className={`bg-white rounded-3 border-2 ${c.borde} shadow-lg w-100 p-4 text-center`} style={{ maxWidth: "24rem" }} onClick={(e) => e.stopPropagation()}>
                <div className={`mx-auto mb-3 rounded-circle ${c.aqua} d-flex align-items-center justify-content-center`} style={{ width: 56, height: 56 }}>
                    <svg className={`icon-lg ${c.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconos[tipo]} />
                    </svg>
                </div>
                {titulo && <h3 className="fs-5 fw-bold text-ink mb-1">{titulo}</h3>}
                <p className="small text-muted mb-4">{mensaje}</p>
                {onConfirm ? (
                    <div className="d-flex gap-2">
                        <button onClick={onClose} className="btn btn-outline-brand rounded-3 fw-bold flex-grow-1">Cancelar</button>
                        <button onClick={onConfirm} className={`btn ${c.btn} rounded-3 fw-bold flex-grow-1`}>{textoConfirmar}</button>
                    </div>
                ) : (
                    <button onClick={onClose} className={`btn ${c.btn} rounded-3 fw-bold w-100`}>Entendido</button>
                )}
            </div>
        </div>
    );
}