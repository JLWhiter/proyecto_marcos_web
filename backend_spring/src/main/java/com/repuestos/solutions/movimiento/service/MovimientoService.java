package com.repuestos.solutions.movimiento.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.movimiento.repository.MovimientoRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Réplica de MovimientoService (movimiento_service.py).
 */
@Service
public class MovimientoService {

    private final MovimientoRepository repo;

    public MovimientoService(MovimientoRepository repo) {
        this.repo = repo;
    }

    public Map<String, Object> registrar(String tipo, Integer cantidad, Integer idInventario,
                                         String observacion, int userId) {
        if (tipo == null || !java.util.Set.of("entrada", "salida", "ajuste").contains(tipo)) {
            throw new BusinessException("Tipo de movimiento inválido. Use: entrada, salida, ajuste");
        }
        if (cantidad == null || cantidad <= 0) {
            throw new BusinessException("La cantidad debe ser un entero mayor a 0");
        }
        if (idInventario == null || idInventario <= 0) {
            throw new BusinessException("El inventario es obligatorio");
        }
        return repo.registrar(tipo, cantidad, idInventario, observacion, userId);
    }
}