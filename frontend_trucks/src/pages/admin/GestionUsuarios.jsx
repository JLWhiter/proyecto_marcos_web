import { useEffect, useState } from "react";
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, activarUsuario, listarRoles } from "../../api/usuarios";
import { useAuth } from "../../context/AuthContext";

const VACIO = { nombre: "", apellidos: "", dni: "", celular: "", usuario: "", contrasena: "", id_rol: "", privilegio: "" };

function GestionUsuarios() {
    const { user } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({ ...VACIO });
    const [guardando, setGuardando] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);
    const [filtroActivo, setFiltroActivo] = useState("1");

    const cargar = (soloActivos = filtroActivo) => {
        setCargando(true);
        setError("");
        return listarUsuarios({ per_page: 100, solo_activos: soloActivos })
            .then((res) => setUsuarios(res.data?.items || []))
            .catch((err) => setError(err.message))
            .finally(() => setCargando(false));
    };

    useEffect(() => {
        let cancelado = false;
        listarUsuarios({ per_page: 100, solo_activos: filtroActivo })
            .then((res) => { if (!cancelado) setUsuarios(res.data?.items || []); })
            .catch((err) => { if (!cancelado) setError(err.message); })
            .finally(() => { if (!cancelado) setCargando(false); });
        listarRoles()
            .then((res) => { if (!cancelado) setRoles(res.data || []); })
            .catch(() => {});
        return () => { cancelado = true; };
    }, [filtroActivo]);

    const cambiarFiltro = (valor) => {
        setFiltroActivo(valor);
        cargar(valor);
    };

    const abrirCrear = () => { setEditando(null); setForm({ ...VACIO }); setError(""); setMensaje(""); setModalAbierto(true); };

    const abrirEditar = (u) => {
        setEditando(u);
        setForm({ nombre: u.nombre || "", apellidos: u.apellidos || "", dni: u.dni || "", celular: u.celular || "", usuario: u.usuario || "", contrasena: "", id_rol: u.id_rol ?? "", privilegio: u.privilegio || "" });
        setError(""); setMensaje(""); setModalAbierto(true);
    };

    const cerrarModal = () => { setModalAbierto(false); setEditando(null); };

    const guardar = async (e) => {
        e.preventDefault();
        setGuardando(true); setError(""); setMensaje("");
        try {
            const payload = { ...form, id_rol: Number(form.id_rol) || undefined };
            if (editando) {
                if (!payload.contrasena) delete payload.contrasena;
                await actualizarUsuario(editando.id, payload);
                setMensaje("Usuario actualizado correctamente");
            } else {
                await crearUsuario(payload);
                setMensaje("Usuario creado correctamente");
            }
            setModalAbierto(false);
            cargar();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminar = (u) => {
        if (user && u.id === user.id) { setError("No puedes desactivar tu propia cuenta"); return; }
        if (!window.confirm(`¿Desactivar al usuario "${u.usuario}"?`)) return;
        setEliminandoId(u.id); setError("");
        eliminarUsuario(u.id)
            .then(() => {
                setMensaje("Usuario desactivado correctamente");
                cargar();
            })
            .catch((err) => setError(err.message))
            .finally(() => setEliminandoId(null));
    };

    const confirmarActivar = (u) => {
        if (!window.confirm(`¿Reactivar al usuario "${u.usuario}"?`)) return;
        setError("");
        activarUsuario(u.id)
            .then(() => { setMensaje("Usuario reactivado correctamente"); cargar(); })
            .catch((err) => setError(err.message));
    };

    const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

    return (
        <div className="w-100 bg-surface min-vh-100 p-5">
            <div className="max-w-1200 mx-auto">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h2 className="fs-4 fw-bolder text-ink">Gestión de Usuarios</h2>
                        <p className="small text-muted mt-1">Cree, edite y elimine los usuarios del sistema.</p>
                    </div>
                    <button onClick={abrirCrear} className="btn btn-accent rounded-2 fw-bold">+ Nuevo Usuario</button>
                </div>

                {error && <div className="alert alert-danger rounded-3 mt-4 py-3 small" role="alert">{error}</div>}
                {mensaje && <div className="alert alert-success rounded-3 mt-4 py-3 small" role="alert">{mensaje}</div>}

                <div className="d-flex gap-2 mt-4">
                    <button onClick={() => cambiarFiltro("1")} className={`btn btn-sm rounded-2 fw-bold ${filtroActivo === "1" ? "btn-brand" : "btn-outline-secondary"}`}>Activos</button>
                    <button onClick={() => cambiarFiltro("0")} className={`btn btn-sm rounded-2 fw-bold ${filtroActivo === "0" ? "btn-brand" : "btn-outline-secondary"}`}>Inactivos</button>
                    <button onClick={() => cambiarFiltro("")} className={`btn btn-sm rounded-2 fw-bold ${filtroActivo === "" ? "btn-brand" : "btn-outline-secondary"}`}>Todos</button>
                </div>

                <div className="mt-3 rounded-3 border border-line bg-white overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-brand-soft text-uppercase small fw-bold text-brand">
                                <tr>
                                    <th className="px-3 py-3">N°</th>
                                    <th className="px-3 py-3">Nombre Completo</th>
                                    <th className="px-3 py-3">DNI</th>
                                    <th className="px-3 py-3">Celular</th>
                                    <th className="px-3 py-3">Usuario</th>
                                    <th className="px-3 py-3">Rol</th>
                                    <th className="px-3 py-3">Privilegio</th>
                                    <th className="px-3 py-3">Estado</th>
                                    <th className="px-3 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando && (<tr><td colSpan="9" className="px-3 py-5 text-center small text-muted">Cargando usuarios...</td></tr>)}
                                {!cargando && usuarios.length === 0 && (<tr><td colSpan="9" className="px-3 py-5 text-center small text-muted">No hay usuarios registrados.</td></tr>)}
                                {usuarios.map((u, i) => (
                                    <tr key={u.id} className="small text-ink">
                                        <td className="px-3 py-3">{i + 1}</td>
                                        <td className="px-3 py-3">{[u.nombre, u.apellidos].filter(Boolean).join(" ") || "—"}</td>
                                        <td className="px-3 py-3">{u.dni || "—"}</td>
                                        <td className="px-3 py-3">{u.celular || "—"}</td>
                                        <td className="px-3 py-3">{u.usuario || "—"}</td>
                                        <td className="px-3 py-3">
                                            <span className="badge-soft bg-brand-soft text-brand">{u.rol_nombre || "—"}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`badge-soft border ${u.privilegio === "editar_precio" ? "bg-info-subtle text-info border-info" : "bg-body-secondary text-secondary border-secondary"}`}>
                                                {u.privilegio === "editar_precio" ? "Editar Precio" : "—"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`badge-soft border ${u.activo ? "bg-success-subtle text-success border-success" : "bg-danger-subtle text-danger border-danger"}`}>
                                                {u.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="d-flex gap-2 flex-wrap">
                                                <button onClick={() => abrirEditar(u)} className="btn btn-sm btn-outline-secondary rounded-2 fw-bold">Editar</button>
                                                {u.activo ? (
                                                    <button onClick={() => confirmarEliminar(u)} disabled={eliminandoId === u.id || (user && u.id === user.id)} className="btn btn-sm btn-outline-danger rounded-2 fw-bold">
                                                        {eliminandoId === u.id ? "Desactivando..." : "Desactivar"}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => confirmarActivar(u)} className="btn btn-sm btn-outline-success rounded-2 fw-bold">Reactivar</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-card max-w-600">
                        <div className="modal-head">
                            <span className="modal-title">{editando ? "Editar Usuario" : "Nuevo Usuario"}</span>
                            <button onClick={cerrarModal} className="modal-close" aria-label="Cerrar">✕</button>
                        </div>
                        <div className="p-4">
                            <form onSubmit={guardar} className="row g-4 mt-0">
                            <div className="col-12 col-md-6">
                                <label className="form-label-sm d-block mb-1">Nombre</label>
                                <input required className="form-input" value={form.nombre} onChange={(e) => setCampo("nombre", e.target.value)} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label-sm d-block mb-1">Apellidos</label>
                                <input required className="form-input" value={form.apellidos} onChange={(e) => setCampo("apellidos", e.target.value)} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label-sm d-block mb-1">DNI</label>
                                <input required className="form-input" value={form.dni} onChange={(e) => setCampo("dni", e.target.value)} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label-sm d-block mb-1">Celular</label>
                                <input className="form-input" value={form.celular} onChange={(e) => setCampo("celular", e.target.value)} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label-sm d-block mb-1">Usuario</label>
                                <input required className="form-input" value={form.usuario} onChange={(e) => setCampo("usuario", e.target.value)} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label-sm d-block mb-1">{editando ? "Contraseña (opcional)" : "Contraseña"}</label>
                                <input type="password" required={!editando} className="form-input" value={form.contrasena} onChange={(e) => setCampo("contrasena", e.target.value)} placeholder={editando ? "Dejar en blanco para no cambiar" : ""} />
                            </div>
                            <div className="col-12">
                                <label className="form-label-sm d-block mb-1">Rol</label>
                                <select required className="form-input" value={form.id_rol} onChange={(e) => setCampo("id_rol", e.target.value)}>
                                    <option value="">-- Seleccione --</option>
                                    {roles.map((r) => (<option key={r.id} value={r.id}>{r.nombre}</option>))}
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="form-label-sm d-block mb-1">Privilegio (Edición de Precio)</label>
                                <select className="form-input" value={form.privilegio} onChange={(e) => setCampo("privilegio", e.target.value)}>
                                    <option value="">Sin privilegio</option>
                                    <option value="editar_precio">Editar Precio</option>
                                </select>
                                <span className="small text-muted">Permite al usuario editar precios en la sección de Items.</span>
                            </div>
                            {error && <p className="small text-danger fw-semibold col-12 mb-0">{error}</p>}
                            <div className="col-12 d-flex justify-content-end gap-2">
                                <button type="button" onClick={cerrarModal} className="btn btn-outline-secondary rounded-2 fw-bold">Cancelar</button>
                                <button type="submit" disabled={guardando} className="btn btn-accent rounded-2 fw-bold">
                                    {guardando ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}

export default GestionUsuarios;