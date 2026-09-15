export function Panel({ titulo, badge, children }) {
    return (
        <div className="bg-white border border-line rounded-3 overflow-hidden shadow-sm">
            <div className="bg-brand-soft px-4 py-2 border-bottom border-line d-flex align-items-center justify-content-between">
                <span className="text-brand fw-bold small text-uppercase tracking-wide">{titulo}</span>
                {badge}
            </div>
            <div className="p-4 d-flex flex-column gap-3">{children}</div>
        </div>
    );
}

export function Campo({ etiqueta, children }) {
    return (
        <div className="d-flex flex-column gap-1">
            <label className="form-label-sm mb-0">{etiqueta}</label>
            {children}
        </div>
    );
}