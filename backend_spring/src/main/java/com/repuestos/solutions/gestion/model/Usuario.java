package com.repuestos.solutions.gestion.model;

import jakarta.persistence.*;

/**
 * Usuario del sistema. Los roles se guardan por id en la tabla usuario:
 * 1 = ADMINISTRADOR, 2 = VENDEDOR, 3 = ALMACENERO.
 */
@Entity
@Table(name = "usuario")
public class Usuario {

    public enum Rol {
        ADMINISTRADOR(1), VENDEDOR(2), ALMACENERO(3);

        private final int id;

        Rol(int id) { this.id = id; }

        public int getId() { return id; }

        public static Rol desdeId(Integer id) {
            if (id == null) return null;
            for (Rol r : values()) {
                if (r.id == id) return r;
            }
            return null;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "usuario", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "contrasena", length = 256)
    private String password;

    @Column(name = "id_rol")
    private Integer rolId;

    @Column(name = "id_persona")
    private Integer personaId;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Transient
    public Rol getRol() {
        return Rol.desdeId(rolId);
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Integer getRolId() { return rolId; }
    public void setRolId(Integer rolId) { this.rolId = rolId; }
    public Integer getPersonaId() { return personaId; }
    public void setPersonaId(Integer personaId) { this.personaId = personaId; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
