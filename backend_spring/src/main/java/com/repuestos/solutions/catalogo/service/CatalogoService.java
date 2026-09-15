package com.repuestos.solutions.catalogo.service;

import com.repuestos.solutions.catalogo.repository.CatalogoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Réplica de los servicios de catálogo (marcas, categorías, estados, tipos de documento).
 */
@Service
public class CatalogoService {

    private final CatalogoRepository repo;

    public CatalogoService(CatalogoRepository repo) {
        this.repo = repo;
    }

    public List<Map<String, Object>> listarMarcas() {
        return repo.listarMarcas();
    }

    public Map<String, Object> crearMarca(String nombre) {
        return repo.crearMarca(nombre);
    }

    public List<Map<String, Object>> listarCategorias() {
        return repo.listarCategorias();
    }

    public Map<String, Object> crearCategoria(String nombre) {
        return repo.crearCategoria(nombre);
    }

    public List<Map<String, Object>> listarEstadosProducto() {
        return repo.listarEstadosProducto();
    }

    public List<Map<String, Object>> listarTiposDocumento() {
        return repo.listarTiposDocumento();
    }
}