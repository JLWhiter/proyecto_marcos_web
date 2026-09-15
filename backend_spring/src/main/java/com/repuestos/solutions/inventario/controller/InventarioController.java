package com.repuestos.solutions.inventario.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.inventario.service.InventarioService;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Inventario: listado y actualización (admin = 1); realizar bajos stock para todos los roles.
 */
@RestController
@RequestMapping("/api/v1/inventario")
public class InventarioController {

    private final InventarioService service;

    public InventarioController(InventarioService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "100") int per_page,
                                    @RequestParam(required = false) String q,
                                    @RequestParam(required = false) Integer stock) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.listar(q, stock, page, per_page), "Inventario obtenido");
    }

    @GetMapping("/bajo-stock")
    public ResponseEntity<?> bajoStock() {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.bajoStock(), "Productos bajo stock");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable int id) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            return ApiResponse.success(service.obtener(id), "Inventario obtenido");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            service.actualizar(id, body, SecurityUtil.currentUserId());
            return ApiResponse.success(null, "Inventario actualizado correctamente");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }
}