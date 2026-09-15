package com.repuestos.solutions.producto.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de ProductoRepository (producto_repo.py).
 * - Listar/contar/obtener con SELECT_FULL (joins a marca, categoria, inventario, proveedor, etc.)
 * - Crear/actualizar mediante stored procedures (sp_crear_producto, sp_registrar_producto, sp_actualizar_producto)
 * - Soft delete (activo=0) con auditoría
 */
@Repository
public class ProductoRepository {

    private static final String SELECT_FULL = """
            SELECT p.*,
                   m.nombre AS marca_nombre,
                   c.nombre AS categoria_nombre,
                   pp.id_proveedor AS id_proveedor,
                   pr.nombre AS proveedor_nombre,
                   COALESCE(
                       (SELECT GROUP_CONCAT(m2.nombre ORDER BY m2.id SEPARATOR ', ')
                          FROM producto_marca pm
                          JOIN marca m2 ON m2.id = pm.id_marca
                         WHERE pm.id_producto = p.id),
                       m.nombre) AS marcas_nombres,
                   inv.id AS id_inventario,
                   inv.stock_actual,
                   inv.stock_minimo,
                   inv.id_estado_producto,
                   ep.nombre AS estado_nombre,
                   inv.id_ubicacion,
                   ub.ubicacion AS ubicacion_nombre
            FROM producto p
            LEFT JOIN marca m ON m.id = p.id_marca
            LEFT JOIN categoria c ON c.id = p.id_categoria
            LEFT JOIN (
                SELECT id_producto, MIN(id_proveedor) AS id_proveedor
                FROM producto_proveedor GROUP BY id_producto
            ) pp ON pp.id_producto = p.id
            LEFT JOIN proveedor pr ON pr.id = pp.id_proveedor
            LEFT JOIN inventario inv ON inv.id_producto = p.id
            LEFT JOIN estado_producto ep ON ep.id = inv.id_estado_producto
            LEFT JOIN ubicacion ub ON ub.id = inv.id_ubicacion
            """;

    private final JdbcTemplate jdbc;

    public ProductoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> listar(String busqueda, Integer idMarca, Integer idCategoria,
                                            int page, int perPage) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE p.activo = 1 ");
        if (busqueda != null && !busqueda.isBlank()) {
            where.append(" AND (p.nombre LIKE ? OR p.codigo LIKE ?) ");
            params.add("%" + busqueda + "%");
            params.add("%" + busqueda + "%");
        }
        if (idMarca != null) {
            where.append(" AND p.id_marca = ? ");
            params.add(idMarca);
        }
        if (idCategoria != null) {
            where.append(" AND p.id_categoria = ? ");
            params.add(idCategoria);
        }
        int offset = (page - 1) * perPage;
        params.add(perPage);
        params.add(offset);
        String sql = SELECT_FULL + where + " ORDER BY p.id DESC LIMIT ? OFFSET ?";
        List<Map<String, Object>> rows = jdbc.queryForList(sql, params.toArray());
        for (Map<String, Object> row : rows) {
            attachMarcas(row, Collections.singletonList(Long.valueOf(((Number) row.get("id")).longValue())));
            attachProveedores(row);
        }
        return rows;
    }

    public long contar(String busqueda, Integer idMarca, Integer idCategoria) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        where.append(" AND p.activo = 1 ");
        if (busqueda != null && !busqueda.isBlank()) {
            where.append(" AND (p.nombre LIKE ? OR p.codigo LIKE ?) ");
            params.add("%" + busqueda + "%");
            params.add("%" + busqueda + "%");
        }
        if (idMarca != null) {
            where.append(" AND p.id_marca = ? ");
            params.add(idMarca);
        }
        if (idCategoria != null) {
            where.append(" AND p.id_categoria = ? ");
            params.add(idCategoria);
        }
        String sql = "SELECT COUNT(*) FROM producto p " + where;
        Long c = jdbc.queryForObject(sql, Long.class, params.toArray());
        return c == null ? 0 : c;
    }

    public Map<String, Object> obtener(int id) {
        List<Map<String, Object>> rows = jdbc.queryForList(SELECT_FULL + " WHERE p.id = ?", id);
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, Object> row = rows.get(0);
        attachMarcas(row, Collections.singletonList((long) id));
        attachProveedores(row);
        return row;
    }

    private void attachProveedores(Map<String, Object> row) {
        long id = ((Number) row.get("id")).longValue();
        List<Map<String, Object>> provs = jdbc.queryForList(
                "SELECT pr.id, pr.nombre FROM producto_proveedor pp " +
                        "JOIN proveedor pr ON pr.id = pp.id_proveedor WHERE pp.id_producto = ? ORDER BY pr.id", id);
        row.put("proveedores", provs);
    }

    private void attachMarcas(Map<String, Object> row, java.util.Collection<Long> ids) {
        // marcas N:M
        long id = ((Number) row.get("id")).longValue();
        List<Map<String, Object>> marcas = jdbc.queryForList(
                "SELECT m.id, m.nombre FROM producto_marca pm JOIN marca m ON m.id = pm.id_marca " +
                        "WHERE pm.id_producto = ? ORDER BY m.id", id);
        row.put("marcas", marcas);
    }

    /** Convierte una fila a dict estilo Producto.to_dict() (excluye nulls, decimal->float). */
    public Map<String, Object> toDict(Map<String, Object> row) {
        Map<String, Object> d = new LinkedHashMap<>();
        putIfNotNull(d, "id", row.get("id"));
        putIfNotNull(d, "nombre", row.get("nombre"));
        putIfNotNull(d, "codigo", row.get("codigo"));
        putDec(d, "precio_compra", row.get("precio_compra"));
        putDec(d, "precio_venta", row.get("precio_venta"));
        putDec(d, "utilidad", row.get("utilidad"));
        putIfNotNull(d, "imagen_url", row.get("imagen_url"));
        putIfNotNull(d, "id_marca", row.get("id_marca"));
        putIfNotNull(d, "id_categoria", row.get("id_categoria"));
        putIfNotNull(d, "marca_nombre", row.get("marca_nombre"));
        putIfNotNull(d, "categoria_nombre", row.get("categoria_nombre"));
        putIfNotNull(d, "proveedor_nombre", row.get("proveedor_nombre"));
        putIfNotNull(d, "proveedores", row.get("proveedores"));
        putIfNotNull(d, "marcas_nombres", row.get("marcas_nombres"));
        putIfNotNull(d, "marcas", row.get("marcas"));
        putIfNotNull(d, "id_inventario", row.get("id_inventario"));
        putIfNotNull(d, "stock_actual", row.get("stock_actual"));
        putIfNotNull(d, "stock_minimo", row.get("stock_minimo"));
        putIfNotNull(d, "id_estado_producto", row.get("id_estado_producto"));
        putIfNotNull(d, "estado_nombre", row.get("estado_nombre"));
        putIfNotNull(d, "id_ubicacion", row.get("id_ubicacion"));
        putIfNotNull(d, "ubicacion_nombre", row.get("ubicacion_nombre"));
        return d;
    }

    private void putIfNotNull(Map<String, Object> d, String k, Object v) {
        if (v != null) {
            d.put(k, v);
        }
    }

    private void putDec(Map<String, Object> d, String k, Object v) {
        if (v != null) {
            d.put(k, ((Number) v).doubleValue());
        }
    }

    public int crear(Map<String, Object> data, int userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbc)
                .withCatalogName("proyecto_marcos_web")
                .withProcedureName("sp_crear_producto");
        Map<String, Object> in = new HashMap<>();
        in.put("p_nombre", data.get("nombre"));
        in.put("p_codigo", data.get("codigo"));
        in.put("p_precio_compra", data.get("precio_compra"));
        in.put("p_precio_venta", data.get("precio_venta"));
        in.put("p_utilidad", data.get("utilidad"));
        in.put("p_id_marca", data.get("id_marca"));
        in.put("p_id_categoria", data.get("id_categoria"));
        in.put("p_proveedores_json", jsonOrNull(data.get("id_proveedores")));
        in.put("p_marcas_json", jsonOrNull(data.get("id_marcas")));
        in.put("p_usuario_id", userId);
        Map<String, Object> out = call.execute(in);
        Object id = out.get("p_producto_id");
        // Fallback: nombre del parámetro de salida del SP
        if (id == null) {
            id = firstOutParam(out);
        }
        return ((Number) id).intValue();
    }

    public Map<String, Object> registrarCompleto(Map<String, Object> data, int userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbc)
                .withCatalogName("proyecto_marcos_web")
                .withProcedureName("sp_registrar_producto");
        Map<String, Object> in = new HashMap<>();
        in.put("p_nombre", data.get("nombre"));
        in.put("p_codigo", data.get("codigo"));
        in.put("p_precio_compra", data.get("precio_compra"));
        in.put("p_precio_venta", data.get("precio_venta"));
        in.put("p_id_marca", data.get("id_marca"));
        in.put("p_id_categoria", data.get("id_categoria"));
        in.put("p_proveedores_json", jsonOrNull(data.get("id_proveedores")));
        in.put("p_marcas_json", jsonOrNull(data.get("id_marcas")));
        in.put("p_stock_actual", data.getOrDefault("stock_actual", 0));
        in.put("p_stock_minimo", data.getOrDefault("stock_minimo", 0));
        in.put("p_ubicacion", data.get("ubicacion"));
        in.put("p_id_estado_producto", data.get("id_estado_producto"));
        in.put("p_usuario_id", userId);
        Map<String, Object> out = call.execute(in);
        Map<String, Object> result = new HashMap<>();
        result.put("producto_id", firstOutParam(out));
        return result;
    }

    public void actualizar(int id, Map<String, Object> data, int userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbc)
                .withCatalogName("proyecto_marcos_web")
                .withProcedureName("sp_actualizar_producto");
        Map<String, Object> in = new HashMap<>();
        in.put("p_id", id);
        in.put("p_nombre", data.get("nombre"));
        in.put("p_codigo", data.get("codigo"));
        in.put("p_precio_compra", data.get("precio_compra"));
        in.put("p_precio_venta", data.get("precio_venta"));
        in.put("p_id_marca", data.get("id_marca"));
        in.put("p_id_categoria", data.get("id_categoria"));
        in.put("p_proveedores_json", jsonOrNull(data.get("id_proveedores")));
        in.put("p_marcas_json", jsonOrNull(data.get("id_marcas")));
        in.put("p_usuario_id", userId);
        call.execute(in);
    }

    public void softDelete(int id, int userId) {
        jdbc.update("UPDATE producto SET activo = 0 WHERE id = ?", id);
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('producto', 'delete', ?, ?, ?, NOW())", userId, id, "Soft delete: producto id=" + id);
    }

    public void insertMovimientoEntrada(int inventarioId, int cantidad, int userId, String observacion) {
        if (cantidad <= 0) {
            return;
        }
        jdbc.update("INSERT INTO movimiento_inventario (tipo, cantidad, observacion, id_usuario, id_inventario) " +
                        "VALUES ('entrada', ?, ?, ?, ?)",
                cantidad, observacion, userId, inventarioId);
    }

    public void actualizarCampo(int id, String campo, Object valor) {
        jdbc.update("UPDATE producto SET `" + campo + "` = ? WHERE id = ?", valor, id);
    }

    private Object firstOutParam(Map<String, Object> out) {
        for (Object v : out.values()) {
            if (v instanceof Number || v instanceof String) {
                return v;
            }
        }
        return null;
    }

    private String jsonOrNull(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof java.util.Collection<?> col) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object o : col) {
                if (o instanceof Number n && !(o instanceof Boolean)) {
                    if (!first) {
                        sb.append(",");
                    }
                    sb.append(n.intValue());
                    first = false;
                }
            }
            sb.append("]");
            return sb.toString();
        }
        if (v.getClass().isArray()) {
            int len = java.lang.reflect.Array.getLength(v);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < len; i++) {
                Object o = java.lang.reflect.Array.get(v, i);
                if (o instanceof Number n && !(o instanceof Boolean)) {
                    if (i > 0) {
                        sb.append(",");
                    }
                    sb.append(n.intValue());
                }
            }
            sb.append("]");
            return sb.toString();
        }
        if (v instanceof Number n && !(v instanceof Boolean)) {
            return "[" + n.intValue() + "]";
        }
        return null;
    }
}
