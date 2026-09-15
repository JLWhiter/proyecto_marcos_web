# Base de Datos del Sistema de Inventario TRUCKS

Base de datos MySQL `bd_trucks` del backend `backend_sistema_inventario_trucks`.

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `bd_Trucks.sql` | Esquema completo (18 tablas, instalacion desde cero). |
| `00_inserts_completo.sql` | Datos semilla (marcas, proveedores, ubicaciones, productos, inventario, etc.). |
| `01_indices_vistas.sql` | **Indices** de optimizacion + **vistas** de consulta. **Ejecutar primero.** |
| `02_procedimientos_almacenados.sql` | **Procedimientos almacenados** consolidados (logica de negocio). |

## Como cargar

Desde una terminal:

```sh
mysql -u root -p < bd_Trucks.sql
mysql -u root -p bd_Trucks < 00_inserts_completo.sql
mysql -u root -p bd_Trucks < 01_indices_vistas.sql
mysql -u root -p bd_Trucks < 02_procedimientos_almacenados.sql
```

O desde MySQL Workbench: abrir cada archivo y ejecutar en orden.

Los scripts son **idempotentes** (DROP IF EXISTS antes de cada CREATE).

> `01_indices_vistas.sql` debe ejecutarse ANTES de `02_procedimientos_almacenados.sql` porque algunos SPs usan las vistas.

---

## Tablas (18)

| # | Tabla | Descripcion |
|---|-------|-------------|
| 1 | `rol` | Roles del sistema (Administrador, Recepcion, Almacenamiento) |
| 2 | `persona` | Datos personales de los usuarios |
| 3 | `usuario` | Credenciales y estado de usuarios |
| 4 | `auditoria` | Registro de auditoria de todas las operaciones |
| 5 | `marca` | Marcas de productos |
| 6 | `estado_producto` | Estado del producto (Nuevo, Seminuevo, Danado) |
| 7 | `ubicacion` | Ubicaciones fisicas en almacen |
| 8 | `proveedor` | Proveedores (RUC unico) |
| 9 | `categoria` | Categorias de productos |
| 10 | `producto` | Catalogo de productos |
| 11 | `producto_proveedor` | Relacion N:N producto <-> proveedor |
| 12 | `producto_marca` | Relacion N:N producto <-> marca (un producto puede tener varias marcas) |
| 13 | `inventario` | Stock actual por producto y ubicacion |
| 14 | `movimiento_inventario` | Entradas, salidas y ajustes de stock |
| 15 | `componente_producto` | Relacion padre-hijo (BOM / listas de materiales) |
| 16 | `tipo_documento` | Tipos de documento (DNI, RUC, CE, etc.) |
| 17 | `venta` | Registro de ventas |
| 18 | `reporte_dano` | Reportes de productos danados |

---

## Procedimientos Almacenados

### sp_registrar_movimiento
Registra una **entrada**, **salida** o **ajuste** de inventario de forma atomica: valida tipo y cantidad, bloquea la fila de inventario (`SELECT ... FOR UPDATE`), actualiza el stock y deja trazabilidad en `auditoria`.

```sql
CALL sp_registrar_movimiento('entrada', 10, 1, 1, 'Compra', @mov_id, @nuevo_stock);
```

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `p_tipo` | VARCHAR(10) | `entrada`, `salida` o `ajuste`. |
| `p_cantidad` | INT | Cantidad (> 0). En `ajuste` es el nuevo stock absoluto. |
| `p_id_inventario` | INT | ID del registro de inventario. |
| `p_id_usuario` | INT | Usuario que realiza el movimiento (auditoria). |
| `p_observacion` | TEXT | Observacion opcional. |
| `p_movimiento_id` | INT OUT | ID del movimiento creado. |
| `p_nuevo_stock` | INT OUT | Stock resultante. |

### sp_crear_producto
Crea un producto con **proveedores y marcas multiples** (N:N via JSON).

```sql
CALL sp_crear_producto('Rodamiento SKF', 'RSK-001', 15.00, 25.00, NULL,
                       1, 1, '[1,3]', '[1,22]', 1, @prod_id);
```

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `p_nombre` | VARCHAR(50) | Nombre del producto. |
| `p_codigo` | VARCHAR(10) | Codigo unico. |
| `p_precio_compra` | DECIMAL(10,2) | Precio de compra. |
| `p_precio_venta` | DECIMAL(10,2) | Precio de venta. |
| `p_utilidad` | DECIMAL(5,2) | Utilidad; si es `NULL` se calcula `venta - compra`. |
| `p_id_marca` | INT | Marca principal (FK a `marca`). |
| `p_id_categoria` | INT | Categoria (FK a `categoria`). |
| `p_id_proveedores` | JSON | Array de IDs de proveedores, ej: `[1,3,5]`. |
| `p_id_marcas` | JSON | Array de IDs de marcas adicionales, ej: `[1,22]`. |
| `p_id_usuario` | INT | Usuario que crea (auditoria). |
| `p_producto_id` | INT OUT | ID del producto creado. |

### sp_registrar_producto
Crea producto + inventario inicial + proveedores + marcas en una sola transaccion.

```sql
CALL sp_registrar_producto('Filtro de aceite', 'FA-001', 15.00, 25.00,
                           10, 6, '[1,3]', '[10]', 50, 10,
                           'C1', 1, 1, @prod_id, @inv_id);
```

### sp_actualizar_producto
Actualiza un producto y sus relaciones (proveedores + marcas). Recalcula utilidad.

```sql
CALL sp_actualizar_producto(1, 'Rodamiento SKF 6205', 'RSK-005',
                            18.00, 30.00, 1, 1, '[1,3,8]', '[1,22]', 1);
```

### sp_eliminar_producto
Elimina un producto (bloqueado si tiene inventario u otros datos asociados via FK).

```sql
CALL sp_eliminar_producto(460, 1);
```

### sp_crear_usuario
Crea persona + usuario en una transaccion, validando DNI y nombre de usuario unicos.

```sql
CALL sp_crear_usuario('Juan', 'Perez', '12345678', '999888777',
                      'jperez', '<hash_bcrypt>', 2, 1, @usuario_id);
```

### sp_productos_bajo_stock
Productos cuyo stock actual <= stock minimo.

```sql
CALL sp_productos_bajo_stock();
```

### sp_reporte_stock
Reporte general de stock por producto/ubicacion.

```sql
CALL sp_reporte_stock();
```

### sp_reporte_valor_inventario
Valores totales de inventario: valor a costo, valor a venta y utilidad potencial.

```sql
CALL sp_reporte_valor_inventario();
```

### sp_reporte_movimientos_resumen
Resumen de movimientos agrupados por tipo, con rango de fechas opcional.

```sql
CALL sp_reporte_movimientos_resumen('2026-01-01', '2026-12-31');
CALL sp_reporte_movimientos_resumen(NULL, NULL);
```

### sp_buscar_productos
Busqueda paginada de productos con filtros. Devuelve `marcas_nombres` agrupadas (todas las marcas del producto).

```sql
CALL sp_buscar_productos('filtro', NULL, NULL, 1, 20);
```

### sp_listar_auditoria
Registro de auditoria paginado con filtros.

```sql
CALL sp_listar_auditoria('producto', 'insert', 1, NULL, NULL, 1, 50);
```

---

## Vistas

Solo se mantienen las vistas utilizadas por procedimientos almacenados.

| Vista | Descripcion |
|-------|-------------|
| `v_stock_general` | Reporte general de stock con flag de alerta (usada por `sp_productos_bajo_stock`, `sp_reporte_stock`). |
| `v_valor_inventario` | Valoracion por producto (costo, venta, utilidad potencial) (usada por `sp_reporte_valor_inventario`). |

---

## Indices

Optimizan los endpoints mas usados del backend.

| Tabla | Indice | Columnas |
|-------|--------|----------|
| `producto` | `idx_producto_nombre` | `nombre` |
| `inventario` | `idx_inventario_stock` | `stock_actual, stock_minimo` |
| `inventario` | `idx_inventario_ubicacion_estado` | `id_ubicacion, id_estado_producto` |
| `movimiento_inventario` | `idx_mov_fecha_hora` | `fecha_hora` |
| `movimiento_inventario` | `idx_mov_tipo_fecha` | `tipo, fecha_hora` |
| `movimiento_inventario` | `idx_mov_inventario_fecha` | `id_inventario, fecha_hora` |
| `movimiento_inventario` | `idx_mov_usuario_fecha` | `id_usuario, fecha_hora` |
| `auditoria` | `idx_aud_fecha_hora` | `fecha_hora` |
| `auditoria` | `idx_aud_tabla_accion` | `tabla_afectada, accion` |
| `persona` | `idx_persona_dni` (UNIQUE) | `dni` |
| `marca` | `idx_marca_nombre` | `nombre` |
| `proveedor` | `idx_proveedor_nombre` | `nombre` |
| `ubicacion` | `idx_ubicacion_ubicacion` | `ubicacion` |
| `categoria` | `idx_categoria_nombre` | `nombre` |
| `estado_producto` | `idx_estado_nombre` | `nombre` |
| `tipo_documento` | `idx_tipo_doc_nombre` | `nombre` |
| `producto_marca` | `idx_pm_producto` | `id_producto` |
| `producto_marca` | `idx_pm_marca` | `id_marca` |

---

## Notas

- Los procedimientos usan `SIGNAL SQLSTATE '45000'` para errores de negocio.
- `sp_registrar_movimiento` hace `SELECT ... FOR UPDATE` para serializar movimientos concurrentes sobre el mismo inventario.
- Los SPs de producto soportan **proveedores y marcas multiples** via arrays JSON (`p_id_proveedores`, `p_id_marcas`).
- El backend consume los procedimientos via `DatabaseFactory.call_procedure()`.
- Los errores de negocio (`errno 1644`) se traducen a `ValueError` en los servicios y a HTTP 400 por los controladores.
