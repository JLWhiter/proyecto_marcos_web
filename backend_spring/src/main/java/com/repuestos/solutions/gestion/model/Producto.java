package com.repuestos.solutions.gestion.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Producto del catálogo. El stock y la ubicación viven en {@link Inventario}
 * (tabla inventario), tal como está normalizada la base de datos.
 */
@Entity
@Table(name = "producto")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre", length = 150)
    private String nombre;

    @Column(name = "codigo", nullable = false, length = 10)
    private String codigo;

    @Column(name = "precio_compra", precision = 10, scale = 2)
    private BigDecimal precioCompra;

    @Column(name = "precio_venta", precision = 10, scale = 2)
    private BigDecimal precioVenta;

    @Column(name = "imagen_url", length = 255)
    private String imagenUrl;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida = "unidad";

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @OneToOne(mappedBy = "producto", fetch = FetchType.LAZY)
    private Inventario inventario;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public BigDecimal getPrecioCompra() { return precioCompra; }
    public void setPrecioCompra(BigDecimal precioCompra) { this.precioCompra = precioCompra; }
    public BigDecimal getPrecioVenta() { return precioVenta; }
    public void setPrecioVenta(BigDecimal precioVenta) { this.precioVenta = precioVenta; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public String getUnidadMedida() { return unidadMedida; }
    public void setUnidadMedida(String unidadMedida) { this.unidadMedida = unidadMedida; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public Inventario getInventario() { return inventario; }
    public void setInventario(Inventario inventario) { this.inventario = inventario; }
}
