-- 05_crear_cliente_y_normalizar_venta.sql
-- Normalización: tabla cliente y FK en venta

CREATE TABLE IF NOT EXISTS cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    apellidos VARCHAR(120) DEFAULT NULL,
    ruc_dni VARCHAR(20) NOT NULL,
    celular VARCHAR(15) DEFAULT NULL,
    email VARCHAR(120) DEFAULT NULL,
    direccion VARCHAR(200) DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cliente_ruc_dni (ruc_dni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name = 'venta' AND column_name = 'id_cliente');
SET @sql := IF(@exist = 0,
    'ALTER TABLE venta ADD COLUMN id_cliente INT DEFAULT NULL AFTER id_usuario',
    'SELECT "id_cliente ya existe, skip"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (SELECT COUNT(*) FROM information_schema.table_constraints
            WHERE table_schema = DATABASE() AND table_name = 'venta' AND constraint_name = 'fk_venta_cliente');
SET @sql2 := IF(@fk = 0,
    'ALTER TABLE venta ADD CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE SET NULL',
    'SELECT "fk_venta_cliente ya existe, skip"');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
