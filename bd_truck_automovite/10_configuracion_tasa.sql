-- 10_configuracion_tasa.sql
-- Tabla de configuración global para valores compartidos, p.ej. tasa de cambio.

CREATE TABLE IF NOT EXISTS configuracion (
    id INT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    valor VARCHAR(100) NOT NULL,
    actualizado_por INT NULL,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO configuracion (id, nombre, valor)
SELECT 1, 'tasa_cambio', '3.4'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE nombre = 'tasa_cambio');
