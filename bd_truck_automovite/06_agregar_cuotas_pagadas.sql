-- 06_agregar_cuotas_pagadas.sql

SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name = 'venta' AND column_name = 'cuotas_pagadas');
SET @sql := IF(@exist = 0,
    'ALTER TABLE venta ADD COLUMN cuotas_pagadas INT NOT NULL DEFAULT 0 AFTER plazos',
    'SELECT "cuotas_pagadas ya existe, skip"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE venta ALTER COLUMN moneda SET DEFAULT '$';
