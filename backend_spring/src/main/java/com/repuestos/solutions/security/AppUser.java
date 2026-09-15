package com.repuestos.solutions.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AppUser implements UserDetails {

    private final Integer id;
    private final String usuario;
    private final String rolNombre;
    private final Integer rolId;
    private final Integer personaId;
    private final Integer ver;
    private final boolean activo;

    public AppUser(Integer id, String usuario, String rolNombre, Integer rolId,
                   Integer personaId, Integer ver, boolean activo) {
        this.id = id;
        this.usuario = usuario;
        this.rolNombre = rolNombre;
        this.rolId = rolId;
        this.personaId = personaId;
        this.ver = ver;
        this.activo = activo;
    }

    public AuthPrincipal principal() {
        return new AuthPrincipal(id, usuario, rolNombre, rolId, personaId, ver);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Autoridad por rol: ROLE_ADMIN, ROLE_RECEPCION, ROLE_ALMACENAMIENTO
        return List.of(new SimpleGrantedAuthority("ROLE_" + rolNombre.toUpperCase()));
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return usuario;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }

    public Integer getId() {
        return id;
    }

    public Integer getRolId() {
        return rolId;
    }

    public Integer getPersonaId() {
        return personaId;
    }

    public String getRolNombre() {
        return rolNombre;
    }

    public Integer getVer() {
        return ver;
    }

    /**
     * Payload mínimo que viaja por defecto en el contexto de seguridad.
     */
    public record AuthPrincipal(Integer id, String usuario, String rol, Integer rolId,
                                Integer personaId, Integer ver) {
    }
}
