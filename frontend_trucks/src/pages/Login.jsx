import logoRepuestos from "../assets/logos/logorepuestos.svg";
import Contraseña from "../assets/icons/contraseña.jsx";
import Correo from "../assets/icons/correo.jsx";
import Auth from "../assets/icons/authicon.jsx";
import { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

function Login() {

    const { navigate } = useNavigation();
    const { login } = useAuth();

    const [ email, setEmail] = useState("")
    const [ password, setPassword] = useState("")
    const [error, setError] = useState(() => sessionStorage.getItem("trucks_unauthorized") || "")
    const [success, setSuccess] = useState("")
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        sessionStorage.removeItem("trucks_unauthorized");
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();

        setCargando(true);
        setError("");
        setSuccess("");

        try {
            const data = await login(email.trim(), password);
            const rol = data.usuario.rol_nombre;

            if (rol === "Recepción") navigate("recepcionista/recepcion");
            else if (rol === "Almacenamiento") navigate("almacenero/inventario");
            else if (rol === "Administrador") navigate("admin/dashboard");

        } catch (err) {
            setSuccess("");
            setError(err.message || "Usuario o contraseña incorrectos");
        } finally {
            setCargando(false);
        }

    }


    return (
        <section className="min-vh-100 bg-white d-flex align-items-center py-5 px-3">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5 col-xxl-4">
                        <div className="d-flex flex-column gap-4">
                            <div className="d-flex justify-content-center">
                                <img src={logoRepuestos} alt="Logo Repuestos Solutions" className="img-fluid" style={{ width: 193 }} />
                            </div>
                            <div className="card border-line rounded-1 shadow-lg">
                                <div className="card-body p-4 d-flex flex-column gap-4">
                                    <div className="text-center">
                                        <h1 className="text-ink fs-5 fw-semibold">Acceso de inventario</h1>
                                        <p className="text-slate fw-light mb-0">Inicio de sesión seguro para el personal de flota registrado</p>
                                    </div>
                                    <div>
                                        <h2 className="text-muted fw-bold fs-6 mb-3">INGRESA TUS CREDENCIALES</h2>
                                        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" aria-busy={cargando}>
                                            <div>
                                                <label htmlFor="email" className="form-label fw-semibold text-slate mb-1">USUARIO</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-surface border-line"><Correo className="icon-sm text-muted" /></span>
                                                    <input className="form-control" type="text" name="email" id="email" required placeholder="admin" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="contraseña" className="form-label fw-semibold text-slate mb-1">CONTRASEÑA</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-surface border-line"><Contraseña className="icon-sm text-muted" /></span>
                                                    <input className="form-control" type="password" name="contraseña" id="contraseña" placeholder="••••••••" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                                </div>
                                            </div>

                                            <button type="submit" disabled={cargando} className="btn btn-brand w-100 py-3 d-flex justify-content-center align-items-center gap-2">
                                                {cargando ? "VERIFICANDO..." : "AUTENTICAR"} <Auth className="icon-sm" />
                                            </button>

                                            {error && <p className="alert alert-danger py-2 mb-0 small" role="alert">{error}</p>}
                                            {success && <p className="alert alert-success py-2 mb-0 small" role="status">{success}</p>}
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-muted mb-0">© 2026 Repuestos Solutions</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Login;