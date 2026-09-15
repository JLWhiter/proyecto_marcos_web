package com.repuestos.solutions.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

/**
 * Réplica de la tabla token_denylist: guarda el hash SHA-256 del token
 * (nunca el token en texto plano) junto con su fecha de expiración.
 * El logout inserta (INSERT IGNORE) y la validación consulta si exp > NOW().
 */
@Repository
public class TokenDenylistRepository {

    private final JdbcTemplate jdbc;

    public TokenDenylistRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static String sha256(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    public void revoke(String token, Instant exp) {
        String th = sha256(token);
        String expStr = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(java.time.ZoneOffset.UTC)
                .format(exp);
        try {
            jdbc.update(
                    "INSERT IGNORE INTO token_denylist (token_hash, exp) VALUES (?, ?)",
                    th, expStr);
        } catch (Exception ignored) {
            // la denylist nunca debe tumbar el logout
        }
    }

    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String th = sha256(token);
        try {
            List<Integer> rows = jdbc.query(
                    "SELECT 1 FROM token_denylist WHERE token_hash = ? AND exp > NOW() LIMIT 1",
                    (rs, i) -> rs.getInt(1),
                    th);
            return !rows.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
