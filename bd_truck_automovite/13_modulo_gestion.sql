-- =====================================================================
-- 13_modulo_gestion.sql
-- Módulo de gestión: daños con confirmación, alertas de reposición,
-- ajustes de inventario y órdenes de compra.
-- Ejecutar una sola vez sobre la BD proyecto_marcos_web.
-- =====================================================================

-- ---------------------------------------------------------------------
-- producto: unidad de medida y soft delete (si no existen)
-- ---------------------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'producto' AND column_name = 'unidad_medida');
SET @sql := IF(@col = 0,
    'ALTER TABLE producto ADD COLUMN unidad_medida VARCHAR(20) NOT NULL DEFAULT ''unidad'' AFTER precio_venta',
    'SELECT ''unidad_medida ya existe''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'producto' AND column_name = 'activo');
SET @sql := IF(@col = 0,
    'ALTER TABLE producto ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT ''activo ya existe''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- reporte_dano: estado y confirmación del administrador
-- ---------------------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'reporte_dano' AND column_name = 'id_producto');
SET @sql := IF(@col = 0,
    'ALTER TABLE reporte_dano ADD COLUMN id_producto INT NULL AFTER id_inventario',
    'SELECT ''id_producto ya existe''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'reporte_dano' AND column_name = 'estado');
SET @sql := IF(@col = 0,
    'ALTER TABLE reporte_dano ADD COLUMN estado ENUM(''PENDIENTE'',''CONFIRMADO'',''RECHAZADO'') NOT NULL DEFAULT ''PENDIENTE'' AFTER fecha',
    'SELECT ''estado ya existe''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'reporte_dano' AND column_name = 'id_confirmado_por');
SET @sql := IF(@col = 0,
    'ALTER TABLE reporte_dano ADD COLUMN id_confirmado_por INT NULL AFTER estado',
    'SELECT ''id_confirmado_por ya existe''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'reporte_dano' AND column_name = 'fecha_confirmacion');
SET @sql := IF(@col = 0,
    'ALTER TABLE reporte_dano ADD COLUMN fecha_confirmacion DATETIME NULL AFTER id_confirmado_por',
    'SELECT ''fecha_confirmacion ya existe''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill del producto y de los reportes antiguos (ya descontaban stock).
UPDATE reporte_dano r
  JOIN inventario i ON i.id = r.id_inventario
   SET r.id_producto = i.id_producto
 WHERE r.id_producto IS NULL;

UPDATE reporte_dano
   SET estado = 'CONFIRMADO',
       fecha_confirmacion = COALESCE(fecha_confirmacion, fecha)
 WHERE id_movimiento IS NOT NULL
   AND estado = 'PENDIENTE';

-- ---------------------------------------------------------------------
-- alerta_reposicion
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerta_reposicion (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    id_producto     INT NOT NULL,
    stock_momento   INT NOT NULL,
    stock_minimo    INT NOT NULL,
    estado          ENUM('PENDIENTE','GESTIONADA') NOT NULL DEFAULT 'PENDIENTE',
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gestionada_por  INT NULL,
    fecha_gestion   DATETIME NULL,
    CONSTRAINT fk_alerta_producto FOREIGN KEY (id_producto) REFERENCES producto(id),
    CONSTRAINT fk_alerta_usuario  FOREIGN KEY (gestionada_por) REFERENCES usuario(id),
    INDEX idx_alerta_estado (estado),
    INDEX idx_alerta_producto_estado (id_producto, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- ajuste_inventario
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ajuste_inventario (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    id_producto      INT NOT NULL,
    id_inventario    INT NOT NULL,
    cantidad_ajuste  INT NOT NULL,
    stock_anterior   INT NOT NULL,
    stock_nuevo      INT NOT NULL,
    motivo           VARCHAR(500) NULL,
    administrador_id INT NULL,
    fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ajuste_producto FOREIGN KEY (id_producto) REFERENCES producto(id),
    CONSTRAINT fk_ajuste_inventario FOREIGN KEY (id_inventario) REFERENCES inventario(id),
    CONSTRAINT fk_ajuste_usuario FOREIGN KEY (administrador_id) REFERENCES usuario(id),
    INDEX idx_ajuste_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- orden_compra
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_compra (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    id_alerta        INT NULL,
    id_producto      INT NOT NULL,
    id_proveedor     INT NULL,
    cantidad         INT NOT NULL,
    estado           ENUM('EMITIDA','RECIBIDA','ANULADA') NOT NULL DEFAULT 'EMITIDA',
    fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    administrador_id INT NULL,
    CONSTRAINT fk_orden_alerta FOREIGN KEY (id_alerta) REFERENCES alerta_reposicion(id),
    CONSTRAINT fk_orden_producto FOREIGN KEY (id_producto) REFERENCES producto(id),
    CONSTRAINT fk_orden_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id),
    CONSTRAINT fk_orden_usuario FOREIGN KEY (administrador_id) REFERENCES usuario(id),
    INDEX idx_orden_estado (estado),
    INDEX idx_orden_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
