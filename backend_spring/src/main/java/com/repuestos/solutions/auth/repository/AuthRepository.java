package com.repuestos.solutions.auth.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de UsuarioRepository (usuario_repo.py): acceso a usuario con joins
 * persona/rol, bump de token_ver (sesión única) y actualización de perfil.
 */
@Repository
public class AuthRepository {

    private static final String SELECT_FULL = """
            SELECT u.*, p.nombre, p.apellidos, p.dni, p.celular, r.nombre AS rol_nombre
            FROM usuario u
            LEFT JOIN persona p ON p.id = u.id_persona
            LEFT JOIN rol r ON r.id = u.id_rol
            """;

    private final JdbcTemplate jdbc;

    public AuthRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findByUsuario(String usuario) {
        return jdbc.queryForList(SELECT_FULL + " WHERE u.usuario = ?", usuario);
    }

    public List<Map<String, Object>> findById(int id) {
        return jdbc.queryForList(SELECT_FULL + " WHERE u.id = ?", id);
    }

    /** Incrementa token_ver y devuelve el nuevo valor (invalida sesiones previas). */
    public int bumpTokenVer(int userId) {
        jdbc.update("UPDATE usuario SET token_ver = token_ver + 1 WHERE id = ?", userId);
        List<Integer> rows = jdbc.query("SELECT token_ver FROM usuario WHERE id = ?",
                (rs, i) -> rs.getInt(1), userId);
        return rows.isEmpty() ? 0 : rows.get(0);
    }

    public Map<String, Object> toUserDict(Map<String, Object> row) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("id", row.get("id"));
        d.put("usuario", row.get("usuario"));
        d.put("id_persona", row.get("id_persona"));
        d.put("id_rol", row.get("id_rol"));
        d.put("foto", row.get("foto"));
        d.put("privilegio", row.get("privilegio"));
        d.put("token_ver", row.get("token_ver"));
        d.put("activo", row.get("activo"));
        d.put("nombre", row.get("nombre"));
        d.put("apellidos", row.get("apellidos"));
        d.put("dni", row.get("dni"));
        d.put("celular", row.get("celular"));
        d.put("rol_nombre", row.get("rol_nombre"));
        d.values().removeIf(java.util.Objects::isNull);
        return d;
    }

    public Map<String, Object> actualizarPerfil(int userId, Map<String, Object> personaData, Map<String, Object> usuarioData) {
        var personaCols = Map.of("nombre", true, "apellidos", true, "dni", true, "celular", true);
        var usuarioCols = Map.of("foto", true);

        List<Map<String, Object>> user = findById(userId);
        if (!user.isEmpty() && user.get(0).get("id_persona") != null && !personaData.isEmpty()) {
            Object idPersona = user.get(0).get("id_persona");
            StringBuilder sql = new StringBuilder("UPDATE persona SET ");
            List<Object> params = new java.util.ArrayList<>();
            boolean first = true;
            for (String k : personaData.keySet()) {
                if (personaCols.containsKey(k)) {
                    if (!first) sql.append(", ");
                    sql.append("`").append(k).append("` = ?");
                    params.add(personaData.get(k));
                    first = false;
                }
            }
            if (!params.isEmpty()) {
                sql.append(" WHERE id = ?");
                params.add(idPersona);
                jdbc.update(sql.toString(), params.toArray());
            }
        }
        if (!usuarioData.isEmpty()) {
            StringBuilder sql = new StringBuilder("UPDATE usuario SET ");
            List<Object> params = new java.util.ArrayList<>();
            boolean first = true;
            for (String k : usuarioData.keySet()) {
                if (usuarioCols.containsKey(k)) {
                    if (!first) sql.append(", ");
                    sql.append("`").append(k).append("` = ?");
                    params.add(usuarioData.get(k));
                    first = false;
                }
            }
            if (!params.isEmpty()) {
                sql.append(" WHERE id = ?");
                params.add(userId);
                jdbc.update(sql.toString(), params.toArray());
            }
        }
        List<Map<String, Object>> updated = findById(userId);
        return updated.isEmpty() ? null : toUserDict(updated.get(0));
    }

    public void registrarAuditoria(String tabla, String accion, int idUsuario, Integer idRegistro, String descripcion) {
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES (?, ?, ?, ?, ?, NOW())", tabla, accion, idUsuario, idRegistro, descripcion);
    }

    public void registrarLogin(int idUsuario, String usuario) {
        registrarAuditoria("usuario", "login", idUsuario, idUsuario, "Inicio de sesión: " + usuario);
    }

    public void registrarLogout(int idUsuario) {
        registrarAuditoria("usuario", "logout", idUsuario, idUsuario, "Cierre de sesión");
    }
}
