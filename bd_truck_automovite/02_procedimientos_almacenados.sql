-- =====================================================================
-- Sistema de Inventario TRUCKS - Procedimientos Almacenados (FINAL)
-- Base de datos: bd_trucks  (MySQL 8.x)
--
-- Archivo consolidado que reemplaza los viejos 02, 04 y 07.
-- Contiene la version definitiva de todos los SPs, con soporte de
-- proveedores y marcas multiples (N:N) via JSON_TABLE.
--
-- Uso:  mysql -u root -p bd_trucks < 02_procedimientos_almacenados.sql
-- Requiere: bd_Trucks.sql + 01_indices_vistas.sql
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. sp_registrar_movimiento
-- Registra una entrada, salida o ajuste de inventario de forma atomica.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_movimiento;
DELIMITER $$
CREATE PROCEDURE sp_registrar_movimiento(
    IN  p_tipo           VARCHAR(10),
    IN  p_cantidad       INT,
    IN  p_id_inventario  INT,
    IN  p_id_usuario     INT,
    IN  p_observacion    TEXT,
    OUT p_movimiento_id  INT,
    OUT p_nuevo_stock    INT
)
BEGIN
    DECLARE v_stock_actual INT DEFAULT NULL;
    DECLARE v_nuevo        INT DEFAULT 0;
    DECLARE v_cantidad_reg INT DEFAULT 0;
    DECLARE v_msg          TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_tipo NOT IN ('entrada', 'salida', 'ajuste') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Tipo de movimiento invalido. Use: entrada, salida, ajuste';
    END IF;
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cantidad debe ser mayor a 0';
    END IF;

    SELECT stock_actual INTO v_stock_actual
      FROM inventario
     WHERE id = p_id_inventario
     FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        SET v_msg = CONCAT('Inventario id=', p_id_inventario, ' no encontrado');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF p_tipo = 'entrada' THEN
        SET v_nuevo = v_stock_actual + p_cantidad;
        SET v_cantidad_reg = p_cantidad;
    ELSEIF p_tipo = 'salida' THEN
        IF v_stock_actual < p_cantidad THEN
            SET v_msg = CONCAT('Stock insuficiente. Disponible: ', v_stock_actual,
                               ', solicitado: ', p_cantidad);
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
        SET v_nuevo = v_stock_actual - p_cantidad;
        SET v_cantidad_reg = p_cantidad;
    ELSE
        SET v_nuevo = p_cantidad;
        SET v_cantidad_reg = ABS(v_nuevo - v_stock_actual);
    END IF;

    START TRANSACTION;

    INSERT INTO movimiento_inventario (tipo, cantidad, fecha_hora, observacion, id_usuario, id_inventario)
    VALUES (p_tipo, v_cantidad_reg, NOW(), p_observacion, p_id_usuario, p_id_inventario);
    SET p_movimiento_id = LAST_INSERT_ID();

    UPDATE inventario SET stock_actual = v_nuevo WHERE id = p_id_inventario;
    SET p_nuevo_stock = v_nuevo;

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('movimiento_inventario', 'insert',
            CONCAT('Movimiento ', p_tipo, ' qty=', p_cantidad, ' inv=', p_id_inventario),
            p_movimiento_id, p_id_usuario);

    COMMIT;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 2. sp_crear_producto
-- Crea producto + proveedores (N:N) + marcas (N:N) en una transaccion.
-- p_id_proveedores y p_id_marcas son arrays JSON, ej: '[1,2,3]'
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_crear_producto;
DELIMITER $$
CREATE PROCEDURE sp_crear_producto(
    IN  p_nombre          VARCHAR(50),
    IN  p_codigo          VARCHAR(10),
    IN  p_precio_compra   DECIMAL(10,2),
    IN  p_precio_venta    DECIMAL(10,2),
    IN  p_utilidad        DECIMAL(5,2),
    IN  p_id_marca        INT,
    IN  p_id_categoria    INT,
    IN  p_id_proveedores  JSON,
    IN  p_id_marcas       JSON,
    IN  p_id_usuario      INT,
    OUT p_producto_id     INT
)
BEGIN
    DECLARE v_utilidad DECIMAL(5,2);
    DECLARE v_msg      TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_codigo IS NULL OR p_codigo = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El codigo es obligatorio';
    END IF;

    SET v_utilidad = IFNULL(p_utilidad, COALESCE(p_precio_venta - p_precio_compra, 0));

    START TRANSACTION;

    INSERT INTO producto (nombre, codigo, precio_compra, precio_venta, utilidad,
                          id_marca, id_categoria)
    VALUES (p_nombre, p_codigo, p_precio_compra, p_precio_venta, v_utilidad,
            p_id_marca, p_id_categoria);
    SET p_producto_id = LAST_INSERT_ID();

    INSERT INTO producto_proveedor (id_producto, id_proveedor)
    SELECT p_producto_id, j.prov
    FROM JSON_TABLE(IFNULL(p_id_proveedores, '[]'), '$[*]' COLUMNS (prov INT PATH '$')) AS j;

    INSERT IGNORE INTO producto_marca (id_producto, id_marca)
    SELECT p_producto_id, j.m
    FROM JSON_TABLE(IFNULL(p_id_marcas, '[]'), '$[*]' COLUMNS (m INT PATH '$')) AS j;

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('producto', 'insert', CONCAT('Producto creado: ', p_nombre), p_producto_id, p_id_usuario);

    COMMIT;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 3. sp_registrar_producto
-- Crea producto + inventario + proveedores + marcas en una transaccion.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_producto;
DELIMITER $$
CREATE PROCEDURE sp_registrar_producto(
    IN  p_nombre            VARCHAR(50),
    IN  p_codigo            VARCHAR(10),
    IN  p_precio_compra     DECIMAL(10,2),
    IN  p_precio_venta      DECIMAL(10,2),
    IN  p_id_marca          INT,
    IN  p_id_categoria      INT,
    IN  p_id_proveedores    JSON,
    IN  p_id_marcas         JSON,
    IN  p_stock_actual      INT,
    IN  p_stock_minimo      INT,
    IN  p_ubicacion         VARCHAR(50),
    IN  p_id_estado_producto INT,
    IN  p_id_usuario        INT,
    OUT p_producto_id       INT,
    OUT p_inventario_id     INT
)
BEGIN
    DECLARE v_utilidad      DECIMAL(5,2);
    DECLARE v_msg           TEXT;
    DECLARE v_ubicacion_id  INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_codigo IS NULL OR p_codigo = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El codigo es obligatorio';
    END IF;

    IF p_nombre IS NULL OR p_nombre = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre es obligatorio';
    END IF;

    IF p_ubicacion IS NOT NULL AND p_ubicacion <> '' THEN
        SELECT id INTO v_ubicacion_id FROM ubicacion WHERE ubicacion = p_ubicacion LIMIT 1;
        IF v_ubicacion_id IS NULL THEN
            INSERT INTO ubicacion (ubicacion) VALUES (p_ubicacion);
            SET v_ubicacion_id = LAST_INSERT_ID();
        END IF;
    END IF;

    SET p_stock_actual = IFNULL(p_stock_actual, 0);
    SET p_stock_minimo = IFNULL(p_stock_minimo, 0);
    SET v_utilidad = COALESCE(p_precio_venta - p_precio_compra, 0);

    START TRANSACTION;

    INSERT INTO producto (nombre, codigo, precio_compra, precio_venta, utilidad,
                          id_marca, id_categoria)
    VALUES (p_nombre, p_codigo, p_precio_compra, p_precio_venta, v_utilidad,
            p_id_marca, p_id_categoria);
    SET p_producto_id = LAST_INSERT_ID();

    INSERT INTO producto_proveedor (id_producto, id_proveedor)
    SELECT p_producto_id, j.prov
    FROM JSON_TABLE(IFNULL(p_id_proveedores, '[]'), '$[*]' COLUMNS (prov INT PATH '$')) AS j;

    INSERT IGNORE INTO producto_marca (id_producto, id_marca)
    SELECT p_producto_id, j.m
    FROM JSON_TABLE(IFNULL(p_id_marcas, '[]'), '$[*]' COLUMNS (m INT PATH '$')) AS j;

    INSERT INTO inventario (stock_actual, stock_minimo, id_producto, id_estado_producto, id_ubicacion)
    VALUES (p_stock_actual, p_stock_minimo, p_producto_id, p_id_estado_producto, v_ubicacion_id);
    SET p_inventario_id = LAST_INSERT_ID();

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('producto', 'insert', CONCAT('Producto creado: ', p_nombre), p_producto_id, p_id_usuario);

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('inventario', 'insert',
            CONCAT('Inventario inicial de producto id=', p_producto_id),
            p_inventario_id, p_id_usuario);

    COMMIT;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 4. sp_actualizar_producto
-- Actualiza producto + proveedores + marcas. Recalcula utilidad.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_actualizar_producto;
DELIMITER $$
CREATE PROCEDURE sp_actualizar_producto(
    IN  p_id              INT,
    IN  p_nombre          VARCHAR(50),
    IN  p_codigo          VARCHAR(10),
    IN  p_precio_compra   DECIMAL(10,2),
    IN  p_precio_venta    DECIMAL(10,2),
    IN  p_id_marca        INT,
    IN  p_id_categoria    INT,
    IN  p_id_proveedores  JSON,
    IN  p_id_marcas       JSON,
    IN  p_id_usuario      INT
)
BEGIN
    DECLARE v_actual_pc DECIMAL(10,2);
    DECLARE v_actual_pv DECIMAL(10,2);
    DECLARE v_msg       TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT precio_compra, precio_venta INTO v_actual_pc, v_actual_pv
      FROM producto WHERE id = p_id FOR UPDATE;

    IF v_actual_pc IS NULL THEN
        SET v_msg = CONCAT('Producto id=', p_id, ' no encontrado');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    START TRANSACTION;

    UPDATE producto SET
        nombre        = IFNULL(p_nombre, nombre),
        codigo        = IFNULL(p_codigo, codigo),
        precio_compra = IFNULL(p_precio_compra, precio_compra),
        precio_venta  = IFNULL(p_precio_venta, precio_venta),
        utilidad      = IFNULL(p_precio_venta, v_actual_pv) - IFNULL(p_precio_compra, v_actual_pc),
        id_marca      = IFNULL(p_id_marca, id_marca),
        id_categoria  = IFNULL(p_id_categoria, id_categoria)
    WHERE id = p_id;

    IF p_id_proveedores IS NOT NULL THEN
        DELETE FROM producto_proveedor WHERE id_producto = p_id;
        INSERT INTO producto_proveedor (id_producto, id_proveedor)
        SELECT p_id, j.prov
        FROM JSON_TABLE(p_id_proveedores, '$[*]' COLUMNS (prov INT PATH '$')) AS j;
    END IF;

    IF p_id_marcas IS NOT NULL THEN
        DELETE FROM producto_marca WHERE id_producto = p_id;
        INSERT IGNORE INTO producto_marca (id_producto, id_marca)
        SELECT p_id, j.m
        FROM JSON_TABLE(p_id_marcas, '$[*]' COLUMNS (m INT PATH '$')) AS j;
    END IF;

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('producto', 'update', CONCAT('Producto actualizado id=', p_id), p_id, p_id_usuario);

    COMMIT;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 5. sp_eliminar_producto
-- Elimina un producto (bloqueado si tiene inventario u otros datos).
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_eliminar_producto;
DELIMITER $$
CREATE PROCEDURE sp_eliminar_producto(
    IN p_id         INT,
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_msg    TEXT;

    DECLARE EXIT HANDLER FOR SQLSTATE '23000'
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede eliminar el producto: tiene inventario u otros datos asociados';
    END;

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

    DELETE FROM producto WHERE id = p_id;

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('producto', 'delete', CONCAT('Producto eliminado id=', p_id), p_id, p_id_usuario);

    COMMIT;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 6. sp_crear_usuario
-- Crea persona + usuario en una transaccion.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_crear_usuario;
DELIMITER $$
CREATE PROCEDURE sp_crear_usuario(
    IN  p_nombre          VARCHAR(100),
    IN  p_apellidos       VARCHAR(100),
    IN  p_dni             CHAR(8),
    IN  p_celular         CHAR(9),
    IN  p_usuario         VARCHAR(50),
    IN  p_contrasena      VARCHAR(255),
    IN  p_id_rol          INT,
    IN  p_id_usuario_audit INT,
    OUT p_usuario_id      INT
)
BEGIN
    DECLARE v_persona_id INT;
    DECLARE v_msg        TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_dni IS NULL OR p_dni = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El DNI es obligatorio';
    END IF;

    IF EXISTS (SELECT 1 FROM usuario WHERE usuario = p_usuario) THEN
        SET v_msg = CONCAT('El usuario ''', p_usuario, ''' ya existe');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF EXISTS (SELECT 1 FROM persona WHERE dni = p_dni) THEN
        SET v_msg = CONCAT('El DNI ''', p_dni, ''' ya esta registrado');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    START TRANSACTION;

    INSERT INTO persona (nombre, apellidos, dni, celular)
    VALUES (p_nombre, p_apellidos, p_dni, p_celular);
    SET v_persona_id = LAST_INSERT_ID();

    INSERT INTO usuario (usuario, contrasena, id_persona, id_rol)
    VALUES (p_usuario, p_contrasena, v_persona_id, p_id_rol);
    SET p_usuario_id = LAST_INSERT_ID();

    INSERT INTO auditoria (tabla_afectada, accion, descripcion, id_registro, id_usuario)
    VALUES ('usuario', 'insert', CONCAT('Usuario creado: ', p_usuario), p_usuario_id, p_id_usuario_audit);

    COMMIT;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7. sp_productos_bajo_stock
-- Productos cuyo stock actual <= stock minimo.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_productos_bajo_stock;
DELIMITER $$
CREATE PROCEDURE sp_productos_bajo_stock()
BEGIN
    SELECT codigo, producto, marca, categoria, stock_actual, stock_minimo, estado, ubicacion
      FROM v_stock_general
     WHERE alerta = 1
     ORDER BY producto;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 8. sp_reporte_stock
-- Reporte general de stock por producto/ubicacion.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_reporte_stock;
DELIMITER $$
CREATE PROCEDURE sp_reporte_stock()
BEGIN
    SELECT codigo, producto, marca, categoria, stock_actual, stock_minimo,
           estado, ubicacion, alerta
      FROM v_stock_general
     ORDER BY alerta DESC, producto;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 9. sp_reporte_valor_inventario
-- Valores totales de inventario (compra, venta y utilidad potencial).
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_reporte_valor_inventario;
DELIMITER $$
CREATE PROCEDURE sp_reporte_valor_inventario()
BEGIN
    SELECT COALESCE(SUM(valor_compra), 0)           AS valor_compra,
           COALESCE(SUM(valor_venta), 0)            AS valor_venta,
           COALESCE(SUM(utilidad_potencial), 0)     AS utilidad_potencial,
           COUNT(DISTINCT id_inventario)            AS total_productos
      FROM v_valor_inventario;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 10. sp_reporte_movimientos_resumen
-- Resumen de movimientos por tipo, con rango de fechas opcional.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_reporte_movimientos_resumen;
DELIMITER $$
CREATE PROCEDURE sp_reporte_movimientos_resumen(
    IN p_fecha_desde DATETIME,
    IN p_fecha_hasta DATETIME
)
BEGIN
    SELECT tipo,
           COUNT(*)       AS total_movimientos,
           SUM(cantidad)  AS cantidad_total
      FROM movimiento_inventario
     WHERE (p_fecha_desde IS NULL OR fecha_hora >= p_fecha_desde)
       AND (p_fecha_hasta IS NULL OR fecha_hora <= p_fecha_hasta)
     GROUP BY tipo;
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 11. sp_buscar_productos
-- Busqueda paginada con filtros. Devuelve marcas_nombres agrupadas.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_buscar_productos;
DELIMITER $$
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

    SELECT p.id, p.nombre, p.codigo, p.precio_compra, p.precio_venta, p.utilidad,
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
END $$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 12. sp_listar_auditoria
-- Registro de auditoria paginado con filtros.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_listar_auditoria;
DELIMITER $$
CREATE PROCEDURE sp_listar_auditoria(
    IN p_tabla        VARCHAR(50),
    IN p_accion       VARCHAR(10),
    IN p_id_usuario   INT,
    IN p_fecha_desde  DATETIME,
    IN p_fecha_hasta  DATETIME,
    IN p_pagina       INT,
    IN p_cantidad     INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;

    SET p_pagina   = IFNULL(p_pagina, 1);
    SET p_cantidad = IFNULL(p_cantidad, 50);
    SET v_offset = (p_pagina - 1) * p_cantidad;

    SELECT a.id, a.tabla_afectada, a.accion, a.fecha_hora, a.descripcion,
           a.id_registro, a.id_usuario, u.usuario AS usuario_nombre
      FROM auditoria a
      LEFT JOIN usuario u ON u.id = a.id_usuario
     WHERE (p_tabla IS NULL OR p_tabla = '' OR a.tabla_afectada = p_tabla)
       AND (p_accion IS NULL OR p_accion = '' OR a.accion = p_accion)
       AND (p_id_usuario IS NULL OR a.id_usuario = p_id_usuario)
       AND (p_fecha_desde IS NULL OR a.fecha_hora >= p_fecha_desde)
       AND (p_fecha_hasta IS NULL OR a.fecha_hora <= p_fecha_hasta)
     ORDER BY a.fecha_hora DESC
     LIMIT p_cantidad OFFSET v_offset;
END $$
DELIMITER ;

-- =====================================================================
-- FIN DEL ARCHIVO
-- =====================================================================
