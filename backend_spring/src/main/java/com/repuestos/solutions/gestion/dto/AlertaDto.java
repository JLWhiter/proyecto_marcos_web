package com.repuestos.solutions.gestion.dto;

import java.time.LocalDateTime;

public record AlertaDto(
        Integer id,
        LocalDateTime fecha,
        Integer productoId,
        String codigo,
        String producto,
        Integer stockMomento,
        Integer stockMinimo,
        String estado
) {
}
