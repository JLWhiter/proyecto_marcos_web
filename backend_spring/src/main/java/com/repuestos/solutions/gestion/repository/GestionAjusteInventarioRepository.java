package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.AjusteInventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GestionAjusteInventarioRepository extends JpaRepository<AjusteInventario, Integer> {
    List<AjusteInventario> findAllByOrderByFechaDesc();
}
