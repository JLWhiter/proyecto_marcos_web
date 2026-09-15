import Enterdoor from "../../../assets/icons/enterdoor.jsx";
import IconHistorial from "../../../assets/icons/iconHistorial.jsx";
import IconVenta from "../../../assets/icons/iconVenta.jsx";
import IconPagos from "../../../assets/icons/iconPagos.jsx";
import InventarioAs from "../../../assets/icons/inventarioAs.jsx";
import ReporteDano from "../../../assets/icons/reporteDano.jsx";
import User from "../../../assets/icons/user.jsx";
import { useNavigation } from "../../../context/NavigationContext";

const OPCIONES = [
    { page: "admin/dashboard", etiqueta: "Dashboard", Icono: User },
    { page: "admin/inventario", etiqueta: "Inventario", Icono: InventarioAs },
    { page: "admin/reporteventas", etiqueta: "Reporte Ventas", Icono: IconVenta },
    { page: "admin/pagos-pendientes", etiqueta: "Pagos Pendientes", Icono: IconPagos },
    { page: "admin/informe-danos", etiqueta: "Informe Daños", Icono: ReporteDano },
    { page: "admin/usuarios", etiqueta: "Gestión Usuarios", Icono: Enterdoor },
    { page: "admin/historial", etiqueta: "Historial", Icono: IconHistorial },
];

function SideBar({ abierto = false, onCerrar = () => {}, currentPage }) {
    const { navigate } = useNavigation();

    return (
        <div className={`sidebar bg-brand ${abierto ? "" : "sidebar-hidden"}`}>
            <div className="d-flex flex-column">
                <div className="d-flex flex-column text-start px-3 pt-4 pb-3">
                    <button onClick={onCerrar} className="d-md-none align-self-end bg-transparent border-0 text-white-50 fs-2 lh-1 fw-bold">&times;</button>
                    <h1 className="text-white fw-bolder fs-4 mb-0" style={{ letterSpacing: "-0.025em" }}>Repuestos Solutions</h1>
                    <span className="fw-semibold tracking-xs" style={{ fontSize: "0.6rem", color: "rgba(227,239,254,0.5)" }}>Gestión de Flotas</span>
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