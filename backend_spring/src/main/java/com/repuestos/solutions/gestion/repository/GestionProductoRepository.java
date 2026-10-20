package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GestionProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByUbicacionCodigo(String codigo);
}
