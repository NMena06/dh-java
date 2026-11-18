package com.reservaya.service;

import com.reservaya.dto.CategoryRequest;
import com.reservaya.dto.FeatureRequest;
import com.reservaya.exception.ConflictException;
import com.reservaya.model.Category;
import com.reservaya.model.Feature;
import com.reservaya.model.Product;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.FeatureRepository;
import com.reservaya.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Historias #21 (agregar categoria) y #17 (administrar caracteristicas). */
@ExtendWith(MockitoExtension.class)
class CategoryFeatureServiceTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private FeatureRepository featureRepository;
    @Mock
    private ProductRepository productRepository;

    private CategoryService categoryService;
    private FeatureService featureService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository, productRepository);
        featureService = new FeatureService(featureRepository, productRepository);
    }

    @Test
    void crearCategoria_guardaTituloDescripcionEImagen() {
        when(categoryRepository.existsByTitleIgnoreCase("Cabañas")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Category saved = categoryService.create(new CategoryRequest(" Cabañas ", " En la montaña ", "data:image/png;base64,AA"));

        assertThat(saved.getTitle()).isEqualTo("Cabañas");
        assertThat(saved.getDescription()).isEqualTo("En la montaña");
        assertThat(saved.getImage()).startsWith("data:image/png");
    }

    @Test
    void crearCategoria_duplicada_lanzaConflicto() {
        when(categoryRepository.existsByTitleIgnoreCase("Hoteles")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.create(new CategoryRequest("Hoteles", "d", "img")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void eliminarCategoria_desasociaProductosAntesDeBorrar() {
        Category category = new Category("Hoteles", "d", "img");
        ReflectionTestUtils.setField(category, "id", 3L);
        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));

        categoryService.delete(3L);

        var order = inOrder(productRepository, categoryRepository);
        order.verify(productRepository).clearCategory(3L);
        order.verify(categoryRepository).delete(category);
    }

    @Test
    void crearCaracteristica_conNombreEIcono() {
        when(featureRepository.existsByNameIgnoreCase("Wifi")).thenReturn(false);
        when(featureRepository.save(any(Feature.class))).thenAnswer(inv -> inv.getArgument(0));

        Feature saved = featureService.create(new FeatureRequest("Wifi", "wifi"));

        assertThat(saved.getName()).isEqualTo("Wifi");
        assertThat(saved.getIcon()).isEqualTo("wifi");
    }

    @Test
    void editarCaracteristica_cambiaNombreEIcono() {
        Feature feature = new Feature("Wi-fi", "wifi");
        when(featureRepository.findById(1L)).thenReturn(Optional.of(feature));
        when(featureRepository.existsByNameIgnoreCaseAndIdNot("Internet", 1L)).thenReturn(false);
        when(featureRepository.save(feature)).thenReturn(feature);

        Feature updated = featureService.update(1L, new FeatureRequest("Internet", "televisor"));

        assertThat(updated.getName()).isEqualTo("Internet");
        assertThat(updated.getIcon()).isEqualTo("televisor");
    }

    @Test
    void editarCaracteristica_conNombreDeOtra_lanzaConflicto() {
        when(featureRepository.findById(1L)).thenReturn(Optional.of(new Feature("A", "wifi")));
        when(featureRepository.existsByNameIgnoreCaseAndIdNot("Pileta", 1L)).thenReturn(true);

        assertThatThrownBy(() -> featureService.update(1L, new FeatureRequest("Pileta", "pileta")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void eliminarCaracteristica_laQuitaDeLosProductos() {
        Feature wifi = new Feature("Wifi", "wifi");
        ReflectionTestUtils.setField(wifi, "id", 1L);
        Product product = new Product("Hotel", "d", new ArrayList<>(List.of("img")));
        product.getFeatures().add(wifi);
        when(featureRepository.findById(1L)).thenReturn(Optional.of(wifi));
        when(productRepository.findByFeaturesId(1L)).thenReturn(List.of(product));

        featureService.delete(1L);

        assertThat(product.getFeatures()).isEmpty();
        verify(featureRepository).delete(wifi);
    }
}
