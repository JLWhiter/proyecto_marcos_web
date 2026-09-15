package com.repuestos.solutions.reporte.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.reporte.service.ReporteService;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Reportes: indicadores, tasa de cambio, historial y reportes de daño.
 */
@RestController
@RequestMapping("/api/v1/reportes")
public class ReporteController {

    private final ReporteService service;
    private final String uploadDir;

    public ReporteController(ReporteService service, @Value("${app.upload.dir}") String uploadDir) {
        this.service = service;
        this.uploadDir = uploadDir;
    }

    @GetMapping("/valor")
    public ResponseEntity<?> valor() {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.valorInventario(), "Valor del inventario");
    }

    @GetMapping("/movimientos")
    public ResponseEntity<?> movimientos(@RequestParam(required = false) String fecha_desde,
                                         @RequestParam(required = false) String fecha_hasta) {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.movimientosResumen(fecha_desde, fecha_hasta), "Resumen de movimientos");
    }

    @GetMapping("/ventas")
    public ResponseEntity<?> ventasResumen(@RequestParam(required = false) String periodo) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.ventasResumen(periodo), "Resumen de ventas");
    }

    @GetMapping("/evolucion-ventas")
    public ResponseEntity<?> evolucionVentas(@RequestParam(required = false) Integer anio,
                                             @RequestParam(required = false) String moneda) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        int year = (anio == null || anio <= 0) ? java.time.Year.now().getValue() : anio;
        return ApiResponse.success(service.evolucionVentas(year, moneda), "Evolución de ventas");
    }

    @GetMapping("/tasa-cambio")
    public ResponseEntity<?> getTasaCambio() {
        return ApiResponse.success(service.getTasaCambio(), "Tasa de cambio obtenida");
    }

    @PutMapping("/tasa-cambio")
    public ResponseEntity<?> setTasaCambio(@RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        double tasa = body.get("tasa_cambio") instanceof Number n ? n.doubleValue() : Double.NaN;
        try {
            return ApiResponse.success(service.setTasaCambio(tasa, SecurityUtil.currentUserId()), "Tasa actualizada");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/historial")
    public ResponseEntity<?> historial(@RequestParam(required = false) String fecha_desde,
                                       @RequestParam(required = false) String fecha_hasta,
                                       @RequestParam(required = false) String codigo,
                                       @RequestParam(required = false) String disponibilidad,
                                       @RequestParam(required = false) String orden,
                                       @RequestParam(required = false) Integer usuario_id) {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.success(service.historial(fecha_desde, fecha_hasta, codigo,
                disponibilidad, orden, usuario_id), "Historial obtenido");
    }

    @GetMapping("/dano")
    public ResponseEntity<?> listarDanos(@RequestParam(required = false) String fecha_desde,
                                         @RequestParam(required = false) String fecha_hasta,
                                         @RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int per_page) {
        if (!SecurityUtil.hasAnyRole(1)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        Map<String, Object> data = service.listarDanos(fecha_desde, fecha_hasta, page, per_page);
        long total = ((Number) data.get("total")).longValue();
        int safePage = Math.max(1, page);
        int safePerPage = per_page > 0 ? per_page : 10;
        List<?> items = (List<?>) data.get("items");
        return ApiResponse.paginated(items, total, safePage, safePerPage, "Reportes de daño obtenidos");
    }

    @PostMapping("/dano")
    public ResponseEntity<?> reportarDano(@RequestBody Map<String, Object> body) {
        if (!SecurityUtil.hasAnyRole(1, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        Integer idInventario = body.get("id_inventario") instanceof Number n ? n.intValue() : null;
        Integer cantidad = body.get("cantidad") instanceof Number n ? n.intValue() : null;
        String descripcion = body.get("descripcion") != null ? String.valueOf(body.get("descripcion")) : null;
        String evidenciaUrl = body.get("evidencia_url") != null ? String.valueOf(body.get("evidencia_url")) : null;
        try {
            return ApiResponse.success(service.reportarDano(idInventario, cantidad, descripcion, evidenciaUrl,
                    SecurityUtil.currentUserId()), "Reporte de daño registrado", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/evidencia")
    public ResponseEntity<?> subirEvidencia(@RequestParam("file") MultipartFile file) {
        if (!SecurityUtil.hasAnyRole(1, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        if (file == null || file.isEmpty()) {
            return ApiResponse.error("Selecciona una imagen", HttpStatus.BAD_REQUEST);
        }
        String nombre = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String lower = nombre.toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
            return ApiResponse.error("Formato no permitido. Use JPG o PNG.", HttpStatus.BAD_REQUEST);
        }
        try {
            Path evidenciaDir = Paths.get(uploadDir, "evidencia");
            Files.createDirectories(evidenciaDir);
            String ext = lower.endsWith(".png") ? ".png" : ".jpg";
            String filename = UUID.randomUUID().toString().replace("-", "") + ext;
            Path target = evidenciaDir.resolve(filename).normalize();
            if (!target.startsWith(evidenciaDir.normalize())) {
                return ApiResponse.error("Ruta inválida", HttpStatus.BAD_REQUEST);
            }
            Files.copy(file.getInputStream(), target);
            return ApiResponse.success(Map.of("url", "/uploads/evidencia/" + filename),
                    "Evidencia subida correctamente", HttpStatus.CREATED);
        } catch (IOException e) {
            return ApiResponse.error("No se pudo guardar la evidencia", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}