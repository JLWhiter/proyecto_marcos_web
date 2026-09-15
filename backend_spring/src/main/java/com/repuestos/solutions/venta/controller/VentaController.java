package com.repuestos.solutions.venta.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.security.SecurityUtil;
import com.repuestos.solutions.venta.service.VentaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Ventas: registro (roles 1 y 2), listado y modificaciones (solo admin = 1).
 */
@RestController
@RequestMapping("/api/v1/ventas")
public class VentaController {

    private final VentaService service;

    public VentaController(VentaService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1, 2)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            return ApiResponse.success(service.registrar(body, SecurityUtil.currentUserId()),
                    "Venta registrada correctamente", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "10") int per_page,
                                    @RequestParam(required = false) String estado_pago,
                                    @RequestParam(required = false) String fecha_desde,
                                    @RequestParam(required = false) String fecha_hasta) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        Map<String, Object> data = service.listar(estado_pago, fecha_desde, fecha_hasta, page, per_page);
        long total = ((Number) data.get("total")).longValue();
        int safePage = Math.max(1, page);
        int safePerPage = per_page > 0 ? per_page : 10;
        List<?> items = (List<?>) data.get("items");
        return ApiResponse.paginated(items, total, safePage, safePerPage, "Ventas obtenidas");
    }

    @PatchMapping("/{id}/estado-pago")
    public ResponseEntity<?> cambiarEstadoPago(@PathVariable int id) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            return ApiResponse.success(service.cambiarEstadoPago(id), "Estado de pago actualizado");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/vendedor")
    public ResponseEntity<?> actualizarVendedor(@PathVariable int id, @RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        Integer idUsuario = body.get("id_usuario") instanceof Number n ? n.intValue() : null;
        if (idUsuario == null) {
            return ApiResponse.error("El vendedor es obligatorio", HttpStatus.BAD_REQUEST);
        }
        try {
            return ApiResponse.success(service.actualizarVendedor(id, idUsuario), "Vendedor actualizado");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/financiero")
    public ResponseEntity<?> actualizarFinanciero(@PathVariable int id, @RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        try {
            service.actualizarFinanciero(id, body);
            return ApiResponse.success(null, "Venta financiera actualizada");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }
}