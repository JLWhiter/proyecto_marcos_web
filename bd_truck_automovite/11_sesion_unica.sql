-- 11_sesion_unica.sql
-- Sesión única: cada login incrementa token_ver, invalidando tokens anteriores
-- del mismo usuario (una persona no puede tener dos sesiones activas con el
-- mismo usuario).

SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name = 'usuario' AND column_name = 'token_ver');
SET @sql := IF(@exist = 0,
    'ALTER TABLE usuario ADD COLUMN token_ver INT NOT NULL DEFAULT 0 AFTER privilegio',
    'SELECT "token_ver ya existe, skip"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
