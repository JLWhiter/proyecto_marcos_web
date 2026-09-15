import Enterdoor from "../../../assets/icons/enterdoor.jsx";
import IconHistorial from "../../../assets/icons/iconHistorial.jsx";
import IconVenta from "../../../assets/icons/iconVenta.jsx";
import { useNavigation } from "../../../context/NavigationContext";

const OPCIONES = [
    { page: "recepcionista/recepcion", etiqueta: "Items", Icono: Enterdoor },
    { page: "recepcionista/historial", etiqueta: "Historial", Icono: IconHistorial },
    { page: "recepcionista/reporteventas", etiqueta: "Reporte Ventas", Icono: IconVenta },
];

function SideBar({ abierto = false, onCerrar = () => {}, currentPage }) {
    const { navigate } = useNavigation();

    return (
        <div className={`sidebar bg-brand ${abierto ? "" : "sidebar-hidden"}`}>
            <div className="d-flex flex-column">
                <div className="d-flex flex-column text-start px-3 pt-4 pb-3">
                    <button onClick={onCerrar} className="d-md-none align-self-end bg-transparent border-0 text-white-50 fs-2 lh-1 fw-bold">&times;</button>
                    <h1 className="text-white fw-bolder fs-4 mb-0" style={{ letterSpacing: "-0.025em" }}>Repuestos Solutions</h1>
                    <span className="text-brand-soft fw-semibold tracking-xs" style={{ fontSize: "0.6rem", color: "rgba(227,239,254,0.5) !important" }}>Gestión</span>
                </div>

                <nav className="d-flex flex-column gap-1 mt-2">
                    {OPCIONES.map(({ page, etiqueta, Icono }) => (
                        <div
                            key={page}
                            onClick={() => navigate(page)}
                            className={`nav-item-brand ${currentPage === page ? "nav-item-brand-active" : "nav-item-brand-inactive"}`}
                        >
                            <Icono />
                            <span>{etiqueta}</span>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
}

export default SideBar;