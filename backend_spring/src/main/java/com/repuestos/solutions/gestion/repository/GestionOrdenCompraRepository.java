package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.OrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GestionOrdenCompraRepository extends JpaRepository<OrdenCompra, Integer> {
    List<OrdenCompra> findAllByOrderByFechaDesc();
}
