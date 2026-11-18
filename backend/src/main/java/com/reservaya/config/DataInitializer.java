package com.reservaya.config;

import com.reservaya.model.*;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.FeatureRepository;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import com.reservaya.repository.ReviewRepository;
import com.reservaya.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(ProductRepository productRepository,
                           CategoryRepository categoryRepository,
                           FeatureRepository featureRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           ReservationRepository reservationRepository,
                           ReviewRepository reviewRepository,
                           @Value("${app.admin.email:admin@reservaya.com}") String adminEmail,
                           @Value("${app.admin.password:Admin1234}") String adminPassword) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.featureRepository = featureRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.reservationRepository = reservationRepository;
        this.reviewRepository = reviewRepository;
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
        seedDemoUser();
        seedPolicies();
        seedReservationsAndReviews();
    }

    // ------------------------------------------------------------------ Sprint 3

    private static final String DEMO_EMAIL = "usuario@reservaya.com";

    /** Usuario comun de demostracion, con reservas finalizadas para poder valorar (historia #28). */
    private void seedDemoUser() {
        if (userRepository.existsByEmailIgnoreCase(DEMO_EMAIL)) {
            return;
        }
        userRepository.save(new User("Lucia", "Fernandez", DEMO_EMAIL, passwordEncoder.encode("Usuario1234"), Role.USER));
        log.info("Usuario de demostracion creado: {}", DEMO_EMAIL);
    }

    /** Politicas de uso (historia #26) para los productos que todavia no tienen. */
    private void seedPolicies() {
        // Solo en la primera carga del Sprint 3 (todavia sin reservas): no pisa productos creados despues sin politicas
        if (reservationRepository.count() > 0) {
            return;
        }
        for (Product product : productRepository.findAll()) {
            if (!product.getPolicies().isEmpty()) {
                continue;
            }
            String category = product.getCategory() != null ? product.getCategory().getTitle() : "";
            product.getPolicies().addAll(defaultPolicies(category));
            productRepository.save(product);
        }
    }

    static List<Policy> defaultPolicies(String category) {
        return switch (category) {
            case "Autos" -> List.of(
                    new Policy("Requisitos del conductor", "Licencia de conducir vigente, documento de identidad y tarjeta de crédito a nombre del titular. Edad mínima 21 años."),
                    new Policy("Combustible y kilometraje", "El vehículo se entrega con tanque lleno y debe devolverse igual. Kilometraje ilimitado dentro del país."),
                    new Policy("Cancelación", "Cancelación gratuita hasta 48 horas antes del retiro. Después se cobra un día de alquiler."));
            case "Vuelos" -> List.of(
                    new Policy("Equipaje", "Incluye un equipaje de mano de hasta 8 kg. El equipaje en bodega se abona por separado."),
                    new Policy("Presentación", "Presentarse en el aeropuerto 2 horas antes de la salida con documento vigente."),
                    new Policy("Cambios y cancelación", "Cambios de fecha con cargo hasta 24 horas antes del vuelo. Pasajes no reembolsables."));
            case "Alquileres de moda" -> List.of(
                    new Policy("Cuidado de la prenda", "No lavar ni planchar la prenda. La limpieza profesional está incluida en el precio."),
                    new Policy("Devolución", "Devolver dentro del plazo reservado en la misma funda en que se entregó."),
                    new Policy("Daños", "Manchas permanentes, roturas o pérdida de accesorios se cobran según el valor de reposición."));
            default -> List.of(
                    new Policy("Normas de la casa", "Check-in desde las 14:00 y check-out hasta las 10:00. No se permiten fiestas ni eventos. Horario de descanso de 22:00 a 8:00."),
                    new Policy("Salud y seguridad", "Detector de humo y extintor disponibles. Se solicita no fumar dentro de las habitaciones."),
                    new Policy("Política de cancelación", "Cancelación gratuita hasta 72 horas antes de la llegada. Después se cobra la primera noche."));
        };
    }

    /**
     * Reservas de ejemplo relativas a hoy: futuras para ver fechas ocupadas (historia #23) y pasadas
     * (finalizadas) para habilitar valoraciones (historia #28). Solo si no hay reservas.
     */
    private void seedReservationsAndReviews() {
        if (reservationRepository.count() > 0) {
            return;
        }
        Optional<User> demo = userRepository.findByEmailIgnoreCase(DEMO_EMAIL);
        Optional<User> admin = userRepository.findByEmailIgnoreCase(adminEmail);
        if (demo.isEmpty() || admin.isEmpty()) {
            return;
        }
        LocalDate today = LocalDate.now();
        List<Product> products = productRepository.findAll();
        int offset = 0;
        for (Product product : products) {
            // Futuras: tres bloques ocupados por producto, desplazados para que no coincidan entre productos
            reservationRepository.save(new Reservation(product, admin.get(), today.plusDays(3 + offset), today.plusDays(7 + offset)));
            reservationRepository.save(new Reservation(product, admin.get(), today.plusDays(15 + offset), today.plusDays(18 + offset)));
            reservationRepository.save(new Reservation(product, admin.get(), today.plusDays(34 + offset), today.plusDays(40 + offset)));
            offset = (offset + 2) % 8;
        }
        // Finalizadas: el usuario demo puede valorar estos productos; el admin ya valoro el hotel
        for (String name : List.of("Hotel Mirador del Lago", "Auto Compacto Automatico", "Departamento Centro Histórico")) {
            products.stream().filter(p -> p.getName().equals(name)).findFirst().ifPresent(p ->
                    reservationRepository.save(new Reservation(p, demo.get(), today.minusDays(20), today.minusDays(16))));
        }
        products.stream().filter(p -> p.getName().equals("Hotel Mirador del Lago")).findFirst().ifPresent(p -> {
            reservationRepository.save(new Reservation(p, admin.get(), today.minusDays(40), today.minusDays(37)));
            if (reviewRepository.findByProductIdAndUserId(p.getId(), admin.get().getId()).isEmpty()) {
                Review review = new Review(p, admin.get(), 5, "Excelente ubicacion y atencion. La vista al lago es increible.");
                review.setCreatedAt(today.minusDays(36).atTime(10, 30));
                reviewRepository.save(review);
                p.updateRating(5, 1);
                productRepository.save(p);
            }
        });
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
