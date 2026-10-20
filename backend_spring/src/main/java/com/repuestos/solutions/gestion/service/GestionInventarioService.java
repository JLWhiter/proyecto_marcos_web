package com.repuestos.solutions.gestion.service;

import com.repuestos.solutions.gestion.model.*;
import com.repuestos.solutions.gestion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GestionInventarioService {

    private final GestionProductoRepository productoRepo;
    private final GestionUbicacionRepository ubicacionRepo;
    private final GestionUsuarioRepository usuarioRepo;
    private final GestionReporteDanoRepository reporteRepo;
    private final GestionAjusteInventarioRepository ajusteRepo;
    private final GestionAlertaReposicionRepository alertaRepo;
    private final GestionVentaRepository ventaRepo;

    public GestionInventarioService(GestionProductoRepository productoRepo, GestionUbicacionRepository ubicacionRepo,
                                   GestionUsuarioRepository usuarioRepo, GestionReporteDanoRepository reporteRepo,
                                   GestionAjusteInventarioRepository ajusteRepo, GestionAlertaReposicionRepository alertaRepo,
                                   GestionVentaRepository ventaRepo) {
        this.productoRepo = productoRepo;
        this.ubicacionRepo = ubicacionRepo;
        this.usuarioRepo = usuarioRepo;
        this.reporteRepo = reporteRepo;
        this.ajusteRepo = ajusteRepo;
        this.alertaRepo = alertaRepo;
        this.ventaRepo = ventaRepo;
    }

    @Transactional
    public void verificarStockMinimo(Producto p) {
        if (p.getStockActual() != null && p.getStockMinimo() != null
                && p.getStockActual() <= p.getStockMinimo()) {
            AlertaReposicion a = new AlertaReposicion();
            a.setProducto(p);
            a.setStockAlMomento(p.getStockActual());
            alertaRepo.save(a);
        }
    }

    @Transactional
    public ReporteDano reportarDano(Long productoId, Integer cantidad, String motivo, String usernameAlmacenero) {
        Producto p = productoRepo.findById(productoId).orElseThrow();
        Usuario u = usuarioRepo.findByUsername(usernameAlmacenero);
        if (u == null || u.getRol() != Usuario.Rol.ALMACENERO)
            throw new IllegalArgumentException("Solo almacenero puede reportar daño");
        ReporteDano r = new ReporteDano();
        r.setProducto(p);
        r.setCantidad(cantidad);
        r.setMotivo(motivo);
        r.setReportadoPor(u);
        return reporteRepo.save(r);
    }

    @Transactional
    public ReporteDano confirmarBaja(Long reporteId, String usernameAdmin) {
        ReporteDano r = reporteRepo.findById(reporteId).orElseThrow();
        Usuario admin = usuarioRepo.findByUsername(usernameAdmin);
        if (admin == null || admin.getRol() != Usuario.Rol.ADMINISTRADOR)
            throw new IllegalArgumentException("Solo administrador confirma baja");
        if (r.getEstado() != ReporteDano.Estado.PENDIENTE)
            throw new IllegalStateException("Reporte no pendiente");
        Producto p = r.getProducto();
        int nuevo = p.getStockActual() - r.getCantidad();
        p.setStockActual(Math.max(nuevo, 0));
        productoRepo.save(p);
        r.setConfirmadoPor(admin);
        r.setEstado(ReporteDano.Estado.CONFIRMADO);
        r.setFechaConfirmacion(java.time.LocalDateTime.now());
        verificarStockMinimo(p);
        return reporteRepo.save(r);
    }

    @Transactional
    public AjusteInventario ajustarInventario(Long productoId, Integer cantidadAjuste, String motivo, String usernameAdmin) {
        Usuario admin = usuarioRepo.findByUsername(usernameAdmin);
        if (admin == null || admin.getRol() != Usuario.Rol.ADMINISTRADOR)
            throw new IllegalArgumentException("Solo administrador ajusta inventario");
        Producto p = productoRepo.findById(productoId).orElseThrow();
        p.setStockActual(p.getStockActual() + cantidadAjuste);
        productoRepo.save(p);
        AjusteInventario a = new AjusteInventario();
        a.setProducto(p);
        a.setCantidadAjuste(cantidadAjuste);
        a.setMotivo(motivo);
        a.setAdministrador(admin);
        verificarStockMinimo(p);
        return ajusteRepo.save(a);
    }

    public List<Producto> inventarioPorUbicacion(String codigo) {
        return productoRepo.findByUbicacionCodigo(codigo);
    }

    public List<AlertaReposicion> alertasPendientes() {
        return alertaRepo.findByEstado(AlertaReposicion.Estado.PENDIENTE);
    }

    @Transactional
    public void gestionarAlerta(Long alertaId, String usernameAdmin) {
        Usuario admin = usuarioRepo.findByUsername(usernameAdmin);
        if (admin == null || admin.getRol() != Usuario.Rol.ADMINISTRADOR)
            throw new IllegalArgumentException("Solo administrador gestiona alerta");
        AlertaReposicion a = alertaRepo.findById(alertaId).orElseThrow();
        a.setEstado(AlertaReposicion.Estado.GESTIONADA);
        a.setGestionadaPor(admin);
        alertaRepo.save(a);
    }

    // Dashboard KPIs
    public BigDecimal valorTotalInventario() {
        return productoRepo.findAll().stream()
                .map(p -> p.getPrecioUnitario().multiply(BigDecimal.valueOf(p.getStockActual())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<Producto> articulosMayorValor(int top) {
        return productoRepo.findAll().stream()
                .sorted((a, b) -> b.getPrecioUnitario().multiply(BigDecimal.valueOf(b.getStockActual()))
                        .compareTo(a.getPrecioUnitario().multiply(BigDecimal.valueOf(a.getStockActual()))))
                .limit(top).collect(Collectors.toList());
    }

    public List<Producto> articulosObsoletosODanados() {
        return reporteRepo.findByEstado(ReporteDano.Estado.CONFIRMADO).stream()
                .map(ReporteDano::getProducto).distinct().collect(Collectors.toList());
    }

    // menor rotacion: placeholder (requiere historial de ventas); retorna stock alto con pocas ventas
    public List<Producto> articulosMenorRotacion(int top) {
        return productoRepo.findAll().stream()
                .sorted(Comparator.comparingInt(Producto::getStockActual).reversed())
                .limit(top).collect(Collectors.toList());
    }
}

