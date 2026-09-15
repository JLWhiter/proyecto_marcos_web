package com.repuestos.solutions.usuario.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.security.SecurityUtil;
import com.repuestos.solutions.usuario.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Gestión de usuarios (solo rol Administrador = 1).
 */
@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(defaultValue = "100") int per_page,
                                    @RequestParam(required = false) String solo_activos,
                                    @RequestParam(required = false) Integer id_rol,
                                    @RequestParam(defaultValue = "1") int page) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        int safePerPage = per_page > 0 ? per_page : 100;
        return ApiResponse.success(service.listar(solo_activos, id_rol, page, safePerPage), "Usuarios obtenidos");
    }

    @GetMapping("/roles")
    public ResponseEntity<?> roles() {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.roles(), "Roles obtenidos");
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            int id = service.crear(body, SecurityUtil.currentUserId());
            return ApiResponse.success(Map.of("id", id, "usuario", body.get("usuario")),
                    "Usuario creado correctamente", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            service.actualizar(id, body, SecurityUtil.currentUserId());
            return ApiResponse.success(null, "Usuario actualizado correctamente");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable int id) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        service.desactivar(id, SecurityUtil.currentUserId());
        return ApiResponse.success(null, "Usuario desactivado correctamente");
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<?> activar(@PathVariable int id) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        service.activar(id, SecurityUtil.currentUserId());
        return ApiResponse.success(null, "Usuario reactivado correctamente");
    }
}