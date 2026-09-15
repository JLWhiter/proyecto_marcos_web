package com.repuestos.solutions.auth.service;

import com.repuestos.solutions.auth.repository.AuthRepository;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.security.AppUser;
import com.repuestos.solutions.security.JwtService;
import com.repuestos.solutions.security.TokenDenylistRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Réplica de AuthService (auth_service.py):
 * - Login con bcrypt + dummy hash para evitar enumeración de usuarios por timing.
 * - Sesión única mediante bump_token_ver.
 * - Logout con revocación del token (denylist).
 */
@Service
public class AuthService {

    private static final String DUMMY_HASH = "$2b$12$hS3AqwT2gU3j6jgePDWgqektTeIFLSoP.9k0D6VqPEXiMgHvDaaaC";

    private final AuthRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenDenylistRepository denylist;

    public AuthService(AuthRepository repo, PasswordEncoder passwordEncoder,
                       JwtService jwtService, TokenDenylistRepository denylist) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.denylist = denylist;
    }

    public Map<String, Object> login(String usuario, String contrasena) {
        List<Map<String, Object>> rows = repo.findByUsuario(usuario);
        Map<String, Object> user = rows.isEmpty() ? null : rows.get(0);

        if (user == null) {
            // Igualar el tiempo de respuesta (bcrypt) aunque no exista el usuario
            passwordEncoder.matches(contrasena, DUMMY_HASH);
            throw new BusinessException("Credenciales inválidas");
        }
        Integer activo = toInt(user.get("activo"));
        String hash = (String) user.get("contrasena");
        if (activo == null || activo == 0 || hash == null || !passwordEncoder.matches(contrasena, hash)) {
            throw new BusinessException("Credenciales inválidas");
        }

        int ver = repo.bumpTokenVer(toInt(user.get("id")));

        AppUser appUser = new AppUser(
                toInt(user.get("id")),
                (String) user.get("usuario"),
                (String) user.get("rol_nombre"),
                toInt(user.get("id_rol")),
                user.get("id_persona") != null ? toInt(user.get("id_persona")) : null,
                ver,
                true);

        String token = jwtService.createToken(appUser);
        repo.registrarLogin(appUser.getId(), appUser.getUsername());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("usuario", repo.toUserDict(user));
        return result;
    }

    public void logout(String token, int userId) {
        try {
            denylist.revoke(token, java.time.Instant.now().plus(24, java.time.temporal.ChronoUnit.HOURS));
        } catch (Exception ignored) {
            // la denylist nunca debe tumbar el logout
        }
        repo.registrarLogout(userId);
    }

    public Map<String, Object> me(int userId) {
        List<Map<String, Object>> rows = repo.findById(userId);
        if (rows.isEmpty()) {
            return null;
        }
        return repo.toUserDict(rows.get(0));
    }

    /**
     * Convierte un valor de columna a Integer. El driver MySQL mapea TINYINT(1)
     * a Boolean (y el resto a Number), por lo que hay que manejar ambos casos.
     */
    private static Integer toInt(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean b) {
            return b ? 1 : 0;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public Map<String, Object> actualizarPerfil(int userId, Map<String, Object> data) {
        Map<String, Object> personaData = new LinkedHashMap<>();
        Map<String, Object> usuarioData = new LinkedHashMap<>();
        for (String k : data.keySet()) {
            if (k.equals("nombre") || k.equals("apellidos") || k.equals("dni") || k.equals("celular")) {
                personaData.put(k, data.get(k));
            } else if (k.equals("foto")) {
                usuarioData.put(k, data.get(k));
            }
        }
        if (personaData.isEmpty() && usuarioData.isEmpty()) {
            return null;
        }
        return repo.actualizarPerfil(userId, personaData, usuarioData);
    }
}
