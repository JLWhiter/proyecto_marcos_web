package com.repuestos.solutions.common;

/**
 * Excepción de negocio con mensaje amigable para el cliente.
 * Se traduce a una respuesta 400 por GlobalExceptionHandler.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
