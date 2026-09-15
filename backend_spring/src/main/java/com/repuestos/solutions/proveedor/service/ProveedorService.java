package com.repuestos.solutions.proveedor.service;

import com.repuestos.solutions.proveedor.repository.ProveedorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Réplica del servicio de proveedores.
 */
@Service
public class ProveedorService {

    private final ProveedorRepository repo;

    public ProveedorService(ProveedorRepository repo) {
        this.repo = repo;
    }

    public List<Map<String, Object>> listar() {
        return repo.listar();
    }

    public Map<String, Object> crear(String nombre, String ruc) {
        return repo.crear(nombre, ruc);
    }
}