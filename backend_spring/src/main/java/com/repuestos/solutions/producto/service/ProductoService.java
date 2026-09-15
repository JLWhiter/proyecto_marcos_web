package com.repuestos.solutions.producto.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.producto.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de ProductoService (producto_service.py).
 */
@Service
public class ProductoService {

    private final ProductoRepository repo;

    public ProductoService(ProductoRepository repo) {
        this.repo = repo;
    }

    public Map<String, Object> listar(String busqueda, Integer idMarca, Integer idCategoria,
                                      int page, int perPage) {
        List<Map<String, Object>> rows = repo.listar(busqueda, idMarca, idCategoria, page, perPage);
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            items.add(repo.toDict(row));
        }
        long total = repo.contar(busqueda, idMarca, idCategoria);
        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("page", page);
        result.put("per_page", perPage);
        return result;
    }

    public Map<String, Object> obtener(int id) {
        Map<String, Object> row = repo.obtener(id);
        return row == null ? null : repo.toDict(row);
    }

    public Map<String, Object> crear(Map<String, Object> data, int userId) {
        int newId = repo.crear(data, userId);
        return obtener(newId);
    }

    public Map<String, Object> registrarCompleto(Map<String, Object> data, int userId) {
        Map<String, Object> ids = repo.registrarCompleto(data, userId);
        Object stock = data.get("stock_actual");
        int stockVal = stock == null ? 0 : ((Number) stock).intValue();
        if (stockVal > 0 && ids.get("producto_id") != null) {
            Object invId = ids.get("inventario_id");
            if (invId != null) {
                repo.insertMovimientoEntrada(((Number) invId).intValue(), stockVal, userId,
                        "Ingreso inicial de " + stockVal + " unidades");
            }
        }
        return obtener(((Number) ids.get("producto_id")).intValue());
    }

    public void actualizar(int id, Map<String, Object> data, int userId) {
        repo.actualizar(id, data, userId);
    }

    public boolean eliminar(int id, int userId) {
        if (repo.obtener(id) == null) {
            return false;
        }
        repo.softDelete(id, userId);
        return true;
    }

    public Map<String, Object> actualizarCampo(int id, String campo, Object valor) {
        if (repo.obtener(id) == null) {
            throw new BusinessException("Producto no encontrado");
        }
        if (!campo.equals("imagen_url")) {
            throw new BusinessException("Campo no permitido");
        }
        repo.actualizarCampo(id, campo, valor);
        return obtener(id);
    }
}
