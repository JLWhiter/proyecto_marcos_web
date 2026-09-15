package com.repuestos.solutions.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de las utilidades de respuesta del backend Flask original
 * (success_response / error_response / paginated_response).
 */
public final class ApiResponse {

    private ApiResponse() {
    }

    public static ResponseEntity<Map<String, Object>> success(Object data, String mensaje, HttpStatus status) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", true);
        payload.put("mensaje", mensaje);
        if (data != null) {
            payload.put("data", data);
        }
        return new ResponseEntity<>(payload, status);
    }

    public static ResponseEntity<Map<String, Object>> success(Object data, String mensaje) {
        return success(data, mensaje, HttpStatus.OK);
    }

    public static ResponseEntity<Map<String, Object>> success(String mensaje) {
        return success(null, mensaje, HttpStatus.OK);
    }

    public static ResponseEntity<Map<String, Object>> error(String mensaje, Object detalle, HttpStatus status) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", false);
        payload.put("error", mensaje);
        if (detalle != null) {
            payload.put("detalle", detalle);
        }
        return new ResponseEntity<>(payload, status);
    }

    public static ResponseEntity<Map<String, Object>> error(String mensaje, HttpStatus status) {
        return error(mensaje, null, status);
    }

    public static ResponseEntity<Map<String, Object>> error(String mensaje) {
        return error(mensaje, null, HttpStatus.BAD_REQUEST);
    }

    public static ResponseEntity<Map<String, Object>> paginated(
            List<?> items, long total, int page, int perPage, String mensaje) {
        int pages = perPage > 0 ? (int) Math.ceil((double) total / perPage) : 1;
        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("total", total);
        pagination.put("page", page);
        pagination.put("per_page", perPage);
        pagination.put("pages", pages);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", true);
        payload.put("mensaje", mensaje);
        payload.put("data", items);
        payload.put("pagination", pagination);
        return new ResponseEntity<>(payload, HttpStatus.OK);
    }

    public static BigDecimal money(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }
}
