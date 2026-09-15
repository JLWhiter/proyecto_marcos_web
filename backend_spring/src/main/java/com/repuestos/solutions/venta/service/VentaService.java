package com.repuestos.solutions.venta.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.venta.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de VentaService (venta_service.py).
 */
@Service
public class VentaService {

    private final VentaRepository repo;

    public VentaService(VentaRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Map<String, Object> registrar(Map<String, Object> body, int userId) {
        if (body.get("id_producto") == null) {
            throw new BusinessException("El producto es obligatorio");
        }
        int id = repo.registrar(body, userId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.put("mensaje", "Venta registrada correctamente");
        return result;
    }

    public Map<String, Object> listar(String estadoPago, String fechaDesde, String fechaHasta, int page, int perPage) {
        int safePage = Math.max(1, page);
        int safePerPage = perPage > 0 ? perPage : 10;
        List<Map<String, Object>> items = repo.listar(estadoPago, fechaDesde, fechaHasta, safePage, safePerPage);
        long total = repo.contar(estadoPago, fechaDesde, fechaHasta);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("items", items);
        data.put("total", total);
        data.put("page", safePage);
        data.put("per_page", safePerPage);
        return data;
    }

    public Map<String, Object> cambiarEstadoPago(int id) {
        return repo.cambiarEstadoPago(id);
    }

    public Map<String, Object> actualizarVendedor(int id, int idUsuario) {
        return repo.actualizarVendedor(id, idUsuario);
    }

    public void actualizarFinanciero(int id, Map<String, Object> body) {
        repo.actualizarFinanciero(id, body);
    }
}