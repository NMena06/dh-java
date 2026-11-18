package com.reservaya.model;

import jakarta.persistence.*;

/**
 * Categoria de productos (historias #12, #20 y #21): titulo, descripcion e imagen representativa.
 */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    /** Imagen representativa como data URL (base64) o URL publica. */
    @Lob
    @Column(nullable = false)
    private String image;

    public Category() {
    }

    public Category(String title, String description, String image) {
        this.title = title;
        this.description = description;
        this.image = image;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
