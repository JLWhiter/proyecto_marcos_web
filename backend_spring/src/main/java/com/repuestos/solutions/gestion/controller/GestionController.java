package com.repuestos.solutions.gestion.controller;

import com.repuestos.solutions.gestion.model.*;
import com.repuestos.solutions.gestion.service.GestionInventarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/gestion")
public class GestionController {

    private final GestionInventarioService service;

    public GestionController(GestionInventarioService service) {
        this.service = service;
    }

    @GetMapping("/inventario/ubicacion/{codigo}")
    public ResponseEntity<List<Producto>> inventarioPorUbicacion(@PathVariable String codigo) {
        return ResponseEntity.ok(service.inventarioPorUbicacion(codigo));
    }

    @PostMapping("/danos/reporte")
    public ResponseEntity<ReporteDano> reportarDano(@RequestBody Map<String, Object> body) {
        Long productoId = ((Number) body.get("productoId")).longValue();
        Integer cantidad = ((Number) body.get("cantidad")).intValue();
        String motivo = (String) body.get("motivo");
        String user = (String) body.get("usuario");
        return ResponseEntity.ok(service.reportarDano(productoId, cantidad, motivo, user));
    }

    @PostMapping("/danos/{id}/confirmar")
    public ResponseEntity<ReporteDano> confirmarBaja(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.confirmarBaja(id, body.get("usuario")));
    }

    @PostMapping("/ajustes")
    public ResponseEntity<AjusteInventario> ajustar(@RequestBody Map<String, Object> body) {
        Long productoId = ((Number) body.get("productoId")).longValue();
        Integer cantidad = ((Number) body.get("cantidad")).intValue();
        String motivo = (String) body.get("motivo");
        String user = (String) body.get("usuario");
        return ResponseEntity.ok(service.ajustarInventario(productoId, cantidad, motivo, user));
    }

    @GetMapping("/alertas")
    public ResponseEntity<List<AlertaReposicion>> alertas() {
        return ResponseEntity.ok(service.alertasPendientes());
    }

    @PostMapping("/alertas/{id}/gestionar")
    public ResponseEntity<Void> gestionarAlerta(@PathVariable Long id, @RequestBody Map<String, String> body) {
        service.gestionarAlerta(id, body.get("usuario"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/dashboard/valor-total")
    public ResponseEntity<BigDecimal> valorTotal() {
        return ResponseEntity.ok(service.valorTotalInventario());
    }

    @GetMapping("/dashboard/mayor-valor")
    public ResponseEntity<List<Producto>> mayorValor(@RequestParam(defaultValue = "5") int top) {
        return ResponseEntity.ok(service.articulosMayorValor(top));
    }

    @GetMapping("/dashboard/menor-rotacion")
    public ResponseEntity<List<Producto>> menorRotacion(@RequestParam(defaultValue = "5") int top) {
        return ResponseEntity.ok(service.articulosMenorRotacion(top));
    }

    @GetMapping("/dashboard/obsoletos-danados")
    public ResponseEntity<List<Producto>> obsoletos() {
        return ResponseEntity.ok(service.articulosObsoletosODanados());
    }
}
