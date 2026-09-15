package com.repuestos.solutions.catalogo.controller;

import com.repuestos.solutions.catalogo.service.CatalogoService;
import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Catálogos: marcas, categorías, estados de producto y tipos de documento.
 * GET -> cualquier rol autenticado. POST (marca/categoría) -> rol 1, 2 o 3.
 */
@RestController
@RequestMapping("/api/v1")
public class CatalogoController {

    private final CatalogoService service;

    public CatalogoController(CatalogoService service) {
        this.service = service;
    }

    @GetMapping("/marcas")
    public ResponseEntity<?> listarMarcas() {
        return ApiResponse.success(service.listarMarcas(), "Marcas obtenidas");
    }

    @PostMapping("/marcas")
    public ResponseEntity<?> crearMarca(@RequestBody Map<String, Object> body) {
        ResponseEntity<?> forbidden = requireSupervisorOrAdmin();
        if (forbidden != null) {
            return forbidden;
        }
        Object nombre = body.get("nombre");
        if (nombre == null || String.valueOf(nombre).isBlank()) {
            return ApiResponse.error("El nombre de la marca es obligatorio", HttpStatus.BAD_REQUEST);
        }
        String name = String.valueOf(nombre).trim();
        if (name.length() > 100) {
            return ApiResponse.error("El nombre no puede superar 100 caracteres", HttpStatus.BAD_REQUEST);
        }
        return ApiResponse.success(service.crearMarca(name), "Marca creada", HttpStatus.CREATED);
    }

    @GetMapping("/categorias")
    public ResponseEntity<?> listarCategorias() {
        return ApiResponse.success(service.listarCategorias(), "Categorías obtenidas");
    }

    @PostMapping("/categorias")
    public ResponseEntity<?> crearCategoria(@RequestBody Map<String, Object> body) {
        ResponseEntity<?> forbidden = requireSupervisorOrAdmin();
        if (forbidden != null) {
            return forbidden;
        }
        Object nombre = body.get("nombre");
        if (nombre == null || String.valueOf(nombre).isBlank()) {
            return ApiResponse.error("El nombre de la categoría es obligatorio", HttpStatus.BAD_REQUEST);
        }
        String name = String.valueOf(nombre).trim();
        if (name.length() > 50) {
            return ApiResponse.error("El nombre no puede superar 50 caracteres", HttpStatus.BAD_REQUEST);
        }
        try {
            return ApiResponse.success(service.crearCategoria(name), "Categoría creada", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/estados-producto")
    public ResponseEntity<?> listarEstadosProducto() {
        return ApiResponse.success(service.listarEstadosProducto(), "Estados obtenidos");
    }

    @GetMapping("/tipos-documento")
    public ResponseEntity<?> listarTiposDocumento() {
        return ApiResponse.success(service.listarTiposDocumento(), "Tipos de documento obtenidos");
    }

    private ResponseEntity<?> requireSupervisorOrAdmin() {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return null;
    }
}