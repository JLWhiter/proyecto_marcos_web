package com.repuestos.solutions.usuario.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de UsuarioService (usuario_service.py).
 */
@Service
public class UsuarioService {

    private final UsuarioRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository repo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> listar(String soloActivos, Integer idRol, int page, int perPage) {
        List<Map<String, Object>> items = repo.listar(soloActivos, idRol, page, perPage);
        long total = repo.contar(soloActivos, idRol);
        List<Map<String, Object>> dicts = new java.util.ArrayList<>();
        for (Map<String, Object> row : items) {
            dicts.add(toUserDict(row));
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("items", dicts);
        data.put("total", total);
        data.put("page", page);
        data.put("per_page", perPage);
        return data;
    }

    public List<Map<String, Object>> roles() {
        return repo.roles();
    }

    public int crear(Map<String, Object> body, int userId) {
        String nombre = str(body.get("nombre"));
        String apellidos = str(body.get("apellidos"));
        String dni = str(body.get("dni"));
        String celular = str(body.get("celular"));
        String usuario = str(body.get("usuario"));
        String contrasena = str(body.get("contrasena"));
        if (nombre == null || nombre.isBlank()) {
            throw new BusinessException("El nombre es obligatorio");
        }
        if (dni == null || dni.isBlank()) {
            throw new BusinessException("El DNI es obligatorio");
        }
        if (usuario == null || usuario.isBlank()) {
            throw new BusinessException("El usuario es obligatorio");
        }
        if (contrasena == null || contrasena.isBlank()) {
            throw new BusinessException("La contraseña es obligatoria");
        }
        Integer idRol = body.get("id_rol") instanceof Number n ? n.intValue() : null;
        if (idRol == null || idRol <= 0) {
            throw new BusinessException("Selecciona un rol");
        }
        return repo.crear(nombre, apellidos, dni, celular, usuario, passwordEncoder.encode(contrasena), idRol, userId);
    }

    public void actualizar(int id, Map<String, Object> body, int userId) {
        Map<String, Object> persona = new LinkedHashMap<>();
        if (body.get("nombre") != null) persona.put("nombre", str(body.get("nombre")));
        if (body.get("apellidos") != null) persona.put("apellidos", str(body.get("apellidos")));
        if (body.get("dni") != null) persona.put("dni", str(body.get("dni")));
        if (body.get("celular") != null) persona.put("celular", str(body.get("celular")));

        Map<String, Object> usuario = new LinkedHashMap<>();
        if (body.get("usuario") != null) usuario.put("usuario", str(body.get("usuario")));
        if (body.get("id_rol") instanceof Number n && n.intValue() > 0) {
            usuario.put("id_rol", n.intValue());
        }
        if (body.get("privilegio") != null) usuario.put("privilegio", str(body.get("privilegio")));
        if (body.get("contrasena") != null && !String.valueOf(body.get("contrasena")).isBlank()) {
            usuario.put("contrasena", passwordEncoder.encode(String.valueOf(body.get("contrasena"))));
        }
        repo.actualizar(id, persona, usuario, userId);
    }

    public void desactivar(int id, int userId) {
        repo.desactivar(id, userId);
    }

    public void activar(int id, int userId) {
        repo.activar(id, userId);
    }

    public Map<String, Object> toUserDict(Map<String, Object> row) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("id", row.get("id"));
        d.put("usuario", row.get("usuario"));
        d.put("id_persona", row.get("id_persona"));
        d.put("id_rol", row.get("id_rol"));
        d.put("foto", row.get("foto"));
        d.put("privilegio", row.get("privilegio"));
        d.put("token_ver", row.get("token_ver"));
        d.put("activo", row.get("activo"));
        d.put("nombre", row.get("nombre"));
        d.put("apellidos", row.get("apellidos"));
        d.put("dni", row.get("dni"));
        d.put("celular", row.get("celular"));
        d.put("rol_nombre", row.get("rol_nombre"));
        d.values().removeIf(java.util.Objects::isNull);
        return d;
    }

    private String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}