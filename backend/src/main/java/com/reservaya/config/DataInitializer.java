package com.reservaya.config;

import com.reservaya.model.*;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.FeatureRepository;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Datos iniciales. Cada bloque se carga solo si su tabla esta vacia, asi una base del Sprint 1
 * recibe las categorias, caracteristicas y el administrador sin perder sus productos.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FeatureRepository featureRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(ProductRepository productRepository,
                           CategoryRepository categoryRepository,
                           FeatureRepository featureRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${app.admin.email:admin@reservaya.com}") String adminEmail,
                           @Value("${app.admin.password:Admin1234}") String adminPassword) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.featureRepository = featureRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        boolean newCategories = seedCategories();
        boolean newFeatures = seedFeatures();
        seedProducts();
        if (newCategories || newFeatures) {
            linkSampleProducts();
        }
    }

    /** Primer administrador: sin el no habria forma de otorgar permisos a otros usuarios (historia #16). */
    private void seedAdmin() {
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(new User("Admin", "ReservaYa", adminEmail.toLowerCase(Locale.ROOT),
                passwordEncoder.encode(adminPassword), Role.ADMIN));
        log.info("Administrador inicial creado: {}", adminEmail);
    }

    private boolean seedCategories() {
        if (categoryRepository.count() > 0) {
            return false;
        }
        categoryRepository.saveAll(List.of(
                new Category("Hoteles", "Alojamientos para tu estadia", categoryImage("#6c4fe0", "#2b1a66", "Hoteles")),
                new Category("Vuelos", "Viaja a cualquier destino", categoryImage("#3a86ff", "#1b3a8a", "Vuelos")),
                new Category("Alquileres de moda", "Vestidos y accesorios", categoryImage("#e05297", "#7a1f4f", "Moda")),
                new Category("Autos", "Alquila el auto que necesites", categoryImage("#ffb703", "#a35f00", "Autos"))));
        return true;
    }

    /** Imagen representativa embebida (SVG en data URL) para no depender de servicios externos. */
    private static String categoryImage(String from, String to, String label) {
        String svg = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'>"
                + "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
                + "<stop offset='0' stop-color='" + from + "'/><stop offset='1' stop-color='" + to + "'/></linearGradient></defs>"
                + "<rect width='600' height='400' fill='url(#g)'/>"
                + "<circle cx='500' cy='80' r='120' fill='white' fill-opacity='0.12'/>"
                + "<circle cx='90' cy='360' r='140' fill='white' fill-opacity='0.08'/>"
                + "<text x='300' y='225' font-family='Segoe UI, Arial, sans-serif' font-size='64' font-weight='700' "
                + "fill='white' text-anchor='middle'>" + label + "</text></svg>";
        return "data:image/svg+xml;base64,"
                + java.util.Base64.getEncoder().encodeToString(svg.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private boolean seedFeatures() {
        if (featureRepository.count() > 0) {
            return false;
        }
        featureRepository.saveAll(List.of(
                new Feature("Cocina", "cocina"),
                new Feature("Televisor", "televisor"),
                new Feature("Aire acondicionado", "aire"),
                new Feature("Apto mascotas", "mascotas"),
                new Feature("Estacionamiento gratuito", "estacionamiento"),
                new Feature("Pileta", "pileta"),
                new Feature("Wifi", "wifi"),
                new Feature("Desayuno incluido", "desayuno"),
                new Feature("Equipaje de mano", "equipaje"),
                new Feature("Transmision automatica", "auto")));
        return true;
    }

    private void seedProducts() {
        if (productRepository.count() > 0) {
            return;
        }
        productRepository.save(new Product(
                "Hotel Mirador del Lago",
                "Hotel boutique frente al lago con vistas panoramicas, desayuno incluido y piscina climatizada.",
                List.of("https://picsum.photos/seed/reservaya1/800/600", "https://picsum.photos/seed/reservaya2/800/600")));
        productRepository.save(new Product(
                "Departamento Centro Histórico",
                "Departamento de dos ambientes totalmente equipado, ideal para estadias de trabajo o turismo.",
                List.of("https://picsum.photos/seed/reservaya3/800/600")));
        productRepository.save(new Product(
                "Auto Compacto Automatico",
                "Vehiculo compacto con transmision automatica, aire acondicionado y kilometraje ilimitado.",
                List.of("https://picsum.photos/seed/reservaya4/800/600", "https://picsum.photos/seed/reservaya5/800/600", "https://picsum.photos/seed/reservaya6/800/600")));
        productRepository.save(new Product(
                "Vestido de Gala Alquiler",
                "Vestido de gala disponible para alquiler por fin de semana, con talles y accesorios incluidos.",
                List.of("https://picsum.photos/seed/reservaya7/800/600")));
        productRepository.save(new Product(
                "Vuelo Buenos Aires - Bariloche",
                "Vuelo directo con equipaje de mano incluido y asiento seleccionable al momento de la reserva.",
                List.of("https://picsum.photos/seed/reservaya8/800/600", "https://picsum.photos/seed/reservaya9/800/600")));
    }

    /** Asocia categoria y caracteristicas a los productos de ejemplo que todavia no las tengan. */
    private void linkSampleProducts() {
        Map<String, String> categoryByProduct = Map.of(
                "Hotel Mirador del Lago", "Hoteles",
                "Departamento Centro Histórico", "Hoteles",
                "Auto Compacto Automatico", "Autos",
                "Vestido de Gala Alquiler", "Alquileres de moda",
                "Vuelo Buenos Aires - Bariloche", "Vuelos");
        Map<String, List<String>> featuresByProduct = Map.of(
                "Hotel Mirador del Lago", List.of("Wifi", "Pileta", "Desayuno incluido", "Aire acondicionado", "Estacionamiento gratuito", "Televisor", "Apto mascotas"),
                "Departamento Centro Histórico", List.of("Cocina", "Wifi", "Televisor", "Aire acondicionado"),
                "Auto Compacto Automatico", List.of("Aire acondicionado", "Transmision automatica"),
                "Vuelo Buenos Aires - Bariloche", List.of("Equipaje de mano", "Wifi"));

        for (Product product : productRepository.findAll()) {
            String categoryTitle = categoryByProduct.get(product.getName());
            if (product.getCategory() == null && categoryTitle != null) {
                categoryRepository.findByTitleIgnoreCase(categoryTitle).ifPresent(product::setCategory);
            }
            List<String> featureNames = featuresByProduct.get(product.getName());
            if (product.getFeatures().isEmpty() && featureNames != null) {
                featureNames.forEach(name -> featureRepository.findByNameIgnoreCase(name)
                        .ifPresent(product.getFeatures()::add));
            }
            productRepository.save(product);
        }
    }
}
