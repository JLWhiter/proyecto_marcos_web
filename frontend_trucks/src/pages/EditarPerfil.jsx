import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext";
import { actualizarPerfil, subirFotoPerfil } from "../api/auth";
import { setSession } from "../api/client";

const INPUT = "form-input";
const LABEL = "form-label-sm";

function EditarPerfil() {
    const { user } = useAuth();
    const { navigate } = useNavigation();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        nombre: user?.nombre || "",
        apellidos: user?.apellidos || "",
        dni: user?.dni || "",
        celular: user?.celular || "",
    });
    const [fotoPreview, setFotoPreview] = useState(user?.foto || null);
    const [fotoFile, setFotoFile] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setError("Formato no permitido. Use JPG o PNG");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("El archivo supera los 5MB");
            return;
        }
        setFotoFile(file);
        setFotoPreview(URL.createObjectURL(file));
        setError("");
    };

    const subirFoto = async () => {
        if (!fotoFile) return;
        setSubiendoFoto(true);
        try {
            const res = await subirFotoPerfil(fotoFile);
            const nuevaFoto = res?.data?.foto || res?.foto;
            if (nuevaFoto) {
                setFotoPreview(nuevaFoto);
                const updatedUser = { ...user, foto: nuevaFoto };
                const token = localStorage.getItem("trucks_token");
                setSession({ token, usuario: updatedUser });
                window.location.reload();
            }
            setFotoFile(null);
            setMensaje("Foto actualizada correctamente");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubiendoFoto(false);
        }
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
        if (!form.apellidos.trim()) { setError("Los apellidos son obligatorios"); return; }
        if (!form.dni.trim()) { setError("El DNI es obligatorio"); return; }
        if (!/^\d{8}$/.test(form.dni.trim())) { setError("El DNI debe tener 8 dígitos"); return; }
        if (form.celular && !/^\d{9}$/.test(form.celular.trim())) { setError("El celular debe tener 9 dígitos"); return; }

        setGuardando(true); setError(""); setMensaje("");
        try {
            await actualizarPerfil(form);
            const updatedUser = { ...user, ...form };
            const token = localStorage.getItem("trucks_token");
            setSession({ token, usuario: updatedUser });
            setMensaje("Perfil actualizado correctamente");
            if (fotoFile) await subirFoto();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    const getRol = () => {
        if (user?.rol_nombre === "Administrador") return "admin";
        if (user?.rol_nombre === "Recepcionista" || user?.rol_nombre === "Recepción") return "recepcionista";
        if (user?.rol_nombre === "Almacenista" || user?.rol_nombre === "Almacenero") return "almacenero";
        return "recepcionista";
    };

    const volver = () => {
        const rol = getRol();
        if (rol === "admin") navigate("admin/dashboard");
        else navigate("recepcionista/recepcion");
    };

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-600 mx-auto">
                <button onClick={volver} className="btn btn-link btn-sm text-muted text-decoration-none d-inline-flex align-items-center gap-1 p-0 mb-4">
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    Volver
                </button>

                <h2 className="fs-4 fw-bolder text-ink">Editar Perfil</h2>
                <p className="small text-muted mt-1">Actualiza tu información personal y foto de perfil.</p>

                <div className="mt-5 rounded-3 border border-line bg-white p-4 shadow-sm">
                    <div className="d-flex flex-column align-items-center mb-5">
                        <div
                            className="avatar-wrap rounded-circle bg-brand d-flex align-items-center justify-content-center text-white fw-bold fs-1 cursor-pointer overflow-hidden"
                            style={{ width: 96, height: 96, border: "4px solid rgba(15,27,76,0.2)" }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {fotoPreview ? (
                                <img src={fotoPreview} alt="Foto" className="w-100 h-100 object-cover" />
                            ) : (
                                (user?.usuario || "U").charAt(0).toUpperCase()
                            )}
                            <div className="avatar-overlay">
                                <svg className="icon-lg text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="d-none" onChange={handleFotoChange} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-link btn-sm p-0 mt-3 fw-bold text-brand text-decoration-none"
                        >
                            Cambiar foto
                        </button>
                        {fotoFile && (
                            <button
                                onClick={subirFoto}
                                disabled={subiendoFoto}
                                className="btn btn-accent btn-sm mt-2 fw-bold"
                            >
                                {subiendoFoto ? "Subiendo..." : "Subir foto ahora"}
                            </button>
                        )}
                    </div>

                    <form onSubmit={guardar} className="d-flex flex-column gap-3">
                        <div className="row g-4">
                            <label className="col-12 col-md-6 d-flex flex-column gap-1">
                                <span className={LABEL}>Nombre</span>
                                <input required className={INPUT} value={form.nombre} onChange={(e) => setCampo("nombre", e.target.value)} />
                            </label>
                            <label className="col-12 col-md-6 d-flex flex-column gap-1">
                                <span className={LABEL}>Apellidos</span>
                                <input required className={INPUT} value={form.apellidos} onChange={(e) => setCampo("apellidos", e.target.value)} />
                            </label>
                            <label className="col-12 col-md-6 d-flex flex-column gap-1">
                                <span className={LABEL}>DNI</span>
                                <input required className={INPUT} value={form.dni} onChange={(e) => setCampo("dni", e.target.value)} maxLength={8} />
                            </label>
                            <label className="col-12 col-md-6 d-flex flex-column gap-1">
                                <span className={LABEL}>Celular</span>
                                <input className={INPUT} value={form.celular} onChange={(e) => setCampo("celular", e.target.value)} maxLength={9} placeholder="Opcional" />
                            </label>
                        </div>

                        <div className="rounded-2 bg-surface-50 border border-line p-3 mt-2">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="small fw-bold text-ink mb-0">Usuario</p>
                                    <p className="small text-muted mb-0">{user?.usuario}</p>
                                </div>
                                <div>
                                    <p className="small fw-bold text-ink mb-0">Rol</p>
                                    <p className="small text-muted mb-0">{user?.rol_nombre}</p>
                                </div>
                            </div>
                        </div>

                        {error && <p className="small text-danger fw-semibold mb-0">{error}</p>}
                        {mensaje && <p className="small text-success fw-semibold mb-0">{mensaje}</p>}

                        <div className="d-flex justify-content-end gap-2 mt-2">
                            <button type="button" onClick={volver} className="btn btn-outline-brand rounded-2 fw-bold">Cancelar</button>
                            <button type="submit" disabled={guardando} className="btn btn-accent rounded-2 fw-bold">
                                {guardando ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditarPerfil;