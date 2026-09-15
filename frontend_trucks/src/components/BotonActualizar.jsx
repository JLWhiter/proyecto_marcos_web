function BotonActualizar({ className = "" }) {
    const actualizar = () => {
        if ("caches" in window) {
            caches.keys().then((n) => n.forEach((k) => caches.delete(k)));
        }
        window.location.href = window.location.pathname + "?v=" + Date.now();
    };

    return (
        <button
            onClick={actualizar}
            title="Actualizar página"
            className={`btn btn-outline-brand rounded-2 d-inline-flex align-items-center gap-2 px-3 py-1 small fw-bold bg-white ${className}`}
        >
            <svg className="icon-sm text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
            Actualizar
        </button>
    );
}

export default BotonActualizar;