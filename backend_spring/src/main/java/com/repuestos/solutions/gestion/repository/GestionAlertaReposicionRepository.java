package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.AlertaReposicion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GestionAlertaReposicionRepository extends JpaRepository<AlertaReposicion, Integer> {
    List<AlertaReposicion> findByEstadoOrderByFechaDesc(AlertaReposicion.Estado estado);
    boolean existsByProductoIdAndEstado(Integer productoId, AlertaReposicion.Estado estado);
}
