package com.repuestos.solutions.reporte.repository;

import com.repuestos.solutions.common.BusinessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de ReporteRepository (reporte_repo.py): valor de inventario, resúmenes,
 * tasa de cambio, historial de movimientos y reportes de daño.
 */
@Repository
public class ReporteRepository {

    private static final String[] MESES = {"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"};

    private final JdbcTemplate jdbc;

    public ReporteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> valorInventario() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT COALESCE(SUM(valor_compra), 0) AS valor_compra,
                       COALESCE(SUM(valor_venta), 0) AS valor_venta,
                       COALESCE(SUM(utilidad_potencial), 0) AS utilidad_potencial,
                       COUNT(DISTINCT id_inventario) AS total_productos
                  FROM v_valor_inventario
                """);
        if (rows.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("valor_compra", 0);
            empty.put("valor_venta", 0);
            empty.put("utilidad_potencial", 0);
            empty.put("total_productos", 0);
            return empty;
        }
        return rows.get(0);
    }

    public List<Map<String, Object>> movimientosResumen(String fechaDesde, String fechaHasta) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (fechaDesde != null && !fechaDesde.isBlank()) {
            where.append(" AND fecha_hora >= ? ");
            params.add(fechaDesde + " 00:00:00");
        }
        if (fechaHasta != null && !fechaHasta.isBlank()) {
            where.append(" AND fecha_hora <= ? ");
            params.add(fechaHasta + " 23:59:59");
        }
        return jdbc.queryForList("""
                SELECT tipo, COUNT(*) AS total_movimientos, COALESCE(SUM(cantidad), 0) AS cantidad_total
                  FROM movimiento_inventario
                """ + where + " GROUP BY tipo", params.toArray());
    }

    /** periodo: "YYYY-MM". Devuelve {total_ventas, variacion} vs. mes anterior. */
    public Map<String, Object> ventasResumen(String periodo) {
        double actual = 0;
        if (periodo != null && periodo.matches("\\d{4}-\\d{2}")) {
            actual = sumVentasPeriodo(periodo);
        }
        double previo = 0;
        String previoPeriodo = periodoAnterior(periodo);
        if (previoPeriodo != null) {
            previo = sumVentasPeriodo(previoPeriodo);
        }
        double variacion = 0;
        if (previo > 0) {
            variacion = Math.round(((actual - previo) / previo) * 1000.0) / 10.0;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_ventas", actual);
        result.put("variacion", variacion);
        return result;
    }

    private double sumVentasPeriodo(String yyyyMm) {
        Double s = jdbc.queryForObject(
                "SELECT COALESCE(SUM(precio_final), 0) FROM venta WHERE DATE_FORMAT(fecha_hora, '%Y-%m') = ?",
                Double.class, yyyyMm);
        return s == null ? 0 : s;
    }

    private String periodoAnterior(String yyyyMm) {
        if (yyyyMm == null || !yyyyMm.matches("\\d{4}-\\d{2}")) {
            return null;
        }
        int year = Integer.parseInt(yyyyMm.substring(0, 4));
        int month = Integer.parseInt(yyyyMm.substring(5, 7));
        month--;
        if (month == 0) {
            month = 12;
            year--;
        }
        return String.format("%04d-%02d", year, month);
    }

    /** Evolución mensual de ventas por moneda. Devuelve 12 filas {mes, etiqueta, total}. */
    public List<Map<String, Object>> evolucionVentas(int anio, String moneda) {
        String mon = (moneda == null || moneda.isBlank()) ? "$" : moneda;
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT MONTH(fecha_hora) AS mes, COALESCE(SUM(precio_final), 0) AS total
                  FROM venta
                 WHERE YEAR(fecha_hora) = ? AND moneda = ?
                 GROUP BY MONTH(fecha_hora)
                """, anio, mon);
        Map<Integer, Object> totalPorMes = new LinkedHashMap<>();
        for (Map<String, Object> r : rows) {
            int mes = ((Number) r.get("mes")).intValue();
            totalPorMes.put(mes, r.get("total"));
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mes", i);
            m.put("etiqueta", MESES[i - 1]);
            m.put("total", totalPorMes.getOrDefault(i, 0));
            result.add(m);
        }
        return result;
    }

    public Double getTasaCambio() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT valor FROM configuracion WHERE nombre = 'tasa_cambio' LIMIT 1");
        if (rows.isEmpty()) {
            return null;
        }
        return Double.valueOf(String.valueOf(rows.get(0).get("valor")));
    }

    public void setTasaCambio(double tasa, int userId) {
        jdbc.update("UPDATE configuracion SET valor = ?, actualizado_por = ?, actualizado_en = NOW() " +
                        "WHERE nombre = 'tasa_cambio'",
                String.valueOf(tasa), userId);
    }

    public List<Map<String, Object>> historial(String fechaDesde, String fechaHasta, String codigo,
                                               String disponibilidad, String orden, Integer usuarioId) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (fechaDesde != null && !fechaDesde.isBlank()) {
            where.append(" AND m.fecha_hora >= ? ");
            params.add(fechaDesde + " 00:00:00");
        }
        if (fechaHasta != null && !fechaHasta.isBlank()) {
            where.append(" AND m.fecha_hora <= ? ");
            params.add(fechaHasta + " 23:59:59");
        }
        if (codigo != null && !codigo.isBlank()) {
            where.append(" AND p.codigo LIKE ? ");
            params.add("%" + codigo + "%");
        }
        if (disponibilidad != null) {
            switch (disponibilidad) {
                case "disponible" -> where.append(" AND i.stock_actual > i.stock_minimo ");
                case "agotado" -> where.append(" AND i.stock_actual <= 0 ");
                case "bajo_stock" -> where.append(" AND i.stock_actual > 0 AND i.stock_actual <= i.stock_minimo ");
                default -> { }
            }
        }
        if (usuarioId != null) {
            where.append(" AND m.id_usuario = ? ");
            params.add(usuarioId);
        }
        String dir = "asc".equalsIgnoreCase(orden) ? "ASC" : "DESC";
        String sql = """
                SELECT m.id, m.fecha_hora, m.cantidad, m.observacion, m.tipo AS movimiento,
                       p.codigo, p.nombre, mg.nombre AS marca,
                       i.stock_actual,
                       COALESCE(CONCAT(pe.nombre, ' ', pe.apellidos), u.usuario) AS usuario_completo
                  FROM movimiento_inventario m
                  JOIN inventario i ON i.id = m.id_inventario
                  JOIN producto p ON p.id = i.id_producto
                  LEFT JOIN marca mg ON mg.id = p.id_marca
                  LEFT JOIN usuario u ON u.id = m.id_usuario
                  LEFT JOIN persona pe ON pe.id = u.id_persona
                """ + where + " ORDER BY m.fecha_hora " + dir + ", m.id " + dir;
        return jdbc.queryForList(sql, params.toArray());
    }

    /** Registra la baja por daño (movimiento salida + reporte_dano) dentro de la transacción del servicio. */
    public Map<String, Object> reportarDano(int idInventario, int cantidad, String descripcion,
                                            String evidenciaUrl, int userId) {
        List<Map<String, Object>> inv = jdbc.queryForList(
                "SELECT stock_actual FROM inventario WHERE id = ? FOR UPDATE", idInventario);
        if (inv.isEmpty()) {
            throw new BusinessException("El registro de inventario no existe");
        }
        int stock = ((Number) inv.get(0).get("stock_actual")).intValue();
        if (stock < cantidad) {
            throw new BusinessException("Stock insuficiente. Disponible: " + stock);
        }
        jdbc.update("UPDATE inventario SET stock_actual = stock_actual - ? WHERE id = ?", cantidad, idInventario);
        String obs = "Daño de " + cantidad + " unidades";
        if (descripcion != null && !descripcion.isBlank()) {
            obs += " - " + descripcion;
        }
        jdbc.update("INSERT INTO movimiento_inventario (tipo, cantidad, observacion, id_usuario, id_inventario) " +
                        "VALUES ('salida', ?, ?, ?, ?)",
                cantidad, obs, userId, idInventario);
        int idMovimiento = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        jdbc.update("INSERT INTO reporte_dano (id_inventario, id_movimiento, cantidad, descripcion, evidencia_url, id_usuario) " +
                        "VALUES (?, ?, ?, ?, ?, ?)",
                idInventario, idMovimiento, cantidad, descripcion, evidenciaUrl, userId);
        int idReporte = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);

        List<Map<String, Object>> prod = jdbc.queryForList(
                "SELECT p.codigo AS producto_codigo, p.nombre AS producto_nombre " +
                        "FROM inventario i JOIN producto p ON p.id = i.id_producto WHERE i.id = ?", idInventario);
        String codigo = prod.isEmpty() ? null : str(prod.get(0).get("producto_codigo"));
        String nombre = prod.isEmpty() ? null : str(prod.get(0).get("producto_nombre"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", idReporte);
        result.put("id_movimiento", idMovimiento);
        result.put("producto_codigo", codigo);
        result.put("producto_nombre", nombre);
        result.put("cantidad", cantidad);
        return result;
    }

    public List<Map<String, Object>> listarDanos(String fechaDesde, String fechaHasta, int page, int perPage) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (fechaDesde != null && !fechaDesde.isBlank()) {
            where.append(" AND r.fecha >= ? ");
            params.add(fechaDesde + " 00:00:00");
        }
        if (fechaHasta != null && !fechaHasta.isBlank()) {
            where.append(" AND r.fecha <= ? ");
            params.add(fechaHasta + " 23:59:59");
        }
        int offset = (page - 1) * perPage;
        params.add(perPage);
        params.add(offset);
        String sql = """
                SELECT r.id, r.fecha, r.cantidad, r.descripcion, r.evidencia_url,
                       p.codigo AS producto_codigo, p.nombre AS producto_nombre,
                       CONCAT(pe.nombre, ' ', pe.apellidos) AS usuario_nombre
                  FROM reporte_dano r
                  JOIN inventario i ON i.id = r.id_inventario
                  JOIN producto p ON p.id = i.id_producto
                  LEFT JOIN usuario u ON u.id = r.id_usuario
                  LEFT JOIN persona pe ON pe.id = u.id_persona
                """ + where + " ORDER BY r.fecha DESC, r.id DESC LIMIT ? OFFSET ?";
        return jdbc.queryForList(sql, params.toArray());
    }

    public long contarDanos(String fechaDesde, String fechaHasta) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (fechaDesde != null && !fechaDesde.isBlank()) {
            where.append(" AND r.fecha >= ? ");
            params.add(fechaDesde + " 00:00:00");
        }
        if (fechaHasta != null && !fechaHasta.isBlank()) {
            where.append(" AND r.fecha <= ? ");
            params.add(fechaHasta + " 23:59:59");
        }
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM reporte_dano r " + where, Long.class, params.toArray());
        return c == null ? 0 : c;
    }

    private String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}