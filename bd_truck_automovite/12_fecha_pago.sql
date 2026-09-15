-- 12_fecha_pago.sql
-- Agrega columna fecha_pago (fecha maxima de pago / vencimiento de cuotas) a venta.

SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name = 'venta' AND column_name = 'fecha_pago');
SET @sql := IF(@exist = 0,
    'ALTER TABLE venta ADD COLUMN fecha_pago DATE NULL AFTER plazos',
    'SELECT "fecha_pago ya existe, skip"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
