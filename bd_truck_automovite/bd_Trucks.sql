-- =====================================================================
-- Sistema de Inventario TRUCKS - Esquema completo
-- Base de datos: bd_Trucks  (MySQL 8.x)
--
-- Este archivo crea la base de datos y TODAS las tablas en su estado
-- final (18 tablas). Ejecutar este archivo para una instalacion desde cero.
--
-- Uso:  mysql -u root -p < bd_Trucks.sql
-- =====================================================================

DROP DATABASE IF EXISTS bd_Trucks;
CREATE DATABASE bd_Trucks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bd_Trucks;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. rol
-- ---------------------------------------------------------------------
CREATE TABLE rol (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. persona
-- ---------------------------------------------------------------------
CREATE TABLE persona (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    dni      CHAR(8) NOT NULL,
    celular  CHAR(9)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. usuario
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    usuario    VARCHAR(50) NOT NULL,
    contrasena VARCHAR(256),
    id_persona INT,
    id_rol     INT,
    foto       VARCHAR(255) DEFAULT NULL,
    privilegio VARCHAR(50) DEFAULT NULL,
    token_ver  INT NOT NULL DEFAULT 0,
    activo     TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY usuario (usuario),
    CONSTRAINT FK_usuario_persona FOREIGN KEY (id_persona)
        REFERENCES persona(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_usuario_rol FOREIGN KEY (id_rol)
        REFERENCES rol(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. auditoria
-- ---------------------------------------------------------------------
CREATE TABLE auditoria (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    accion         ENUM('insert','update','delete','login','logout') NOT NULL,
    fecha_hora     DATETIME DEFAULT CURRENT_TIMESTAMP,
    descripcion    TEXT,
    id_registro    INT,
    id_usuario     INT NOT NULL,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. marca
-- ---------------------------------------------------------------------
CREATE TABLE marca (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. estado_producto
-- ---------------------------------------------------------------------
CREATE TABLE estado_producto (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. ubicacion
-- ---------------------------------------------------------------------
CREATE TABLE ubicacion (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    ubicacion   VARCHAR(50),
    descripcion TEXT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. proveedor
-- ---------------------------------------------------------------------
CREATE TABLE proveedor (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    ruc    CHAR(11),
    UNIQUE KEY uk_proveedor_ruc (ruc)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. categoria
-- ---------------------------------------------------------------------
CREATE TABLE categoria (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. producto
-- ---------------------------------------------------------------------
CREATE TABLE producto (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(150),
    codigo         VARCHAR(10) NOT NULL,
    precio_compra  DECIMAL(10,2),
    precio_venta   DECIMAL(10,2),
    utilidad       DECIMAL(5,2),
    imagen_url     VARCHAR(255) NULL,
    id_marca       INT,
    id_categoria   INT,
    CONSTRAINT FK_producto_marca FOREIGN KEY (id_marca)
        REFERENCES marca(id),
    CONSTRAINT FK_producto_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. producto_proveedor (N:N)
-- ---------------------------------------------------------------------
CREATE TABLE producto_proveedor (
    id_producto  INT NOT NULL,
    id_proveedor INT NOT NULL,
    PRIMARY KEY (id_producto, id_proveedor),
    CONSTRAINT FK_pp_producto  FOREIGN KEY (id_producto)  REFERENCES producto(id)  ON DELETE CASCADE,
    CONSTRAINT FK_pp_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. producto_marca (N:N)
-- ---------------------------------------------------------------------
CREATE TABLE producto_marca (
    id_producto INT NOT NULL,
    id_marca    INT NOT NULL,
    PRIMARY KEY (id_producto, id_marca),
    CONSTRAINT FK_pm_producto FOREIGN KEY (id_producto)
        REFERENCES producto(id) ON DELETE CASCADE,
    CONSTRAINT FK_pm_marca FOREIGN KEY (id_marca)
        REFERENCES marca(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. inventario
-- ---------------------------------------------------------------------
CREATE TABLE inventario (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    stock_actual       INT,
    stock_minimo       INT,
    id_producto        INT,
    id_estado_producto INT,
    id_ubicacion       INT,
    CONSTRAINT FK_inventario_producto FOREIGN KEY (id_producto)
        REFERENCES producto(id),
    CONSTRAINT FK_inventario_estadopro FOREIGN KEY (id_estado_producto)
        REFERENCES estado_producto(id),
    CONSTRAINT FK_inventario_ubicacion FOREIGN KEY (id_ubicacion)
        REFERENCES ubicacion(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. movimiento_inventario
-- ---------------------------------------------------------------------
CREATE TABLE movimiento_inventario (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    tipo          ENUM('entrada','salida','ajuste') NOT NULL,
    cantidad      INT,
    fecha_hora    DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion   TEXT,
    id_usuario    INT,
    id_inventario INT,
    CONSTRAINT FK_movimiento_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id),
    CONSTRAINT FK_movimientoi_inventario FOREIGN KEY (id_inventario)
        REFERENCES inventario(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. componente_producto
-- ---------------------------------------------------------------------
CREATE TABLE componente_producto (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    cantidad         INT,
    id_producto_padre INT NOT NULL,
    id_producto_hijo  INT NOT NULL,
    CONSTRAINT FK_componentep_producto FOREIGN KEY (id_producto_padre)
        REFERENCES producto(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_componentep_producto_hijo FOREIGN KEY (id_producto_hijo)
        REFERENCES producto(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 16. tipo_documento
-- ---------------------------------------------------------------------
CREATE TABLE tipo_documento (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 17. cliente
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(120) NOT NULL,
    apellidos      VARCHAR(120) DEFAULT NULL,
    ruc_dni        VARCHAR(20) NOT NULL,
    celular        VARCHAR(15) DEFAULT NULL,
    email          VARCHAR(120) DEFAULT NULL,
    direccion      VARCHAR(200) DEFAULT NULL,
    activo         TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cliente_ruc_dni (ruc_dni)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 18. venta
-- ---------------------------------------------------------------------
CREATE TABLE venta (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente         INT DEFAULT NULL,
    nombre_cliente     VARCHAR(120),
    ruc_dni            VARCHAR(20),
    id_producto        INT,
    cantidad           INT NOT NULL DEFAULT 1,
    moneda             VARCHAR(10) NOT NULL DEFAULT '$',
    tasa_cambio        DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    precio_unitario    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_final       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    medio_pago         VARCHAR(60),
    numero_documento   VARCHAR(50),
    destino            VARCHAR(120),
    agencia_devolucion VARCHAR(120),
    punto_recogo       VARCHAR(120),
    adicionales        VARCHAR(255),
    id_tipo_documento  INT,
    observaciones      TEXT,
    costo_envio        DECIMAL(10,2) DEFAULT 0.00,
    plazos             INT DEFAULT 1,
    cuotas_pagadas     INT NOT NULL DEFAULT 0,
    estado_pago        ENUM('pendiente','pagado') NOT NULL DEFAULT 'pagado',
    fecha_hora         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario         INT NOT NULL,
    CONSTRAINT fk_venta_cliente    FOREIGN KEY (id_cliente)         REFERENCES cliente(id)             ON DELETE SET NULL,
    CONSTRAINT fk_venta_producto   FOREIGN KEY (id_producto)       REFERENCES producto(id)            ON DELETE SET NULL,
    CONSTRAINT fk_venta_tipo_doc   FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id)      ON DELETE SET NULL,
    CONSTRAINT fk_venta_usuario    FOREIGN KEY (id_usuario)        REFERENCES usuario(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 19. reporte_dano
-- ---------------------------------------------------------------------
CREATE TABLE reporte_dano (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    id_inventario  INT NOT NULL,
    id_movimiento  INT NULL,
    cantidad       INT NOT NULL,
    descripcion    VARCHAR(500) NULL,
    evidencia_url  VARCHAR(255) NULL,
    id_usuario     INT NULL,
    fecha          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rd_inventario FOREIGN KEY (id_inventario) REFERENCES inventario(id),
    CONSTRAINT fk_rd_movimiento FOREIGN KEY (id_movimiento) REFERENCES movimiento_inventario(id),
    CONSTRAINT fk_rd_usuario    FOREIGN KEY (id_usuario)    REFERENCES usuario(id)
) ENGINE=InnoDB;

CREATE TABLE configuracion (
    id             INT PRIMARY KEY,
    nombre         VARCHAR(50) NOT NULL UNIQUE,
    valor          VARCHAR(100) NOT NULL,
    actualizado_por INT NULL,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO configuracion (id, nombre, valor)
VALUES (1, 'tasa_cambio', '3.4')
ON DUPLICATE KEY UPDATE valor = valor;

-- =====================================================================
-- FIN DEL ARCHIVO
-- =====================================================================
