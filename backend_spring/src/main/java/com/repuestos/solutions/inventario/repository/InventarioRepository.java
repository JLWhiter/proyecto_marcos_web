package com.repuestos.solutions.inventario.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de InventarioRepository (inventario_repo.py).
 * Lista el inventario con joins a producto/marca/proveedor/estado/ubicación.
 */
@Repository
public class InventarioRepository {

    private static final String SELECT_FULL = """
            SELECT inv.id AS id_inventario,
                   inv.id,
                   p.id AS id_producto,
                   p.codigo AS producto_codigo,
                   p.nombre AS producto_nombre,
                   p.id_marca,
                   m.nombre AS marca_nombre,
                   c.nombre AS categoria_nombre,
                   pp.id_proveedor,
                   pr.nombre AS proveedor_nombre,
                   inv.id_estado_producto,
                   ep.nombre AS estado_nombre,
                   inv.id_ubicacion,
                   ub.ubicacion AS ubicacion_nombre,
                   inv.stock_actual,
                   inv.stock_minimo,
                   p.precio_compra,
                   p.precio_venta
              FROM inventario inv
              JOIN producto p ON p.id = inv.id_producto
              LEFT JOIN marca m ON m.id = p.id_marca
              LEFT JOIN categoria c ON c.id = p.id_categoria
              LEFT JOIN (SELECT id_producto, MIN(id_proveedor) AS id_proveedor
                           FROM producto_proveedor GROUP BY id_producto) pp ON pp.id_producto = p.id
              LEFT JOIN proveedor pr ON pr.id = pp.id_proveedor
              LEFT JOIN estado_producto ep ON ep.id = inv.id_estado_producto
              LEFT JOIN ubicacion ub ON ub.id = inv.id_ubicacion
            """;

    private final JdbcTemplate jdbc;

    public InventarioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> listar(String q, Integer stockMax, int page, int perPage) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (q != null && !q.isBlank()) {
            where.append(" AND (p.nombre LIKE ? OR p.codigo LIKE ? OR m.nombre LIKE ?) ");
            params.add("%" + q + "%");
            params.add("%" + q + "%");
            params.add("%" + q + "%");
        }
        if (stockMax != null) {
            where.append(" AND inv.stock_actual <= ? ");
            params.add(stockMax);
        }
        int offset = (page - 1) * perPage;
        params.add(perPage);
        params.add(offset);
        String sql = SELECT_FULL + where + " ORDER BY p.nombre ASC LIMIT ? OFFSET ?";
        List<Map<String, Object>> rows = jdbc.queryForList(sql, params.toArray());
        for (Map<String, Object> row : rows) {
            row.put("id", row.get("id_producto"));
        }
        return rows;
    }

    public long contar(String q, Integer stockMax) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (q != null && !q.isBlank()) {
            where.append(" AND (p.nombre LIKE ? OR p.codigo LIKE ? OR m.nombre LIKE ?) ");
            params.add("%" + q + "%");
            params.add("%" + q + "%");
            params.add("%" + q + "%");
        }
        if (stockMax != null) {
            where.append(" AND inv.stock_actual <= ? ");
            params.add(stockMax);
        }
        String sql = "SELECT COUNT(*) FROM inventario inv " +
                "JOIN producto p ON p.id = inv.id_producto " +
                "LEFT JOIN marca m ON m.id = p.id_marca " + where;
        Long c = jdbc.queryForObject(sql, Long.class, params.toArray());
        return c == null ? 0 : c;
    }

    public Map<String, Object> obtener(int id) {
        List<Map<String, Object>> rows = jdbc.queryForList(SELECT_FULL + " WHERE inv.id = ?", id);
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, Object> row = rows.get(0);
        row.put("id", row.get("id_producto"));
        return row;
    }

    public void actualizar(int id, Map<String, Object> data, int userId) {
        List<String> cols = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        for (Map.Entry<String, Object> e : data.entrySet()) {
            cols.add("`" + e.getKey() + "` = ?");
            params.add(e.getValue());
        }
        if (!cols.isEmpty()) {
            params.add(id);
            jdbc.update("UPDATE inventario SET " + String.join(", ", cols) + " WHERE id = ?", params.toArray());
        }
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('inventario', 'update', ?, ?, ?, NOW())", userId, id, "Actualización de inventario id=" + id);
    }

    public List<Map<String, Object>> bajoStock() {
        return jdbc.queryForList("""
                SELECT codigo, producto, marca, categoria, stock_actual, stock_minimo, estado, ubicacion
                  FROM v_stock_general
                 WHERE alerta = 1
                 ORDER BY producto
                """);
    }

    public Integer stockDeProducto(int idProducto) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, stock_actual FROM inventario WHERE id_producto = ? LIMIT 1", idProducto);
        if (rows.isEmpty()) {
            return null;
        }
        Object stock = rows.get(0).get("stock_actual");
        return stock == null ? null : ((Number) stock).intValue();
    }
}