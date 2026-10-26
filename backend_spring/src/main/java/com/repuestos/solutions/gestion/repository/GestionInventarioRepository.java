package com.repuestos.solutions.gestion.repository;

import com.repuestos.solutions.gestion.model.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GestionInventarioRepository extends JpaRepository<Inventario, Integer> {

    Optional<Inventario> findByProductoId(Integer productoId);

    @Query("""
            select i from Inventario i
              join fetch i.producto p
              left join fetch i.ubicacion u
             where lower(u.codigo) = lower(:codigo)
               and (p.activo = true or p.activo is null)
             order by p.codigo
            """)
    List<Inventario> porUbicacion(@Param("codigo") String codigo);

    @Query("""
            select i from Inventario i
              join fetch i.producto p
              left join fetch i.ubicacion u
             where i.id = :id
            """)
    Optional<Inventario> findConProductoYUbicacion(@Param("id") Integer id);
}
