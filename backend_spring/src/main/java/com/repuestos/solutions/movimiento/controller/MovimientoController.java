package com.repuestos.solutions.movimiento.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.movimiento.service.MovimientoService;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Movimientos de inventario: registro (roles 1, 2 o 3).
 */
@RestController
@RequestMapping("/api/v1/movimientos")
public class MovimientoController {

    private final MovimientoService service;

    public MovimientoController(MovimientoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        String tipo = body.get("tipo") != null ? String.valueOf(body.get("tipo")) : null;
        Integer cantidad = body.get("cantidad") instanceof Number n ? n.intValue() : null;
        Integer idInventario = body.get("id_inventario") instanceof Number n ? n.intValue() : null;
        String observacion = body.get("observacion") != null ? String.valueOf(body.get("observacion")) : null;
        try {
            Map<String, Object> result = service.registrar(tipo, cantidad, idInventario, observacion,
                    SecurityUtil.currentUserId());
            return ApiResponse.success(result, "Movimiento registrado correctamente", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}