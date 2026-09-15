-- =====================================================================
-- Migración 08: Soft delete en producto
-- Agrega campo `activo` y modifica sp_eliminar_producto para ocultar
-- en vez de borrar, manteniendo registros en ventas y movimientos.
-- =====================================================================

-- 1. Agregar campo activo a producto (si no existe)
SET @existe = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'producto'
      AND COLUMN_NAME = 'activo'
);
SET @sql = IF(@existe = 0,
    'ALTER TABLE producto ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER imagen_url',
    'SELECT "campo activo ya existe" AS resultado'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Modificar sp_eliminar_producto → soft delete
DROP PROCEDURE IF EXISTS sp_eliminar_producto;
DELIMITER $$
CREATE PROCEDURE sp_eliminar_producto(
    IN p_id         INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_msg    TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT COUNT(*) INTO v_existe FROM producto WHERE id = p_id;
    IF v_existe = 0 THEN
        SET v_msg = CONCAT('Producto id=', p_id, ' no encontrado');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    START TRANSACTION;

    UPDATE producto SET activo = 0 WHERE id = p_id;

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('producto', 'delete', CONCAT('Soft delete: producto id=', p_id), p_id, p_id_usuario);

    COMMIT;
END $$
DELIMITER ;

-- 3. Actualizar sp_buscar_productos para excluir inactivos
DROP PROCEDURE IF EXISTS sp_buscar_productos;
DELIMITER $$
CREATE PROCEDURE sp_buscar_productos(
    IN p_busqueda    VARCHAR(100),
    IN p_id_marca    INT,
    IN p_id_categoria INT,
    IN p_page        INT,
    IN p_per_page    INT
)
BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_per_page;

    SELECT SQL_CALC_FOUND_ROWS
        p.id, p.codigo, p.nombre, p.precio_compra, p.precio_venta,
        p.utilidad, p.imagen_url, p.id_marca,
        m.nombre AS marca_nombre,
        c.nombre AS categoria_nombre,
        COALESCE(
            (SELECT GROUP_CONCAT(m2.nombre ORDER BY m2.id SEPARATOR ', ')
               FROM producto_marca pm
               JOIN marca m2 ON m2.id = pm.id_marca
              WHERE pm.id_producto = p.id),
            m.nombre) AS marcas_nombres
    FROM producto p
    LEFT JOIN marca m ON m.id = p.id_marca
    LEFT JOIN categoria c ON c.id = p.id_categoria
    WHERE p.activo = 1
      AND (p_busqueda IS NULL OR p_busqueda = '' OR p.nombre LIKE CONCAT('%', p_busqueda, '%') OR p.codigo LIKE CONCAT('%', p_busqueda, '%'))
      AND (p_id_marca IS NULL OR p.id_marca = p_id_marca)
      AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
    ORDER BY p.id DESC
    LIMIT p_per_page OFFSET v_offset;

    -- Total de registros encontrados
    SELECT FOUND_ROWS() AS total;
END $$
DELIMITER ;

-- 4. Actualizar vista v_stock_general para excluir inactivos
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
  LEFT JOIN ubicacion u      ON u.id = i.id_ubicacion
 WHERE p.activo = 1;

-- 5. Actualizar vista v_valor_inventario para excluir inactivos
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
  JOIN producto p ON p.id = i.id_producto
 WHERE p.activo = 1;
