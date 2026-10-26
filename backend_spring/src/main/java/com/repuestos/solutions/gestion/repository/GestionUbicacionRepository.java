package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Ubicacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GestionUbicacionRepository extends JpaRepository<Ubicacion, Integer> {
    Optional<Ubicacion> findByCodigoIgnoreCase(String codigo);
    List<Ubicacion> findAllByOrderByCodigoAsc();
}
