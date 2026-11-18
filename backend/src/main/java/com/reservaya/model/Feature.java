package com.reservaya.model;

import jakarta.persistence.*;

/**
 * Caracteristica de un producto (historias #17 y #18), por ejemplo "Wifi" o "Pileta".
 * El icono es una clave (por ejemplo "wifi") que el frontend traduce a un SVG.
 */
@Entity
@Table(name = "features")
public class Feature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, length = 40)
    private String icon;

    public Feature() {
    }

    public Feature(String name, String icon) {
        this.name = name;
        this.icon = icon;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}
