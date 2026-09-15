# Progreso — Conversión Flask → Spring Boot — "Repuestos Solutions"

Fecha: 2026-08-31

## OBJETIVO GENERAL
- BD nueva `proyecto_marcos_web` creada/poblada en MySQL local (lista para el backend nuevo).
- Convertir backend Flask (Python) a Spring Boot (Java) manteniendo React, en la copia `proyecto_marcos_web`.
- Convertir el CSS a Bootstrap después.
- Terminar renombrado de empresa a "Repuestos Solutions" + nuevo SVG.
- Probar SOLO en local. Deploy al servidor PENDIENTE.

## DECISIONES (respondidas por el usuario vía `question`)
1. Capa de datos: mantener stored procedures con `JdbcTemplate` (`spring-boot-starter-jdbc`).
2. Autenticación: Spring Security + JWT completo (sesión única `token_ver`, denylist, BCrypt, roles).
3. Alcance: esqueleto + un módulo completo primero (Auth + Productos/Inventario), luego fases.

## REFERENCIA FLASK (a replicar EXACTAMENTE)
- JWT HS256, payload `{user_id, usuario, rol(nombre), rol_id, persona_id, ver}`, issuer `trucks-inventario`,
  audience `trucks-frontend`, expira 8h. Denylist = hash SHA-256 del token en tabla `token_denylist`.
  Login hace `bump_token_ver` (sesión única). BCrypt con dummy hash anti-enumeración por timing.
- Formato respuestas:
  - success: `{success:true, mensaje, data?}`
  - error: `{success:false, error, detalle?}`
  - paginated: `{success, mensaje, data, pagination:{total,page,per_page,pages}}`
- Registros leídos: `app/utils/security.py`, `app/middleware/auth.py`, `app/config.py`, `app/utils/response.py`,
  `app/routes/auth.py`, `app/controllers/auth_controller.py`, `app/controllers/producto_controller.py`,
  `app/repositories/producto_repo.py`, `app/models/producto.py`, `app/services/auth_service.py`,
  `app/services/producto_service.py`, `app/repositories/usuario_repo.py`, `app/models/usuario.py`,
  `app/repositories/base.py`, `app/utils/validation.py`.

## ENTORNO
- Windows, MySQL 8.4 service, root/root. Java 26.0.1, node v24.16.0.
- Maven NO en PATH. Usar: `C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd` (Maven 3.9.15).
- Patrón versión: `Proyecto_integrador` = Spring Boot 4.0.6 + Java 26 + Maven + Lombok + JPA.

## DB
- BD `proyecto_marcos_web` clonada de `bd_Trucks` restaurada vía
  `mysqldump --routines --no-create-db --skip-add-drop-table --result-file` (NO usar `>` en PowerShell, corrompe dump binario).
- Verificada: 453 productos, 7 usuarios, 72 ventas, fecha_pago, 13 stored procedures (sp_*), 2 vistas
  (v_stock_general, v_valor_inventario).
- Incidente resuelto: al cargar `bd_Trucks.sql` se sobrescribió `bd_Trucks` original; recuperada aplicando
  `00_inserts_completo.sql` + migraciones `01_..12_` (por archivo con `source`).

## ESQUELETO SPRING BOOT — backend_spring (paquete base `com.repuestos.solutions`)
Local: `proyecto_marcos_web\backend_spring`
- `pom.xml` (Spring Boot 4.0.6, Java 26, Lombok 1.18.46, jjwt 0.12.6; webmvc, jdbc, security, validation, mysql-connector-j).
- `src/main/resources/application.properties` → MySQL `proyecto_marcos_web` (root/root), puerto 5000,
  JWT expira 8h, roles 1/2/3, CORS 5173/3000, uploads 5MB.
- `RepuestosBackendApplication.java` (main).
- `common/ApiResponse.java` — métodos: success(data,mensaje,status), success(data,mensaje), success(mensaje),
  error(mensaje,detalle,status), error(mensaje,status), error(mensaje), paginated(items,total,page,perPage,mensaje), money(double).
- `common/BusinessException.java`, `common/GlobalExceptionHandler.java`.
- `security/TokenDenylistRepository.java`, `security/AppUser.java` (con record `AuthPrincipal`),
  `security/JwtService.java`, `security/JwtAuthenticationFilter.java`, `security/SecurityUtil.java`
  (métodos: `current()` → AuthPrincipal, `hasAnyRole(Integer...)`).
- `config/SecurityConfig.java` (stateless, JWT filter, BCryptPasswordEncoder, CORS; `/api/v1/auth/login` público).

### MÓDULO AUTH — COMPLETO
- `auth/dto/LoginRequest.java`, `auth/dto/LoginResponse.java`.
- `auth/repository/AuthRepository.java` (con corrección de línea SQL rota aplicada).
- `auth/service/AuthService.java` (login bcrypt+dummy, bump token_ver, logout denylist, me, actualizar perfil, auditoría).
- `auth/controller/AuthController.java` (endpoints `/api/v1/auth/{login,logout,me,me PUT,me/foto}`).

### MÓDULO PRODUCTOS — EN PROGRESO (archivos creados)
- `producto/repository/ProductoRepository.java` — JdbcTemplate + SimpleJdbcCall. Contiene:
  - SELECT_FULL (joins a marca, categoria, producto_proveedor/proveedor, inventario, estado_producto, ubicacion),
  - listar(), contar(), obtener(), toDict() (excluye nulls, decimal->double),
  - crear() → sp_crear_producto, registrarCompleto() → sp_registrar_producto, actualizar() → sp_actualizar_producto,
  - softDelete() (UPDATE activo=0 + auditoria), actualizarCampo(), insertMovimientoEntrada()
    (inserta en movimiento_inventario tipo 'entrada', retorna si cantidad<=0), helpers jsonOrNull/firstOutParam.
- `producto/service/ProductoService.java` — replica producto_service.py: listar, obtener, crear,
  registrarCompleto (stock>0 → insertMovimientoEntrada con "Ingreso inicial de N unidades"), actualizar,
  eliminar, actualizarCampo.
- `producto/controller/ProductoController.java` — replica producto_controller.py:
  - GET /api/v1/productos (q, id_marca, id_categoria, page, per_page)
  - GET /api/v1/productos/{id}
  - POST /api/v1/productos (crear) — valida nombre/codigo/precios/ids
  - POST /api/v1/productos/registrar (registro con inventario)
  - PUT /api/v1/productos/{id}
  - DELETE /api/v1/productos/{id}
  - POST /api/v1/productos/{id}/imagen (subir imagen, max 5MB, .jpg/.jpeg/.png/.webp → /uploads/productos/)
  - Usa `SecurityUtil.currentUserId()` (AGREGAR este método a SecurityUtil, aún NO existe).
  - FALTA revisar permisos por rol (método @PreAuthorize o check en controller).

## PENDIENTE / PROBLEMAS A RESOLVER
1. **PENDIENTE**: `SecurityUtil.currentUserId()` NO EXISTE aún — agregarlo a `SecurityUtil.java`
   (retornar `current().userId()` del record AuthPrincipal).
2. Revisar nombre del parámetro de retorno de los SPs con SimpleJdbcCall (marcar como indicadores con
   `.declareParameters` o `.returningResult` / named binding); puede requerir `.withNamedBinding()`.
3. COMPILAR con Maven de NetBeans:
   `& "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" -f backend_spring\pom.xml package`
   (AÚN NO SE HA COMPILADO).
4. Probar arranque contra `proyecto_marcos_web` (login real).
5. Roles/permisos de cada endpoint (revisar decoradores de rol en Flask).
6. Continuar con los demás módulos por fases (ventas, clientes, proveedores, marcas, categorías, usuarios,
   reportes, movimientos, etc.).
7. Convertir CSS a Bootstrap en el frontend de la copia.
8. Verificar build del frontend de la copia al final.

## RUTAS CLAVE
- Backend Spring: `proyecto_marcos_web\backend_spring\src\main\java\com\repuestos\solutions\`
- Flask: `proyecto_marcos_web\backend_sistema_inventario_trucks\Back-end\app\`
- Logo: `frontend_trucks\public\logorepuestos.svg` y `src\assets\logos\logorepuestos.svg`
- Sidebars renombrados: `frontend_trucks\src\pages\{admin,recepcionista,almacenero}\components\Sidebar.jsx`
- Maven: `C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd`
- Dump/migraciones: `bd_truck_automovite\00_inserts_completo.sql`, `01_..12_*.sql`
