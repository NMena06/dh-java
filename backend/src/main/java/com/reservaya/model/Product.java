package com.reservaya.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, length = 2000)
    private String description;

    /**
     * Imagenes del producto almacenadas como data URL (base64).
     * Para el MVP se guardan en la base de datos; en produccion conviene un storage de archivos.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Lob
    @Column(name = "image_data", nullable = false)
    private List<String> images = new ArrayList<>();

    /** Categoria del producto (historia #12). Es opcional. La imagen se omite del JSON para no inflar los listados. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"image", "description"})
    private Category category;

    /** Caracteristicas asociadas (historias #17 y #18). */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "product_features",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "feature_id"))
    @OrderBy("name ASC")
    private Set<Feature> features = new LinkedHashSet<>();

    public Product() {
    }

    public Product(String name, String description, List<String> images) {
        this.name = name;
        this.description = description;
        this.images = images == null ? new ArrayList<>() : new ArrayList<>(images);
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Set<Feature> getFeatures() {
        return features;
    }

    public void setFeatures(Set<Feature> features) {
        this.features = features;
    }
}
