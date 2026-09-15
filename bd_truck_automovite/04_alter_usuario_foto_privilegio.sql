-- ============================================================
-- 04. Agregar columnas foto y privilegio al usuario
-- ============================================================
SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name = 'usuario' AND column_name = 'foto');
SET @sql := IF(@exist = 0,
    'ALTER TABLE usuario ADD COLUMN foto VARCHAR(255) DEFAULT NULL AFTER id_rol, ADD COLUMN privilegio VARCHAR(50) DEFAULT NULL AFTER foto',
    'SELECT "foto ya existe, skip"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
