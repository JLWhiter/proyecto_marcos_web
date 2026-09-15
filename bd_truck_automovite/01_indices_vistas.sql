-- =====================================================================
-- Sistema de Inventario TRUCKS - Indices y Vistas de Optimizacion
-- Base de datos: bd_trucks  (MySQL 8.x)
--
-- Archivo: 01_indices_vistas.sql
-- Descripcion:
--   * sp_crear_indice : utilidad idempotente que crea indices solo si
--                       no existen (MySQL no soporta IF NOT EXISTS).
--   * Indices          : optimizan busquedas, ordenamientos y filtros
--                       de los endpoints mas usados.
--   * Vistas           : consultas pre-armadas de uso frecuente
--                       (reportes, detalle de inventario, etc.).
--
-- Uso:  mysql -u root -p bd_trucks < 01_indices_vistas.sql
--       (ejecutar ANTES de 02_procedimientos_almacenados.sql)
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Utilidad: sp_crear_indice
-- Crea un indice si no existe. p_unico = 1 para UNIQUE.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_crear_indice;
DELIMITER $$
CREATE PROCEDURE sp_crear_indice(
    IN p_tabla    VARCHAR(64),
    IN p_indice   VARCHAR(64),
    IN p_columnas VARCHAR(255),
    IN p_unico    TINYINT
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;

    SELECT COUNT(*) INTO v_existe
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name   = p_tabla
       AND index_name   = p_indice;

    IF v_existe = 0 THEN
        IF p_unico = 1 THEN
            SET @sql = CONCAT('CREATE UNIQUE INDEX `', p_indice, '` ON `', p_tabla, '` (', p_columnas, ')');
        ELSE
            SET @sql = CONCAT('CREATE INDEX `', p_indice, '` ON `', p_tabla, '` (', p_columnas, ')');
        END IF;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$
DELIMITER ;

-- =====================================================================
-- INDICES
-- =====================================================================

-- producto: busqueda por nombre + filtros de listado
CALL sp_crear_indice('producto', 'idx_producto_nombre', '`nombre`', 0);

-- inventario: reporte de bajo stock y filtros por ubicacion/estado
CALL sp_crear_indice('inventario', 'idx_inventario_stock', '`stock_actual`, `stock_minimo`', 0);
CALL sp_crear_indice('inventario', 'idx_inventario_ubicacion_estado', '`id_ubicacion`, `id_estado_producto`', 0);

-- movimiento_inventario: listado, reportes por tipo y rangos de fecha
CALL sp_crear_indice('movimiento_inventario', 'idx_mov_fecha_hora', '`fecha_hora`', 0);
CALL sp_crear_indice('movimiento_inventario', 'idx_mov_tipo_fecha', '`tipo`, `fecha_hora`', 0);
CALL sp_crear_indice('movimiento_inventario', 'idx_mov_inventario_fecha', '`id_inventario`, `fecha_hora`', 0);
CALL sp_crear_indice('movimiento_inventario', 'idx_mov_usuario_fecha', '`id_usuario`, `fecha_hora`', 0);

-- auditoria: listado paginado con filtros y orden por fecha
CALL sp_crear_indice('auditoria', 'idx_aud_fecha_hora', '`fecha_hora`', 0);
CALL sp_crear_indice('auditoria', 'idx_aud_tabla_accion', '`tabla_afectada`, `accion`', 0);

-- persona: regla de negocio DNI unico (aplicada en el backend)
CALL sp_crear_indice('persona', 'idx_persona_dni', '`dni`', 1);

-- catalogos: busqueda por nombre
CALL sp_crear_indice('marca', 'idx_marca_nombre', '`nombre`', 0);
CALL sp_crear_indice('proveedor', 'idx_proveedor_nombre', '`nombre`', 0);
CALL sp_crear_indice('ubicacion', 'idx_ubicacion_ubicacion', '`ubicacion`', 0);
CALL sp_crear_indice('categoria', 'idx_categoria_nombre', '`nombre`', 0);
CALL sp_crear_indice('estado_producto', 'idx_estado_nombre', '`nombre`', 0);
CALL sp_crear_indice('tipo_documento', 'idx_tipo_doc_nombre', '`nombre`', 0);

-- producto_marca: buscar marcas por producto y viceversa
CALL sp_crear_indice('producto_marca', 'idx_pm_producto', '`id_producto`', 0);
CALL sp_crear_indice('producto_marca', 'idx_pm_marca', '`id_marca`', 0);

-- =====================================================================
-- VISTAS (solo las utilizadas por procedimientos almacenados)
-- =====================================================================

-- 1. Reporte general de stock (usado por sp_productos_bajo_stock, sp_reporte_stock)
CREATE OR REPLACE VIEW v_stock_general AS
SELECT p.codigo,
       p.nombre AS producto,
       m.nombre AS marca,
       c.nombre AS categoria,
       i.stock_actual,
       i.stock_minimo,
       e.nombre AS estado,
       u.ubicacion,
       CASE WHEN i.stock_actual <= i.stock_minimo THEN 1 ELSE 0 END AS alerta
  FROM inventario i
  JOIN producto p ON p.id = i.id_producto
  LEFT JOIN marca m          ON m.id = p.id_marca
  LEFT JOIN categoria c      ON c.id = p.id_categoria
  LEFT JOIN estado_producto e ON e.id = i.id_estado_producto
  LEFT JOIN ubicacion u      ON u.id = i.id_ubicacion;

-- 2. Valoracion del inventario por producto (usado por sp_reporte_valor_inventario)
CREATE OR REPLACE VIEW v_valor_inventario AS
SELECT i.id AS id_inventario,
       p.codigo,
       p.nombre AS producto,
       i.stock_actual,
       p.precio_compra,
       p.precio_venta,
       p.utilidad,
       ROUND(i.stock_actual * p.precio_compra, 2) AS valor_compra,
       ROUND(i.stock_actual * p.precio_venta, 2)  AS valor_venta,
       ROUND(i.stock_actual * p.utilidad, 2)      AS utilidad_potencial
  FROM inventario i
  JOIN producto p ON p.id = i.id_producto;

-- =====================================================================
-- FIN DEL ARCHIVO
-- =====================================================================
