import logoTrucks from "../assets/logos/logorepuestos.svg";
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
        <section className="bg-white h-100 px-4 d-flex justify-content-center align-items-center" style={{ paddingTop: 75, paddingBottom: 75 }}>
            <div className="d-flex flex-column gap-4 h-100 w-100 max-w-md">
                <div className="w-100 d-flex justify-content-center">
                    <img src={logoTrucks} alt="Logo Repuestos Solutions" style={{ width: 193 }} />
                </div>
                <div className="bg-white p-4 rounded-1 w-100 h-100 d-flex flex-column gap-4 shadow-lg border border-line">
                    <div className="text-center">
                        <h1 className="text-ink fs-5 fw-semibold">Acceso de inventario</h1>
                        <p className="text-slate fw-light mb-0">Inicio de sesión seguro para el personal de flota registrado</p>
                    </div>
                    <div className="d-flex flex-column gap-4">
                        <h2 className="text-muted fw-bold fs-6">SELECCIONAR ROL DE ACCESO</h2>
                        <form onSubmit={handleSubmit} className="w-100 d-flex flex-column gap-2">
                            <div className="w-100 d-flex flex-column gap-2">
                                <div className="d-flex flex-column gap-2">
                                    <label htmlFor="email" className="text-slate fw-bold">USUARIO</label>
                                    <div className="position-relative">
                                        <Correo className="pos-abs-center-left" />
                                        <input className="form-control field w-100" type="text" name="email" id="email" required placeholder="admin" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </div>
                                <div className="d-flex flex-column gap-2">
                                    <label htmlFor="contraseña" className="text-slate fw-bold">CONTRASEÑA</label>
                                    <div className="position-relative">
                                        <Contraseña className="pos-abs-center-left" />
                                        <input className="form-control field w-100" type="password" name="contraseña" id="contraseña" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="w-100">
                                <button disabled={cargando} className="btn btn-auth text-white w-100 h-100 d-flex justify-content-center align-items-center gap-1">{cargando ? "VERIFICANDO..." : "AUTENTICAR"} <Auth /></button>
                            </div>

                            {error && <p className="small text-danger mb-0">{error}</p>}
                            {success && <p className="small text-success mb-0">{success}</p>}
                        </form>
                    </div>
                </div>
                <div className="text-center text-muted">
                    <p className="mb-0">© 2026 Repuestos Solutions</p>
                </div>
            </div>
        </section>
    );
}

export default Login;