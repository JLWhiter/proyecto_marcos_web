package com.repuestos.solutions.gestion.dto;

/** Fila del inventario físico filtrado por ubicación. */
public record InventarioUbicacionDto(
        String codigo,
        String ubicacion,
        String descripcion,
        String unidadMedida,
        Integer cantidad
) {
}
