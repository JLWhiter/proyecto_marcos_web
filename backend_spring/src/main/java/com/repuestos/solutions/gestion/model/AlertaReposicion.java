package com.repuestos.solutions.gestion.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Alerta de reposición que se genera cuando el stock actual llega al mínimo.
 * Solo el administrador puede gestionarla emitiendo una orden de compra.
 */
@Entity
@Table(name = "alerta_reposicion")
public class AlertaReposicion {

    public enum Estado { PENDIENTE, GESTIONADA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @Column(name = "stock_momento", nullable = false)
    private Integer stockMomento;

    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private Estado estado = Estado.PENDIENTE;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gestionada_por")
    private Usuario gestionadaPor;

    @Column(name = "fecha_gestion")
    private LocalDateTime fechaGestion;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Integer getStockMomento() { return stockMomento; }
    public void setStockMomento(Integer stockMomento) { this.stockMomento = stockMomento; }
    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public Usuario getGestionadaPor() { return gestionadaPor; }
    public void setGestionadaPor(Usuario gestionadaPor) { this.gestionadaPor = gestionadaPor; }
    public LocalDateTime getFechaGestion() { return fechaGestion; }
    public void setFechaGestion(LocalDateTime fechaGestion) { this.fechaGestion = fechaGestion; }
}
