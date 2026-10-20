package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GestionUsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByUsername(String username);
}
