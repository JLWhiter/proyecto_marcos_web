package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.AlertaReposicion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GestionAlertaReposicionRepository extends JpaRepository<AlertaReposicion, Long> {
    List<AlertaReposicion> findByEstado(AlertaReposicion.Estado estado);
}
