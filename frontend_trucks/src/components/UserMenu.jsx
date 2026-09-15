import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const { navigate } = useNavigation();
    const [abierto, setAbierto] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const cerrar = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setAbierto(false);
        };
        document.addEventListener("mousedown", cerrar);
        return () => document.removeEventListener("mousedown", cerrar);
    }, []);

    const handleLogout = async () => {
        setAbierto(false);
        sessionStorage.removeItem("trucks_page");
        await logout();
        navigate("login");
    };

    const abrirPerfil = () => {
        setAbierto(false);
        navigate("editar-perfil");
    };

    const fotoUrl = user?.foto || null;

    return (
        <div className="position-relative" ref={menuRef}>
            <button onClick={() => setAbierto((v) => !v)} className="btn btn-link text-decoration-none d-flex align-items-center gap-2 p-0 cursor-pointer">
                <div className="rounded-circle bg-brand d-flex align-items-center justify-content-center text-white small fw-bold overflow-hidden" style={{ width: 36, height: 36, border: "2px solid rgba(15,27,76,0.3)" }}>
                    {fotoUrl ? (
                        <img src={fotoUrl} alt="Foto" className="w-100 h-100 object-cover" />
                    ) : (
                        (user?.usuario || "U").charAt(0).toUpperCase()
                    )}
                </div>
                <div className="d-none d-sm-block text-start">
                    <p className="text-ink fw-bold small lh-1 mb-0">{user?.usuario || "Usuario"}</p>
                    <p className="text-muted mb-0 lh-1" style={{ fontSize: "0.6rem" }}>{user?.rol_nombre || ""}</p>
                </div>
                <svg className={`icon-sm text-muted ${abierto ? "rotate-180" : ""}`} style={{ transition: "transform 0.2s" }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4L6 8L10 4" /></svg>
            </button>

            {abierto && (
                <div className="user-menu-dropdown rounded-2 border border-line bg-white shadow-lg" onClick={() => setAbierto(false)}>
                    <div className="px-3 py-2 border-bottom border-line bg-surface-50">
                        <p className="small fw-bolder text-ink mb-0">{user?.usuario || "Usuario"}</p>
                        <p className="small text-muted mb-0 mt-1">{user?.rol_nombre || ""}</p>
                        {user?.dni && <p className="text-muted mb-0 mt-1" style={{ fontSize: "0.6rem" }}>DNI: {user.dni}</p>}
                    </div>
                    <div className="py-1">
                        <button onClick={abrirPerfil} className="w-100 d-flex align-items-center gap-2 px-3 py-2 small text-ink text-decoration-none bg-transparent border-0 text-start cursor-pointer">
                            <svg className="icon-sm text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                            Editar Perfil
                        </button>
                        <button onClick={handleLogout} className="w-100 d-flex align-items-center gap-2 px-3 py-2 small text-danger bg-transparent border-0 text-start cursor-pointer">
                            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}