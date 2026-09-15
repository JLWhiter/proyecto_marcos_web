package com.repuestos.solutions.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Usuario y contrasena son requeridos")
    @Size(max = 100, message = "Solicitud incorrecta")
    private String usuario;

    @NotBlank(message = "Usuario y contrasena son requeridos")
    private String contrasena;

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }
}
