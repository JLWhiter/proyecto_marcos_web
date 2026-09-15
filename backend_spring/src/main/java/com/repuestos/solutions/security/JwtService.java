package com.repuestos.solutions.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * Réplica de app/utils/security.py (PyJWT) para crear y validar JWT HS256
 * con la misma estructura de claims y con la denylist de tokens revocados.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;
    private final String audience;
    private final long expirationHours;
    private final TokenDenylistRepository denylist;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.audience}") String audience,
            @Value("${app.jwt.expiration-hours}") long expirationHours,
            TokenDenylistRepository denylist) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.audience = audience;
        this.expirationHours = expirationHours;
        this.denylist = denylist;
    }

    public String createToken(AppUser user) {
        Instant now = Instant.now();
        Instant exp = now.plus(expirationHours, ChronoUnit.HOURS);
        return Jwts.builder()
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("user_id", user.getId())
                .claim("usuario", user.getUsername())
                .claim("rol", user.getRolNombre())
                .claim("rol_id", user.getRolId())
                .claim("persona_id", user.getPersonaId())
                .claim("ver", user.getVer())
                .signWith(key)
                .compact();
    }

    /**
     * Valida firma, issuer, audience y que no esté revocado.
     * Devuelve los claims o lanza BadCredentialsException.
     */
    public Claims validate(String token) {
        if (token == null || token.isBlank()) {
            throw new BadCredentialsException("Token de autenticación requerido");
        }
        if (denylist.isRevoked(token)) {
            throw new BadCredentialsException("Token inválido o expirado");
        }
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .requireAudience(audience)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            throw new BadCredentialsException("Token inválido o expirado");
        }
    }

    public Instant getExpiration(Claims claims) {
        return claims.getExpiration().toInstant();
    }
}
