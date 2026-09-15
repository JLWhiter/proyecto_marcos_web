package com.repuestos.solutions.usuario.repository;

import com.repuestos.solutions.common.BusinessException;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de UsuarioRepository (usuario_repo.py) para la gestión de usuarios.
 * Creación vía sp_crear_usuario; actualización/activación vía SQL directo con auditoría.
 */
@Repository
public class UsuarioRepository {

    private static final String SELECT_FULL = """
            SELECT u.*, p.nombre, p.apellidos, p.dni, p.celular, r.nombre AS rol_nombre
            FROM usuario u
            LEFT JOIN persona p ON p.id = u.id_persona
            LEFT JOIN rol r ON r.id = u.id_rol
            """;

    private final JdbcTemplate jdbc;

    public UsuarioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> listar(String soloActivos, Integer idRol, int page, int perPage) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (soloActivos != null && !soloActivos.isBlank()) {
            where.append(" AND u.activo = ? ");
            params.add(Integer.parseInt(soloActivos));
        }
        if (idRol != null) {
            where.append(" AND u.id_rol = ? ");
            params.add(idRol);
        }
        int offset = (page - 1) * perPage;
        params.add(perPage);
        params.add(offset);
        String sql = SELECT_FULL + where + " ORDER BY u.id LIMIT ? OFFSET ?";
        return jdbc.queryForList(sql, params.toArray());
    }

    public long contar(String soloActivos, Integer idRol) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (soloActivos != null && !soloActivos.isBlank()) {
            where.append(" AND u.activo = ? ");
            params.add(Integer.parseInt(soloActivos));
        }
        if (idRol != null) {
            where.append(" AND u.id_rol = ? ");
            params.add(idRol);
        }
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM usuario u " + where, Long.class, params.toArray());
        return c == null ? 0 : c;
    }

    public List<Map<String, Object>> roles() {
        return jdbc.queryForList("SELECT id, nombre FROM rol ORDER BY id");
    }

    /** Crea usuario+persona vía sp_crear_usuario; lanza BusinessException con el mensaje del SP. */
    public int crear(String nombre, String apellidos, String dni, String celular,
                     String usuario, String contrasenaHashed, Integer idRol, int userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbc)
                .withCatalogName("proyecto_marcos_web")
                .withProcedureName("sp_crear_usuario");
        Map<String, Object> in = new HashMap<>();
        in.put("p_nombre", nombre);
        in.put("p_apellidos", apellidos);
        in.put("p_dni", dni);
        in.put("p_celular", celular);
        in.put("p_usuario", usuario);
        in.put("p_contrasena", contrasenaHashed);
        in.put("p_id_rol", idRol);
        in.put("p_id_usuario_audit", userId);
        Map<String, Object> out;
        try {
            out = call.execute(in);
        } catch (DataAccessException e) {
            System.err.println("[usuarios] crear fallo: " + e.getMessage());
            if (e.getMostSpecificCause() != null) {
                System.err.println("[usuarios] causa: " + e.getMostSpecificCause().getMessage());
            }
            throw new BusinessException(friendlyDbMessage(e));
        }
        Object id = getOut(out, "p_usuario_id");
        if (id == null) {
            id = firstOutParam(out);
        }
        return ((Number) id).intValue();
    }

    public void actualizar(int id, Map<String, Object> personaData, Map<String, Object> usuarioData, int userId) {
        List<Map<String, Object>> user = jdbc.queryForList(SELECT_FULL + " WHERE u.id = ?", id);
        if (user.isEmpty()) {
            throw new BusinessException("El usuario no existe");
        }
        Object idPersona = user.get(0).get("id_persona");
        if (idPersona != null && !personaData.isEmpty()) {
            StringBuilder sql = new StringBuilder("UPDATE persona SET ");
            List<Object> params = new ArrayList<>();
            boolean first = true;
            for (Map.Entry<String, Object> e : personaData.entrySet()) {
                if (!first) sql.append(", ");
                sql.append("`").append(e.getKey()).append("` = ?");
                params.add(e.getValue());
                first = false;
            }
            sql.append(" WHERE id = ?");
            params.add(idPersona);
            jdbc.update(sql.toString(), params.toArray());
        }
        if (!usuarioData.isEmpty()) {
            StringBuilder sql = new StringBuilder("UPDATE usuario SET ");
            List<Object> params = new ArrayList<>();
            boolean first = true;
            for (Map.Entry<String, Object> e : usuarioData.entrySet()) {
                if (!first) sql.append(", ");
                sql.append("`").append(e.getKey()).append("` = ?");
                params.add(e.getValue());
                first = false;
            }
            sql.append(" WHERE id = ?");
            params.add(id);
            jdbc.update(sql.toString(), params.toArray());
        }
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('usuario', 'update', ?, ?, ?, NOW())", userId, id, "Actualización de usuario id=" + id);
    }

    public void desactivar(int id, int userId) {
        jdbc.update("UPDATE usuario SET activo = 0, token_ver = token_ver + 1 WHERE id = ?", id);
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('usuario', 'delete', ?, ?, ?, NOW())", userId, id, "Desactivación de usuario id=" + id);
    }

    public void activar(int id, int userId) {
        jdbc.update("UPDATE usuario SET activo = 1 WHERE id = ?", id);
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('usuario', 'update', ?, ?, ?, NOW())", userId, id, "Activación de usuario id=" + id);
    }

    public Map<String, Object> obtener(int id) {
        List<Map<String, Object>> rows = jdbc.queryForList(SELECT_FULL + " WHERE u.id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private String friendlyDbMessage(DataAccessException e) {
        String msg = e.getMostSpecificCause() != null
                ? e.getMostSpecificCause().getMessage()
                : e.getMessage();
        if (msg != null && (msg.contains("ya existe") || msg.contains("El DNI es obligatorio") || msg.contains("obligatorio"))) {
            return msg.replaceAll("\\s+", " ").trim();
        }
        if (msg != null && msg.contains("Duplicate entry")) {
            return "El usuario o DNI ya está registrado";
        }
        return "No se pudo crear el usuario";
    }

    private Object getOut(Map<String, Object> out, String name) {
        if (out != null) {
            for (Map.Entry<String, Object> e : out.entrySet()) {
                if (e.getKey().equalsIgnoreCase(name)) {
                    return e.getValue();
                }
            }
        }
        return null;
    }

    private Object firstOutParam(Map<String, Object> out) {
        if (out != null) {
            for (Object v : out.values()) {
                if (v instanceof Number || v instanceof String) {
                    return v;
                }
            }
        }
        return null;
    }
}