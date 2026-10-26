package com.repuestos.solutions.gestion.dto;

import java.math.BigDecimal;

public record ProductoInventarioDto(
        Integer productoId,
        Integer inventarioId,
        String codigo,
        String nombre,
        Integer stockActual,
        Integer stockMinimo,
        String ubicacion,
        String unidadMedida,
        BigDecimal precioCompra,
        BigDecimal precioVenta
) {
}
