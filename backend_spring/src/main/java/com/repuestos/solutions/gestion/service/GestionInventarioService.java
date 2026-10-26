package com.repuestos.solutions.gestion.service;

import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.gestion.dto.*;
import com.repuestos.solutions.gestion.model.*;
import com.repuestos.solutions.gestion.repository.*;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GestionInventarioService {

    private final GestionProductoRepository productoRepo;
    private final GestionInventarioRepository inventarioRepo;
    private final GestionUsuarioRepository usuarioRepo;
    private final GestionReporteDanoRepository reporteRepo;
    private final GestionAjusteInventarioRepository ajusteRepo;
    private final GestionAlertaReposicionRepository alertaRepo;
    private final GestionOrdenCompraRepository ordenRepo;
    private final JdbcTemplate jdbc;

    public GestionInventarioService(GestionProductoRepository productoRepo,
                                    GestionInventarioRepository inventarioRepo,
                                    GestionUsuarioRepository usuarioRepo,
                                    GestionReporteDanoRepository reporteRepo,
                                    GestionAjusteInventarioRepository ajusteRepo,
                                    GestionAlertaReposicionRepository alertaRepo,
                                    GestionOrdenCompraRepository ordenRepo,
                                    JdbcTemplate jdbc) {
        this.productoRepo = productoRepo;
        this.inventarioRepo = inventarioRepo;
        this.usuarioRepo = usuarioRepo;
        this.reporteRepo = reporteRepo;
        this.ajusteRepo = ajusteRepo;
        this.alertaRepo = alertaRepo;
        this.ordenRepo = ordenRepo;
        this.jdbc = jdbc;
    }

    // ------------------------------------------------------------------
    // Permisos
    // ------------------------------------------------------------------

    private void requireRole(Integer... roles) {
        if (!SecurityUtil.hasAnyRole(roles)) {
            throw new AccessDeniedException("No tienes permiso para realizar esta acción");
        }
    }

    private Usuario usuarioActual() {
        return usuarioRepo.findById(SecurityUtil.currentUserId()).orElse(null);
    }

    // ------------------------------------------------------------------
    // Daños: reporte del almacenero + confirmación del administrador
    // ------------------------------------------------------------------

    @Transactional
    public DanoDto reportarDano(Integer idInventario, Integer cantidad, String motivo, String evidenciaUrl) {
        requireRole(3);
        if (idInventario == null || cantidad == null || cantidad <= 0) {
            throw new BusinessException("La cantidad debe ser un entero mayor a 0");
        }
        Inventario inv = inventarioRepo.findConProductoYUbicacion(idInventario)
                .orElseThrow(() -> new BusinessException("El registro de inventario no existe"));
        int stock = inv.getStockActual() == null ? 0 : inv.getStockActual();
        if (cantidad > stock) {
            throw new BusinessException("Stock insuficiente. Disponible: " + stock);
        }

        ReporteDano r = new ReporteDano();
        r.setInventario(inv);
        r.setProducto(inv.getProducto());
        r.setCantidad(cantidad);
        r.setMotivo(motivo);
        r.setEvidenciaUrl(evidenciaUrl);
        r.setReportadoPor(usuarioActual());
        r.setEstado(ReporteDano.Estado.PENDIENTE);
        r.setFecha(LocalDateTime.now());
        // Importante: NO se descuenta stock aquí. Solo el administrador
        // confirma la baja y en ese momento se descuenta.
        return toDanoDto(reporteRepo.save(r));
    }

    @Transactional(readOnly = true)
    public List<DanoDto> listarDanos(String estado) {
        requireRole(1);
        List<ReporteDano> reportes;
        if (estado == null || estado.isBlank()) {
            reportes = reporteRepo.findAllByOrderByFechaDesc();
        } else {
            ReporteDano.Estado e;
            try {
                e = ReporteDano.Estado.valueOf(estado.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BusinessException("Estado de daño inválido: " + estado);
            }
            reportes = reporteRepo.findByEstadoOrderByFechaDesc(e);
        }
        return reportes.stream().map(this::toDanoDto).toList();
    }

    @Transactional
    public DanoDto confirmarBaja(Integer reporteId) {
        requireRole(1);
        ReporteDano r = reporteRepo.findById(reporteId)
                .orElseThrow(() -> new BusinessException("El reporte de daño no existe"));
        if (r.getEstado() != ReporteDano.Estado.PENDIENTE) {
            throw new BusinessException("El reporte ya fue procesado");
        }
        Inventario inv = r.getInventario();
        int stock = inv.getStockActual() == null ? 0 : inv.getStockActual();
        if (r.getCantidad() > stock) {
            throw new BusinessException("Stock insuficiente para confirmar la baja. Disponible: " + stock);
        }

        inv.setStockActual(stock - r.getCantidad());
        inventarioRepo.save(inv);

        int userId = SecurityUtil.currentUserId();
        jdbc.update("""
                INSERT INTO movimiento_inventario (tipo, cantidad, observacion, id_usuario, id_inventario)
                VALUES ('salida', ?, ?, ?, ?)
                """, r.getCantidad(),
                "Baja por daño confirmada (reporte #" + r.getId() + ")", userId, inv.getId());
        Integer idMovimiento = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        jdbc.update("""
                INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora)
                VALUES ('reporte_dano', 'update', ?, ?, ?, NOW())
                """, userId, r.getId(), "Baja confirmada: -" + r.getCantidad() + " unidades");

        r.setIdMovimiento(idMovimiento);
        r.setEstado(ReporteDano.Estado.CONFIRMADO);
        r.setConfirmadoPor(usuarioActual());
        r.setFechaConfirmacion(LocalDateTime.now());
        reporteRepo.save(r);
        verificarStockMinimo(inv);
        return toDanoDto(r);
    }

    @Transactional
    public DanoDto rechazarBaja(Integer reporteId) {
        requireRole(1);
        ReporteDano r = reporteRepo.findById(reporteId)
                .orElseThrow(() -> new BusinessException("El reporte de daño no existe"));
        if (r.getEstado() != ReporteDano.Estado.PENDIENTE) {
            throw new BusinessException("El reporte ya fue procesado");
        }
        r.setEstado(ReporteDano.Estado.RECHAZADO);
        r.setConfirmadoPor(usuarioActual());
        r.setFechaConfirmacion(LocalDateTime.now());
        return toDanoDto(reporteRepo.save(r));
    }

    // ------------------------------------------------------------------
    // Ajustes de inventario (solo administrador)
    // ------------------------------------------------------------------

    @Transactional
    public AjusteDto ajustarInventario(Integer productoId, Integer nuevoStock, String motivo) {
        requireRole(1);
        if (productoId == null) {
            throw new BusinessException("El producto es obligatorio");
        }
        if (nuevoStock == null || nuevoStock < 0) {
            throw new BusinessException("El nuevo stock debe ser un entero mayor o igual a 0");
        }
        Inventario inv = inventarioRepo.findByProductoId(productoId)
                .orElseThrow(() -> new BusinessException("El producto no tiene registro de inventario"));
        int anterior = inv.getStockActual() == null ? 0 : inv.getStockActual();
        int delta = nuevoStock - anterior;
        if (delta == 0) {
            throw new BusinessException("El stock nuevo es igual al actual");
        }

        inv.setStockActual(nuevoStock);
        inventarioRepo.save(inv);

        int userId = SecurityUtil.currentUserId();
        String obs = "Ajuste de inventario: " + anterior + " -> " + nuevoStock
                + (motivo == null || motivo.isBlank() ? "" : " - " + motivo);
        jdbc.update("""
                INSERT INTO movimiento_inventario (tipo, cantidad, observacion, id_usuario, id_inventario)
                VALUES ('ajuste', ?, ?, ?, ?)
                """, Math.abs(delta), obs, userId, inv.getId());
        Integer idMovimiento = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        jdbc.update("""
                INSERT INTO auditoria (tabla_afectada, accion, id_usuario, id_registro, descripcion, fecha_hora)
                VALUES ('inventario', 'update', ?, ?, ?, NOW())
                """, userId, idMovimiento, obs);

        AjusteInventario a = new AjusteInventario();
        a.setProducto(inv.getProducto());
        a.setInventario(inv);
        a.setCantidadAjuste(delta);
        a.setStockAnterior(anterior);
        a.setStockNuevo(nuevoStock);
        a.setMotivo(motivo);
        a.setAdministrador(usuarioActual());
        a.setFecha(LocalDateTime.now());
        ajusteRepo.save(a);
        verificarStockMinimo(inv);
        return toAjusteDto(a);
    }

    @Transactional(readOnly = true)
    public List<AjusteDto> listarAjustes() {
        requireRole(1);
        return ajusteRepo.findAllByOrderByFechaDesc().stream().map(this::toAjusteDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoInventarioDto> buscarProductosInventario(String q) {
        requireRole(1);
        String filtro = q == null ? "" : q.trim();
        String like = "%" + filtro + "%";
        String sql = """
                SELECT p.id AS producto_id, i.id AS inventario_id, p.codigo, p.nombre,
                       i.stock_actual, i.stock_minimo, u.ubicacion, p.unidad_medida,
                       p.precio_compra, p.precio_venta
                  FROM producto p
                  JOIN inventario i ON i.id_producto = p.id
                  LEFT JOIN ubicacion u ON u.id = i.id_ubicacion
                 WHERE (p.activo = 1 OR p.activo IS NULL)
                   AND (? = '' OR p.codigo LIKE ? OR p.nombre LIKE ?)
                 ORDER BY p.codigo
                 LIMIT 100
                """;
        return jdbc.query(sql, (rs, n) -> new ProductoInventarioDto(
                rs.getInt("producto_id"),
                rs.getInt("inventario_id"),
                rs.getString("codigo"),
                rs.getString("nombre"),
                rs.getInt("stock_actual"),
                rs.getInt("stock_minimo"),
                rs.getString("ubicacion"),
                rs.getString("unidad_medida"),
                rs.getBigDecimal("precio_compra"),
                rs.getBigDecimal("precio_venta")
        ), filtro, like, like);
    }

    // ------------------------------------------------------------------
    // Alertas de reposición y órdenes de compra (solo administrador)
    // ------------------------------------------------------------------

    /** Genera una alerta si el stock llegó al mínimo y no existe una pendiente. */
    @Transactional
    public void verificarStockMinimo(Inventario inv) {
        if (inv == null || inv.getStockActual() == null || inv.getStockMinimo() == null) {
            return;
        }
        if (inv.getStockActual() > inv.getStockMinimo()) {
            return;
        }
        Integer productoId = inv.getProducto().getId();
        if (alertaRepo.existsByProductoIdAndEstado(productoId, AlertaReposicion.Estado.PENDIENTE)) {
            return;
        }
        AlertaReposicion a = new AlertaReposicion();
        a.setProducto(inv.getProducto());
        a.setStockMomento(inv.getStockActual());
        a.setStockMinimo(inv.getStockMinimo());
        a.setEstado(AlertaReposicion.Estado.PENDIENTE);
        a.setFecha(LocalDateTime.now());
        alertaRepo.save(a);
    }

    @Transactional(readOnly = true)
    public List<AlertaDto> alertasPendientes() {
        requireRole(1);
        return alertaRepo.findByEstadoOrderByFechaDesc(AlertaReposicion.Estado.PENDIENTE)
                .stream().map(this::toAlertaDto).toList();
    }

    @Transactional
    public OrdenCompraDto emitirOrdenCompra(Integer alertaId, Integer proveedorId, Integer cantidad) {
        requireRole(1);
        AlertaReposicion alerta = alertaRepo.findById(alertaId)
                .orElseThrow(() -> new BusinessException("La alerta no existe"));
        if (alerta.getEstado() != AlertaReposicion.Estado.PENDIENTE) {
            throw new BusinessException("La alerta ya fue gestionada");
        }
        int cant = (cantidad != null && cantidad > 0)
                ? cantidad
                : Math.max(alerta.getStockMinimo() * 2 - alerta.getStockMomento(), 1);

        OrdenCompra o = new OrdenCompra();
        o.setAlerta(alerta);
        o.setProducto(alerta.getProducto());
        o.setProveedorId(proveedorId);
        o.setCantidad(cant);
        o.setEstado(OrdenCompra.Estado.EMITIDA);
        o.setFecha(LocalDateTime.now());
        o.setAdministrador(usuarioActual());
        ordenRepo.save(o);

        alerta.setEstado(AlertaReposicion.Estado.GESTIONADA);
        alerta.setGestionadaPor(usuarioActual());
        alerta.setFechaGestion(LocalDateTime.now());
        alertaRepo.save(alerta);

        return toOrdenDto(o);
    }

    @Transactional(readOnly = true)
    public List<OrdenCompraDto> listarOrdenesCompra() {
        requireRole(1);
        return ordenRepo.findAllByOrderByFechaDesc().stream().map(this::toOrdenDto).toList();
    }

    // ------------------------------------------------------------------
    // Inventario físico por ubicación
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<InventarioUbicacionDto> inventarioPorUbicacion(String codigo) {
        requireRole(1, 2, 3);
        if (codigo == null || codigo.isBlank()) {
            throw new BusinessException("La ubicación es obligatoria");
        }
        return inventarioRepo.porUbicacion(codigo.trim()).stream()
                .map(i -> new InventarioUbicacionDto(
                        i.getProducto().getCodigo(),
                        i.getUbicacion() != null ? i.getUbicacion().getCodigo() : "",
                        i.getProducto().getNombre(),
                        i.getProducto().getUnidadMedida(),
                        i.getStockActual()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarUbicaciones() {
        requireRole(1, 2, 3);
        return jdbc.queryForList("SELECT id, ubicacion AS codigo, descripcion FROM ubicacion ORDER BY ubicacion");
    }

    // ------------------------------------------------------------------
    // Dashboard (4 indicadores)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard(String periodo) {
        requireRole(1);
        int dias = "semana".equalsIgnoreCase(periodo) ? 7 : 30;
        LocalDateTime desde = LocalDateTime.now().minusDays(dias);
        Timestamp ts = Timestamp.valueOf(desde);

        BigDecimal valorTotal = jdbc.queryForObject("""
                SELECT COALESCE(SUM(i.stock_actual * COALESCE(p.precio_compra, 0)), 0)
                  FROM inventario i
                  JOIN producto p ON p.id = i.id_producto
                 WHERE (p.activo = 1 OR p.activo IS NULL)
                """, BigDecimal.class);

        List<Map<String, Object>> mayorValor = jdbc.queryForList("""
                SELECT p.codigo, p.nombre, i.stock_actual AS stock,
                       (i.stock_actual * COALESCE(p.precio_compra, 0)) AS valor
                  FROM inventario i
                  JOIN producto p ON p.id = i.id_producto
                 WHERE (p.activo = 1 OR p.activo IS NULL)
                 ORDER BY valor DESC
                 LIMIT 5
                """);

        List<Map<String, Object>> menorRotacion = jdbc.queryForList("""
                SELECT p.codigo, p.nombre, MAX(i.stock_actual) AS stock,
                       COALESCE(SUM(v.cantidad), 0) AS ventas
                  FROM producto p
                  JOIN inventario i ON i.id_producto = p.id
                  LEFT JOIN venta v ON v.id_producto = p.id AND v.fecha_hora >= ?
                 WHERE (p.activo = 1 OR p.activo IS NULL)
                 GROUP BY p.id, p.codigo, p.nombre
                 ORDER BY ventas ASC, stock DESC
                 LIMIT 5
                """, ts);

        List<Map<String, Object>> obsoletos = new ArrayList<>(jdbc.queryForList("""
                SELECT p.codigo, p.nombre, MAX(i.stock_actual) AS stock,
                       'Sin ventas en el periodo' AS motivo
                  FROM producto p
                  JOIN inventario i ON i.id_producto = p.id
                 WHERE (p.activo = 1 OR p.activo IS NULL)
                   AND i.stock_actual > 0
                   AND NOT EXISTS (
                       SELECT 1 FROM venta v
                        WHERE v.id_producto = p.id AND v.fecha_hora >= ?
                   )
                 GROUP BY p.id, p.codigo, p.nombre
                 ORDER BY stock DESC
                 LIMIT 5
                """, ts));
        obsoletos.addAll(jdbc.queryForList("""
                SELECT p.codigo, p.nombre, MAX(i.stock_actual) AS stock,
                       'Dañado confirmado' AS motivo
                  FROM reporte_dano r
                  JOIN producto p ON p.id = r.id_producto
                  JOIN inventario i ON i.id = r.id_inventario
                 WHERE r.estado = 'CONFIRMADO'
                   AND r.fecha_confirmacion >= ?
                 GROUP BY p.id, p.codigo, p.nombre
                 ORDER BY stock DESC
                 LIMIT 5
                """, ts));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodo", dias == 7 ? "semana" : "mes");
        result.put("dias", dias);
        result.put("valorTotal", valorTotal == null ? BigDecimal.ZERO : valorTotal);
        result.put("mayorValor", mayorValor);
        result.put("menorRotacion", menorRotacion);
        result.put("obsoletos", obsoletos);
        return result;
    }

    // ------------------------------------------------------------------
    // Mapeos a DTO
    // ------------------------------------------------------------------

    private DanoDto toDanoDto(ReporteDano r) {
        Producto p = r.getProducto();
        if (p == null && r.getInventario() != null) {
            p = r.getInventario().getProducto();
        }
        return new DanoDto(
                r.getId(),
                r.getFecha(),
                p != null ? p.getCodigo() : null,
                p != null ? p.getNombre() : null,
                r.getCantidad(),
                r.getMotivo(),
                r.getEstado() != null ? r.getEstado().name() : null,
                r.getReportadoPor() != null ? r.getReportadoPor().getUsername() : null,
                r.getEvidenciaUrl(),
                r.getConfirmadoPor() != null ? r.getConfirmadoPor().getUsername() : null,
                r.getFechaConfirmacion()
        );
    }

    private AjusteDto toAjusteDto(AjusteInventario a) {
        return new AjusteDto(
                a.getId(),
                a.getFecha(),
                a.getProducto() != null ? a.getProducto().getCodigo() : null,
                a.getProducto() != null ? a.getProducto().getNombre() : null,
                a.getCantidadAjuste(),
                a.getStockAnterior(),
                a.getStockNuevo(),
                a.getMotivo(),
                a.getAdministrador() != null ? a.getAdministrador().getUsername() : null
        );
    }

    private AlertaDto toAlertaDto(AlertaReposicion a) {
        return new AlertaDto(
                a.getId(),
                a.getFecha(),
                a.getProducto().getId(),
                a.getProducto().getCodigo(),
                a.getProducto().getNombre(),
                a.getStockMomento(),
                a.getStockMinimo(),
                a.getEstado().name()
        );
    }

    private OrdenCompraDto toOrdenDto(OrdenCompra o) {
        return new OrdenCompraDto(
                o.getId(),
                o.getFecha(),
                o.getAlerta() != null ? o.getAlerta().getId() : null,
                o.getProducto().getCodigo(),
                o.getProducto().getNombre(),
                o.getProveedorId(),
                proveedorNombre(o.getProveedorId()),
                o.getCantidad(),
                o.getEstado().name()
        );
    }

    private String proveedorNombre(Integer proveedorId) {
        if (proveedorId == null) return null;
        List<String> names = jdbc.query("SELECT nombre FROM proveedor WHERE id = ?",
                (rs, n) -> rs.getString("nombre"), proveedorId);
        return names.isEmpty() ? null : names.get(0);
    }
}
