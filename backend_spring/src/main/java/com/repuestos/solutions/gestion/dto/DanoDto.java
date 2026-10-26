package com.repuestos.solutions.gestion.dto;

import java.time.LocalDateTime;

public record DanoDto(
        Integer id,
        LocalDateTime fecha,
        String productoCodigo,
        String productoNombre,
        Integer cantidad,
        String descripcion,
        String estado,
        String reportadoPor,
        String evidenciaUrl,
        String confirmadoPor,
        LocalDateTime fechaConfirmacion
) {
}
