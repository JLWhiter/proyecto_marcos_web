package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.ReporteDano;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GestionReporteDanoRepository extends JpaRepository<ReporteDano, Long> {
    List<ReporteDano> findByEstado(ReporteDano.Estado estado);
}
