package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Ubicacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GestionUbicacionRepository extends JpaRepository<Ubicacion, Long> {
    Ubicacion findByCodigo(String codigo);
}
