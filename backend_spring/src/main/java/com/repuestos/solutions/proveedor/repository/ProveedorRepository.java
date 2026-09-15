package com.repuestos.solutions.proveedor.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * Acceso a la tabla proveedor.
 */
@Repository
public class ProveedorRepository {

    private final JdbcTemplate jdbc;

    public ProveedorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> listar() {
        return jdbc.queryForList("SELECT id, nombre, ruc FROM proveedor ORDER BY nombre");
    }

    public Map<String, Object> crear(String nombre, String ruc) {
        jdbc.update("INSERT INTO proveedor (nombre, ruc) VALUES (?, ?)", nombre, ruc);
        int id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        return Map.of("id", id, "nombre", nombre, "ruc", ruc);
    }
}