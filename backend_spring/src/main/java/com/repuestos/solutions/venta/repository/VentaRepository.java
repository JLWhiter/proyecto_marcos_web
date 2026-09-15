package com.repuestos.solutions.venta.repository;

import com.repuestos.solutions.common.BusinessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de VentaRepository (venta_repo.py).
 * El registro de venta descuenta stock (movimiento salida) y crea el cliente si aplica,
 * todo dentro de la transacción iniciada por VentaService.
 */
@Repository
public class VentaRepository {

    private static final String SELECT_FULL = """
            SELECT v.*,
                   p.codigo AS codigo_producto,
                   p.nombre AS nombre_producto,
                   mg.nombre AS marca,
                   td.nombre AS tipo_documento,
                   CONCAT(pe.nombre, ' ', pe.apellidos) AS vendedor_nombre,
                   CONCAT(pe.nombre, ' ', pe.apellidos) AS recepcionista
              FROM venta v
              JOIN producto p ON p.id = v.id_producto
              LEFT JOIN marca mg ON mg.id = p.id_marca
              LEFT JOIN tipo_documento td ON td.id = v.id_tipo_documento
              LEFT JOIN usuario u ON u.id = v.id_usuario
              LEFT JOIN persona pe ON pe.id = u.id_persona
            """;

    private final JdbcTemplate jdbc;

    public VentaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Registra la venta y el movimiento 'salida' (descuento de stock) atómicamente. */
    public int registrar(Map<String, Object> d, int userId) {
        Integer idProducto = d.get("id_producto") instanceof Number n ? n.intValue() : null;
        int cantidad = d.get("cantidad") instanceof Number n ? n.intValue() : 0;
        if (idProducto == null) {
            throw new BusinessException("El producto es obligatorio");
        }
        if (cantidad <= 0) {
            throw new BusinessException("La cantidad debe ser mayor a 0");
        }

        int idInventario = inventarioDeProducto(idProducto);

        List<Map<String, Object>> inv = jdbc.queryForList(
                "SELECT stock_actual FROM inventario WHERE id = ? FOR UPDATE", idInventario);
        if (inv.isEmpty()) {
            throw new BusinessException("El registro de inventario no existe");
        }
        int stock = ((Number) inv.get(0).get("stock_actual")).intValue();
        if (stock < cantidad) {
            throw new BusinessException("Stock insuficiente. Disponible: " + stock + ", solicitado: " + cantidad);
        }

        String tipoMov = "salida";
        jdbc.update("UPDATE inventario SET stock_actual = stock_actual - ? WHERE id = ?", cantidad, idInventario);
        jdbc.update("INSERT INTO movimiento_inventario (tipo, cantidad, observacion, id_usuario, id_inventario) " +
                        "VALUES (?, ?, ?, ?, ?)",
                tipoMov, cantidad, "Venta (descuento de stock)", userId, idInventario);
        int idMovimiento = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('movimiento_inventario', 'insert', ?, ?, ?, NOW())", userId, idMovimiento,
                "Venta: salida qty=" + cantidad + " inv=" + idInventario);

        Integer idCliente = resolverCliente(d);

        String nombreCliente = str(d.get("nombre_cliente"));
        String rucDni = str(d.get("ruc_dni"));
        String moneda = str(d.get("moneda"));
        if (moneda == null || moneda.isBlank()) {
            moneda = "$";
        }
        int plazos = (d.get("plazos") instanceof Number n) ? n.intValue() : 0;
        if (plazos < 0) plazos = 0;
        String estadoPago = plazos > 0 ? "pendiente" : "pagado";
        int costoEnvio = (d.get("costo_envio") instanceof Number n) ? n.intValue() : 0;

        jdbc.update("""
                INSERT INTO venta
                  (id_cliente, nombre_cliente, ruc_dni, id_producto, cantidad, moneda, tasa_cambio,
                   precio_unitario, precio_final, medio_pago, numero_documento, destino, agencia_devolucion,
                   punto_recogo, adicionales, id_tipo_documento, observaciones, costo_envio,
                   plazos, fecha_pago, cuotas_pagadas, estado_pago, id_usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                idCliente, nombreCliente, rucDni, idProducto, cantidad, moneda,
                dec(d.get("tasa_cambio"), 1),
                dec(d.get("precio_unitario"), 0),
                dec(d.get("precio_final"), 0),
                str(d.get("medio_pago")),
                str(d.get("numero_documento")),
                str(d.get("destino")),
                str(d.get("agencia_devolucion")),
                str(d.get("punto_recogo")),
                str(d.get("adicionales")),
                d.get("id_tipo_documento") instanceof Number n ? n.intValue() : null,
                str(d.get("observaciones")),
                costoEnvio,
                plazos,
                str(d.get("fecha_pago")),
                0,
                estadoPago,
                userId);
        int idVenta = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        jdbc.update("INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora) " +
                "VALUES ('venta', 'insert', ?, ?, ?, NOW())", userId, idVenta,
                "Venta registrada (producto id=" + idProducto + ", qty=" + cantidad + ")");
        return idVenta;
    }

    public List<Map<String, Object>> listar(String estadoPago, String fechaDesde, String fechaHasta,
                                            int page, int perPage) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (estadoPago != null && !estadoPago.isBlank()) {
            where.append(" AND v.estado_pago = ? ");
            params.add(estadoPago);
        }
        if (fechaDesde != null && !fechaDesde.isBlank()) {
            where.append(" AND v.fecha_hora >= ? ");
            params.add(fechaDesde + " 00:00:00");
        }
        if (fechaHasta != null && !fechaHasta.isBlank()) {
            where.append(" AND v.fecha_hora < ? ");
            params.add(fechaHasta + " 23:59:59");
        }
        int offset = (page - 1) * perPage;
        params.add(perPage);
        params.add(offset);
        String sql = SELECT_FULL + where + " ORDER BY v.fecha_hora DESC, v.id DESC LIMIT ? OFFSET ?";
        return jdbc.queryForList(sql, params.toArray());
    }

    public long contar(String estadoPago, String fechaDesde, String fechaHasta) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (estadoPago != null && !estadoPago.isBlank()) {
            where.append(" AND v.estado_pago = ? ");
            params.add(estadoPago);
        }
        if (fechaDesde != null && !fechaDesde.isBlank()) {
            where.append(" AND v.fecha_hora >= ? ");
            params.add(fechaDesde + " 00:00:00");
        }
        if (fechaHasta != null && !fechaHasta.isBlank()) {
            where.append(" AND v.fecha_hora < ? ");
            params.add(fechaHasta + " 23:59:59");
        }
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM venta v " + where, Long.class, params.toArray());
        return c == null ? 0 : c;
    }

    /** Incrementa cuotas o alterna el estado de pago. Devuelve {plazos, cuotas_pagadas, estado_pago}. */
    public Map<String, Object> cambiarEstadoPago(int id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT estado_pago, plazos, cuotas_pagadas FROM venta WHERE id = ?", id);
        if (rows.isEmpty()) {
            throw new BusinessException("La venta no existe");
        }
        Map<String, Object> row = rows.get(0);
        String estado = str(row.get("estado_pago"));
        int plazos = ((Number) row.get("plazos")).intValue();
        int cuotas = ((Number) row.get("cuotas_pagadas")).intValue();
        if ("pagado".equals(estado)) {
            jdbc.update("UPDATE venta SET estado_pago = 'pendiente' WHERE id = ?", id);
            estado = "pendiente";
        } else {
            cuotas++;
            String nuevoEstado = (plazos > 0 && cuotas >= plazos) ? "pagado" : "pendiente";
            jdbc.update("UPDATE venta SET cuotas_pagadas = ?, estado_pago = ? WHERE id = ?",
                    cuotas, nuevoEstado, id);
            estado = nuevoEstado;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.put("plazos", plazos);
        result.put("cuotas_pagadas", cuotas);
        result.put("estado_pago", estado);
        return result;
    }

    public Map<String, Object> actualizarVendedor(int id, int idUsuario) {
        List<Map<String, Object>> exists = jdbc.queryForList("SELECT id FROM venta WHERE id = ?", id);
        if (exists.isEmpty()) {
            throw new BusinessException("La venta no existe");
        }
        jdbc.update("UPDATE venta SET id_usuario = ? WHERE id = ?", idUsuario, id);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT CONCAT(pe.nombre, ' ', pe.apellidos) AS vendedor_nombre " +
                        "FROM venta v JOIN usuario u ON u.id = v.id_usuario " +
                        "LEFT JOIN persona pe ON pe.id = u.id_persona WHERE v.id = ?", id);
        String vendedor = rows.isEmpty() ? null : str(rows.get(0).get("vendedor_nombre"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id_usuario", idUsuario);
        result.put("vendedor_nombre", vendedor);
        return result;
    }

    public void actualizarFinanciero(int id, Map<String, Object> d) {
        List<Map<String, Object>> exists = jdbc.queryForList("SELECT id FROM venta WHERE id = ?", id);
        if (exists.isEmpty()) {
            throw new BusinessException("La venta no existe");
        }
        List<String> cols = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        if (d.get("moneda") != null) {
            cols.add("moneda = ?");
            params.add(str(d.get("moneda")));
        }
        if (d.get("tasa_cambio") instanceof Number n) {
            cols.add("tasa_cambio = ?");
            params.add(n.doubleValue());
        }
        if (d.get("precio_unitario") instanceof Number n) {
            cols.add("precio_unitario = ?");
            params.add(n.doubleValue());
        }
        if (d.get("precio_final") instanceof Number n) {
            cols.add("precio_final = ?");
            params.add(n.doubleValue());
        }
        if (cols.isEmpty()) {
            return;
        }
        params.add(id);
        jdbc.update("UPDATE venta SET " + String.join(", ", cols) + " WHERE id = ?", params.toArray());
    }

    private Integer resolverCliente(Map<String, Object> d) {
        String rucDni = str(d.get("ruc_dni"));
        String nombre = str(d.get("nombre_cliente"));
        if (rucDni == null || rucDni.isBlank()) {
            return null;
        }
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id FROM cliente WHERE ruc_dni = ? LIMIT 1", rucDni);
        if (!rows.isEmpty()) {
            return ((Number) rows.get(0).get("id")).intValue();
        }
        if (nombre != null && !nombre.isBlank()) {
            jdbc.update("INSERT INTO cliente (nombre, apellidos, ruc_dni) VALUES (?, NULL, ?)",
                    nombre, rucDni);
            return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        }
        return null;
    }

    private int inventarioDeProducto(int idProducto) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id FROM inventario WHERE id_producto = ? LIMIT 1", idProducto);
        if (rows.isEmpty()) {
            throw new BusinessException("El producto no tiene registro de inventario asociado");
        }
        return ((Number) rows.get(0).get("id")).intValue();
    }

    private Object dec(Object v, double def) {
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        return def;
    }

    private String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}