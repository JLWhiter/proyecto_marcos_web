package com.repuestos.solutions.gestion.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

public class AlertaReposicion {
    public enum Estado { PENDIENTE, GESTIONADA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer stockAlMomento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Estado estado = Estado.PENDIENTE;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gestionada_por")
    private Usuario gestionadaPor;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Integer getStockAlMomento() { return stockAlMomento; }
    public void setStockAlMomento(Integer stockAlMomento) { this.stockAlMomento = stockAlMomento; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public Usuario getGestionadaPor() { return gestionadaPor; }
    public void setGestionadaPor(Usuario gestionadaPor) { this.gestionadaPor = gestionadaPor; }
}
