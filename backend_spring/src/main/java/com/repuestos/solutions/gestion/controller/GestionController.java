package com.repuestos.solutions.gestion.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.gestion.service.GestionInventarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Módulo de gestión: daños, ajustes, alertas de reposición, órdenes de compra,
 * inventario físico por ubicación y dashboard.
 *
 * Los permisos se validan en el servicio con el usuario autenticado (JWT);
 * nunca se confía en un usuario enviado por el cliente.
 */
@RestController
@RequestMapping("/api/v1/gestion")
public class GestionController {

    private final GestionInventarioService service;

    public GestionController(GestionInventarioService service) {
        this.service = service;
    }

    // ------------------------------------------------------------------
    // Inventario físico
    // ------------------------------------------------------------------

    @GetMapping("/inventario/ubicacion")
    public ResponseEntity<?> inventarioPorUbicacion(@RequestParam String codigo) {
        return ApiResponse.success(service.inventarioPorUbicacion(codigo), "Inventario por ubicación");
    }

    @GetMapping("/inventario/ubicacion/{codigo}")
    public ResponseEntity<?> inventarioPorUbicacionPath(@PathVariable String codigo) {
        return ApiResponse.success(service.inventarioPorUbicacion(codigo), "Inventario por ubicación");
    }

    @GetMapping("/inventario/productos")
    public ResponseEntity<?> productosInventario(@RequestParam(required = false) String q) {
        return ApiResponse.success(service.buscarProductosInventario(q), "Productos con inventario");
    }

    @GetMapping("/ubicaciones")
    public ResponseEntity<?> ubicaciones() {
        return ApiResponse.success(service.listarUbicaciones(), "Ubicaciones");
    }

    // ------------------------------------------------------------------
    // Daños
    // ------------------------------------------------------------------

    @PostMapping({"/danos", "/danos/reporte"})
    public ResponseEntity<?> reportarDano(@RequestBody Map<String, Object> body) {
        Integer idInventario = intVal(body, "id_inventario", "idInventario", "inventarioId");
        Integer cantidad = intVal(body, "cantidad");
        String motivo = str(body.get("descripcion") != null ? body.get("descripcion") : body.get("motivo"));
        String evidencia = str(body.get("evidencia_url") != null ? body.get("evidencia_url") : body.get("evidenciaUrl"));
        return ApiResponse.success(service.reportarDano(idInventario, cantidad, motivo, evidencia),
                "Reporte de daño registrado. Pendiente de confirmación del administrador.", HttpStatus.CREATED);
    }

    @GetMapping("/danos")
    public ResponseEntity<?> listarDanos(@RequestParam(required = false) String estado) {
        return ApiResponse.success(service.listarDanos(estado), "Reportes de daño");
    }

    @PostMapping("/danos/{id}/confirmar")
    public ResponseEntity<?> confirmarBaja(@PathVariable Integer id) {
        return ApiResponse.success(service.confirmarBaja(id), "Baja confirmada y stock actualizado");
    }

    @PostMapping("/danos/{id}/rechazar")
    public ResponseEntity<?> rechazarBaja(@PathVariable Integer id) {
        return ApiResponse.success(service.rechazarBaja(id), "Reporte rechazado");
    }

    // ------------------------------------------------------------------
    // Ajustes de inventario
    // ------------------------------------------------------------------

    @PostMapping("/ajustes")
    public ResponseEntity<?> ajustar(@RequestBody Map<String, Object> body) {
        Integer productoId = intVal(body, "productoId", "producto_id", "id_producto");
        Integer nuevoStock = intVal(body, "nuevoStock", "nuevo_stock", "stock");
        String motivo = str(body.get("motivo"));
        return ApiResponse.success(service.ajustarInventario(productoId, nuevoStock, motivo),
                "Inventario ajustado correctamente", HttpStatus.CREATED);
    }

    @GetMapping("/ajustes")
    public ResponseEntity<?> listarAjustes() {
        return ApiResponse.success(service.listarAjustes(), "Ajustes de inventario");
    }

    // ------------------------------------------------------------------
    // Alertas y órdenes de compra
    // ------------------------------------------------------------------

    @GetMapping("/alertas")
    public ResponseEntity<?> alertas() {
        return ApiResponse.success(service.alertasPendientes(), "Alertas de reposición pendientes");
    }

    @PostMapping("/alertas/{id}/orden-compra")
    public ResponseEntity<?> emitirOrden(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Integer proveedorId = intVal(body, "proveedorId", "proveedor_id", "id_proveedor");
        Integer cantidad = intVal(body, "cantidad");
        return ApiResponse.success(service.emitirOrdenCompra(id, proveedorId, cantidad),
                "Orden de compra emitida", HttpStatus.CREATED);
    }

    @GetMapping("/ordenes-compra")
    public ResponseEntity<?> ordenes() {
        return ApiResponse.success(service.listarOrdenesCompra(), "Órdenes de compra");
    }

    // ------------------------------------------------------------------
    // Dashboard
    // ------------------------------------------------------------------

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@RequestParam(defaultValue = "mes") String periodo) {
        return ApiResponse.success(service.dashboard(periodo), "Indicadores del dashboard");
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Integer intVal(Map<String, Object> body, String... keys) {
        for (String key : keys) {
            Object v = body.get(key);
            if (v instanceof Number n) return n.intValue();
            if (v instanceof String s && !s.isBlank()) {
                try { return Integer.parseInt(s.trim()); } catch (NumberFormatException ignored) { }
            }
        }
        return null;
    }

    private String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
