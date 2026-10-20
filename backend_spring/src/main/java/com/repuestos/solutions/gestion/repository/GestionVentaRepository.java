package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GestionVentaRepository extends JpaRepository<Venta, Long> {}
