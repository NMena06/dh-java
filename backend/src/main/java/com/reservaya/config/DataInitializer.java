package com.reservaya.config;

import com.reservaya.model.Product;
import com.reservaya.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Carga productos de ejemplo solo si la base esta vacia (para ver el home con datos).
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataInitializer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
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
}
