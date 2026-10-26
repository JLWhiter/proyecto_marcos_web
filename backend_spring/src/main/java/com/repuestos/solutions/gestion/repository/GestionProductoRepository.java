package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GestionProductoRepository extends JpaRepository<Producto, Integer> {
    Optional<Producto> findByCodigoIgnoreCase(String codigo);
    List<Producto> findByActivoTrueOrderByCodigoAsc();
}
