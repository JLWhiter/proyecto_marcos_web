package com.repuestos.solutions.movimiento.repository;

import com.repuestos.solutions.common.BusinessException;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Registro de movimientos de inventario mediante sp_registrar_movimiento.
 */
@Repository
public class MovimientoRepository {

    private final JdbcTemplate jdbc;

    public MovimientoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> registrar(String tipo, int cantidad, int idInventario,
                                         String observacion, int idUsuario) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbc)
                .withCatalogName("proyecto_marcos_web")
                .withProcedureName("sp_registrar_movimiento");
        Map<String, Object> in = new HashMap<>();
        in.put("p_tipo", tipo);
        in.put("p_cantidad", cantidad);
        in.put("p_id_inventario", idInventario);
        in.put("p_id_usuario", idUsuario);
        in.put("p_observacion", observacion);
        Map<String, Object> out;
        try {
            out = call.execute(in);
        } catch (DataAccessException e) {
            String msg = e.getMostSpecificCause() != null
                    ? e.getMostSpecificCause().getMessage()
                    : e.getMessage();
            if (msg != null && (msg.contains("Stock insuficiente") || msg.contains("no encontrado")
                    || msg.contains("invalido") || msg.contains("mayor a 0"))) {
                throw new BusinessException(msg.replaceAll("\\s+", " ").trim());
            }
            throw e;
        }
        Object idMov = getOut(out, "p_movimiento_id");
        Object nuevoStock = getOut(out, "p_nuevo_stock");
        if (idMov == null) {
            idMov = firstNumber(out);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", idMov);
        result.put("tipo", tipo);
        result.put("cantidad", cantidad);
        result.put("nuevo_stock", nuevoStock);
        return result;
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

    private Object firstNumber(Map<String, Object> out) {
        if (out != null) {
            for (Object v : out.values()) {
                if (v instanceof Number) {
                    return v;
                }
            }
        }
        return null;
    }
}