package com.reservaya.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Politica de uso de un producto (historia #26): titulo y descripcion. */
@Embeddable
public class Policy {

    @Column(name = "title", nullable = false, length = 80)
    private String title;

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    public Policy() {
    }

    public Policy(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
