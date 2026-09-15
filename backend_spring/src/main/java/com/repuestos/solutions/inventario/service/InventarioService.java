package com.repuestos.solutions.inventario.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.inventario.repository.InventarioRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de InventarioService (inventario_service.py).
 */
@Service
public class InventarioService {

    private final InventarioRepository repo;

    public InventarioService(InventarioRepository repo) {
        this.repo = repo;
    }

    public Map<String, Object> listar(String q, Integer stockMax, int page, int perPage) {
        int safePage = Math.max(1, page);
        int safePerPage = perPage > 0 ? perPage : 100;
        List<Map<String, Object>> items = repo.listar(q, stockMax, safePage, safePerPage);
        long total = repo.contar(q, stockMax);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("items", items);
        data.put("total", total);
        data.put("page", safePage);
        data.put("per_page", safePerPage);
        return data;
    }

    public Map<String, Object> obtener(int id) {
        Map<String, Object> row = repo.obtener(id);
        if (row == null) {
            throw new BusinessException("El registro de inventario no existe");
        }
        return row;
    }

    public void actualizar(int id, Map<String, Object> body, int userId) {
        if (repo.obtener(id) == null) {
            throw new BusinessException("El registro de inventario no existe");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        if (body.get("stock_actual") instanceof Number n) {
            data.put("stock_actual", n.intValue());
        }
        if (body.get("stock_minimo") instanceof Number n) {
            data.put("stock_minimo", n.intValue());
        }
        if (body.get("id_estado_producto") instanceof Number n) {
            data.put("id_estado_producto", n.intValue());
        }
        if (body.get("id_ubicacion") instanceof Number n) {
            data.put("id_ubicacion", n.intValue());
        }
        repo.actualizar(id, data, userId);
    }

    public List<Map<String, Object>> bajoStock() {
        return repo.bajoStock();
    }
}