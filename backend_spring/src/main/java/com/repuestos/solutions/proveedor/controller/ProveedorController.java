package com.repuestos.solutions.proveedor.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.proveedor.service.ProveedorService;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Proveedores: GET lista (cualquier rol), POST crear (rol 1, 2 o 3).
 */
@RestController
@RequestMapping("/api/v1/proveedores")
public class ProveedorController {

    private final ProveedorService service;

    public ProveedorController(ProveedorService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ApiResponse.success(service.listar(), "Proveedores obtenidos");
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        Object nombre = body.get("nombre");
        if (nombre == null || String.valueOf(nombre).isBlank()) {
            return ApiResponse.error("El nombre del proveedor es obligatorio", HttpStatus.BAD_REQUEST);
        }
        String name = String.valueOf(nombre).trim();
        if (name.length() > 100) {
            return ApiResponse.error("El nombre no puede superar 100 caracteres", HttpStatus.BAD_REQUEST);
        }
        String ruc = null;
        if (body.get("ruc") != null && !String.valueOf(body.get("ruc")).isBlank()) {
            ruc = String.valueOf(body.get("ruc")).trim();
            if (ruc.length() > 11) {
                return ApiResponse.error("El RUC no puede superar 11 caracteres", HttpStatus.BAD_REQUEST);
            }
        }
        try {
            return ApiResponse.success(service.crear(name, ruc), "Proveedor creado", HttpStatus.CREATED);
        } catch (DuplicateKeyException e) {
            return ApiResponse.error("Ya existe un proveedor con ese RUC", HttpStatus.BAD_REQUEST);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}