-- ============================================================
-- Tabla token_denylist: almacena tokens revocados (logout).
-- Reemplaza la denylist in-memory que no sobrevive restarts
-- ni funciona con múltiples workers de Gunicorn.
-- ============================================================
CREATE TABLE IF NOT EXISTS token_denylist (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    token_hash   CHAR(64)        NOT NULL COMMENT 'SHA-256 del token completo',
    exp          DATETIME        NOT NULL COMMENT 'Expiración del token (para auto-limpieza)',
    revoked_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id      INT UNSIGNED    NULL     COMMENT 'ID del usuario dueño del token',
    PRIMARY KEY (id),
    INDEX idx_td_token_hash (token_hash),
    INDEX idx_td_exp (exp),
    INDEX idx_td_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Denylist de tokens JWT revocados (logout)';

-- ============================================================
-- Evento de auto-limpieza: elimina tokens expirados cada hora.
-- Requiere que el event_scheduler de MySQL esté activado:
--   SET GLOBAL event_scheduler = ON;
-- ============================================================
CREATE EVENT IF NOT EXISTS evt_cleanup_token_denylist
ON SCHEDULE EVERY 1 HOUR
DO
    DELETE FROM token_denylist WHERE exp < NOW();
