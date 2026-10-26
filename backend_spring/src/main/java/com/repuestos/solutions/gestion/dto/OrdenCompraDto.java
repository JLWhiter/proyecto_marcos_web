package com.repuestos.solutions.gestion.dto;

import java.time.LocalDateTime;

public record OrdenCompraDto(
        Integer id,
        LocalDateTime fecha,
        Integer alertaId,
        String codigo,
        String producto,
        Integer proveedorId,
        String proveedor,
        Integer cantidad,
        String estado
) {
}
