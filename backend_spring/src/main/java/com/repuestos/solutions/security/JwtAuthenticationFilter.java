package com.repuestos.solutions.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Réplica de middleware/auth.py: valida el JWT, verifica que el usuario esté
 * activo y que el token_ver del token coincida con el actual en BD (sesión
 * única), y carga el principal en el contexto de seguridad.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final JdbcTemplate jdbc;

    public JwtAuthenticationFilter(JwtService jwtService, JdbcTemplate jdbc) {
        this.jwtService = jwtService;
        this.jdbc = jdbc;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = header.substring(7).trim();

        try {
            Claims claims = jwtService.validate(token);

            Integer userId = claims.get("user_id", Integer.class);
            Integer verToken = claims.get("ver", Integer.class);

            // Consulta activo + token_ver actual en BD
            List<AppUser> users = jdbc.query(
                    "SELECT u.id, u.usuario, u.id_rol, u.id_persona, u.token_ver, u.activo, r.nombre AS rol_nombre " +
                            "FROM usuario u LEFT JOIN rol r ON r.id = u.id_rol WHERE u.id = ?",
                    (rs, i) -> new AppUser(
                            rs.getInt("id"),
                            rs.getString("usuario"),
                            rs.getString("rol_nombre"),
                            rs.getInt("id_rol"),
                            rs.getObject("id_persona", Integer.class),
                            rs.getObject("token_ver", Integer.class),
                            rs.getBoolean("activo")),
                    userId);

            if (users.isEmpty() || !users.get(0).isEnabled()) {
                throw new org.springframework.security.authentication.DisabledException("Usuario desactivado");
            }
            AppUser user = users.get(0);

            // Sesión única: si el token_ver no coincide, la sesión fue reemplazada
            if (verToken == null || !verToken.equals(user.getVer())) {
                throw new org.springframework.security.authentication.BadCredentialsException(
                        "Sesión cerrada porque el mismo usuario inició sesión en otro dispositivo");
            }

            // Cache en un atributo de request para acceder desde los controllers
            request.setAttribute("currentUser", user.principal());

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(user.principal(), null, user.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
