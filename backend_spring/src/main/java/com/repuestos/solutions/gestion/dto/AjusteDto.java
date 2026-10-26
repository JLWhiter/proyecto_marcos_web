package com.repuestos.solutions.gestion.dto;

import java.time.LocalDateTime;

public record AjusteDto(
        Integer id,
        LocalDateTime fecha,
        String codigo,
        String producto,
        Integer cantidadAjuste,
        Integer stockAnterior,
        Integer stockNuevo,
        String motivo,
        String administrador
) {
}
