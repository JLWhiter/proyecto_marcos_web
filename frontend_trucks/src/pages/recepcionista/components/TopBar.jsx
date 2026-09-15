import IconLupa from "../../../assets/icons/lupa.jsx";
import UserMenu from "../../../components/UserMenu";
import BotonActualizar from "../../../components/BotonActualizar";

function TopBar({ busqueda = "", onBuscar = () => {}, onToggleMenu = () => {} }) {
    return (
        <div className="bg-white border-bottom border-line d-flex flex-wrap align-items-center justify-content-between gap-2 gap-md-3 px-3 px-md-4 py-3">
            <div className="d-flex align-items-center gap-2 gap-md-3 order-1 min-w-0">
                <button onClick={onToggleMenu} className="d-md-none btn btn-link btn-sm text-ink p-0" aria-label="Abrir menú">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
                <div className="min-w-0">
                    <h2 className="fw-bolder fs-4 fs-md-5 text-ink mb-0 text-truncate">Ventas</h2>
                    <p className="text-muted small mb-0 d-none d-sm-block">Adquirir Producto y Detalles</p>
                </div>
            </div>

            <div className="d-flex align-items-center gap-2 gap-md-3 order-md-3">
                <div className="border-start border-line ps-2 d-flex align-items-center">
                    <BotonActualizar />
                </div>
                <UserMenu />
            </div>

            <div className="topbar-search-wrap order-2 order-md-2">
                <div className="position-relative">
                    <IconLupa className="pos-abs-center-left" />
                    <input
                        type="text"
                        placeholder="Buscar por código o nombre..."
                        value={busqueda}
                        onChange={(e) => onBuscar(e.target.value)}
                        className="topbar-search"
                    />
                </div>
            </div>
        </div>
    );
}

export default TopBar;