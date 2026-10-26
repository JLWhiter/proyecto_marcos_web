package com.repuestos.solutions.reporte.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.gestion.dto.DanoDto;
import com.repuestos.solutions.gestion.service.GestionInventarioService;
import com.repuestos.solutions.reporte.repository.ReporteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de ReporteService (reporte_service.py).
 */
@Service
public class ReporteService {

    private final ReporteRepository repo;
    private final GestionInventarioService gestion;

    public ReporteService(ReporteRepository repo, GestionInventarioService gestion) {
        this.repo = repo;
        this.gestion = gestion;
    }

    public Map<String, Object> valorInventario() {
        return repo.valorInventario();
    }

    public List<Map<String, Object>> movimientosResumen(String fechaDesde, String fechaHasta) {
        return repo.movimientosResumen(fechaDesde, fechaHasta);
    }

    public Map<String, Object> ventasResumen(String periodo) {
        return repo.ventasResumen(periodo);
    }

    public List<Map<String, Object>> evolucionVentas(int anio, String moneda) {
        return repo.evolucionVentas(anio, moneda);
    }

    public Map<String, Object> getTasaCambio() {
        Double tasa = repo.getTasaCambio();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tasa_cambio", tasa == null ? 3.4 : tasa);
        return result;
    }

    public Map<String, Object> setTasaCambio(double tasa, int userId) {
        if (tasa <= 0) {
            throw new BusinessException("La tasa de cambio debe ser mayor a 0");
        }
        repo.setTasaCambio(tasa, userId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tasa_cambio", tasa);
        return result;
    }

    public List<Map<String, Object>> historial(String fechaDesde, String fechaHasta, String codigo,
                                               String disponibilidad, String orden, Integer usuarioId) {
        return repo.historial(fechaDesde, fechaHasta, codigo, disponibilidad, orden, usuarioId);
    }

    @Transactional
    public DanoDto reportarDano(Integer idInventario, Integer cantidad, String descripcion,
                                String evidenciaUrl, int userId) {
        // El flujo real (stock, estado PENDIENTE y rol de almacenero) vive en
        // GestionInventarioService. El userId se toma del JWT, no del body.
        return gestion.reportarDano(idInventario, cantidad, descripcion, evidenciaUrl);
    }

    public Map<String, Object> listarDanos(String fechaDesde, String fechaHasta, int page, int perPage) {
        int safePage = Math.max(1, page);
        int safePerPage = perPage > 0 ? perPage : 10;
        List<Map<String, Object>> items = repo.listarDanos(fechaDesde, fechaHasta, safePage, safePerPage);
        long total = repo.contarDanos(fechaDesde, fechaHasta);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("items", items);
        data.put("total", total);
        data.put("page", safePage);
        data.put("per_page", safePerPage);
        return data;
    }
}