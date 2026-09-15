package com.repuestos.solutions.catalogo.repository;

import com.repuestos.solutions.common.BusinessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * Acceso a tablas catálogo (marca, categoria, estado_producto, tipo_documento).
 */
@Repository
public class CatalogoRepository {

    private final JdbcTemplate jdbc;

    public CatalogoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> listarMarcas() {
        return jdbc.queryForList("SELECT id, nombre FROM marca ORDER BY nombre");
    }

    public Map<String, Object> crearMarca(String nombre) {
        jdbc.update("INSERT INTO marca (nombre) VALUES (?)", nombre);
        return Map.of("id", jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class), "nombre", nombre);
    }

    public List<Map<String, Object>> listarCategorias() {
        return jdbc.queryForList("SELECT id, nombre FROM categoria ORDER BY nombre");
    }

    public Map<String, Object> crearCategoria(String nombre) {
        try {
            jdbc.update("INSERT INTO categoria (nombre) VALUES (?)", nombre);
        } catch (DuplicateKeyException e) {
            throw new BusinessException("Ya existe una categoría con ese nombre");
        }
        return Map.of("id", jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class), "nombre", nombre);
    }

    public List<Map<String, Object>> listarEstadosProducto() {
        return jdbc.queryForList("SELECT id, nombre FROM estado_producto ORDER BY id");
    }

    public List<Map<String, Object>> listarTiposDocumento() {
        return jdbc.queryForList("SELECT id, nombre FROM tipo_documento ORDER BY id");
    }
}