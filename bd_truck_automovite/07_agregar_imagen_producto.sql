-- 07_agregar_imagen_producto.sql
-- Agrega columna imagen_url a producto y actualiza sp_buscar_productos.

SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'producto'
      AND COLUMN_NAME = 'imagen_url'
);

SET @sql = IF(@exists = 0,
    'ALTER TABLE producto ADD COLUMN imagen_url VARCHAR(255) NULL AFTER utilidad',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP PROCEDURE IF EXISTS sp_buscar_productos;

DELIMITER //
CREATE PROCEDURE sp_buscar_productos(
    IN p_busqueda      VARCHAR(100),
    IN p_id_marca      INT,
    IN p_id_categoria  INT,
    IN p_pagina        INT,
    IN p_cantidad      INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;

    SET p_pagina   = IFNULL(p_pagina, 1);
    SET p_cantidad = IFNULL(p_cantidad, 20);
    IF p_pagina < 1 THEN SET p_pagina = 1; END IF;
    IF p_cantidad < 1 THEN SET p_cantidad = 20; END IF;
    SET v_offset = (p_pagina - 1) * p_cantidad;

    SELECT p.id, p.nombre, p.codigo, p.precio_compra, p.precio_venta, p.utilidad, p.imagen_url, p.id_marca,
           m.nombre AS marca_nombre, c.nombre AS categoria_nombre,
           pr.nombre AS proveedor_nombre,
           COALESCE(
               (SELECT GROUP_CONCAT(m2.nombre ORDER BY m2.id SEPARATOR ', ')
                  FROM producto_marca pm
                  JOIN marca m2 ON m2.id = pm.id_marca
                 WHERE pm.id_producto = p.id),
               m.nombre) AS marcas_nombres,
           i.id AS id_inventario, i.stock_actual, i.stock_minimo,
           u.ubicacion AS ubicacion_nombre
      FROM producto p
      LEFT JOIN marca m     ON m.id = p.id_marca
      LEFT JOIN categoria c ON c.id = p.id_categoria
      LEFT JOIN (
          SELECT id_producto, MIN(id_proveedor) AS id_proveedor
          FROM producto_proveedor GROUP BY id_producto
      ) pp ON pp.id_producto = p.id
      LEFT JOIN proveedor pr ON pr.id = pp.id_proveedor
      LEFT JOIN inventario i ON i.id_producto = p.id
      LEFT JOIN ubicacion u  ON u.id = i.id_ubicacion
     WHERE (p_busqueda IS NULL OR p_busqueda = ''
            OR p.nombre LIKE CONCAT('%', p_busqueda, '%')
            OR p.codigo LIKE CONCAT('%', p_busqueda, '%'))
       AND (p_id_marca IS NULL OR p.id_marca = p_id_marca)
       AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
     ORDER BY p.nombre
     LIMIT p_cantidad OFFSET v_offset;
END //
DELIMITER ;
