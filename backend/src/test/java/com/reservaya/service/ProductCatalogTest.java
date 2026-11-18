package com.reservaya.service;

import com.reservaya.dto.ProductPageResponse;
import com.reservaya.dto.ProductRequest;
import com.reservaya.exception.DuplicateProductNameException;
import com.reservaya.exception.ResourceNotFoundException;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Historias #12 (categorizar), #17 (caracteristicas en el producto) y #20 (filtro por categoria). */
@ExtendWith(MockitoExtension.class)
class ProductCatalogTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private FeatureRepository featureRepository;

    private ProductService service;

    private final Category hoteles = new Category("Hoteles", "Alojamientos", "img");
    private final Feature wifi = new Feature("Wifi", "wifi");
    private final Feature pileta = new Feature("Pileta", "pileta");

    @BeforeEach
    void setUp() {
        service = new ProductService(productRepository, categoryRepository, featureRepository);
    }

    @Test
    void create_conCategoriaYCaracteristicas_lasAsocia() {
        when(productRepository.existsByNameIgnoreCase("Hotel Sol")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(hoteles));
        when(featureRepository.findAllById(Set.of(1L, 2L))).thenReturn(new ArrayList<>(List.of(wifi, pileta)));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product saved = service.create(new ProductRequest("Hotel Sol", "Desc", List.of("img"), 1L, Set.of(1L, 2L)));

        assertThat(saved.getCategory()).isSameAs(hoteles);
        assertThat(saved.getFeatures()).extracting(Feature::getName).containsExactly("Pileta", "Wifi");
    }

    @Test
    void create_conCategoriaInexistente_lanza404() {
        when(productRepository.existsByNameIgnoreCase("Hotel Sol")).thenReturn(false);
        when(categoryRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(new ProductRequest("Hotel Sol", "Desc", List.of("img"), 9L, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Categoria");
        verify(productRepository, never()).save(any());
    }

    @Test
    void create_conCaracteristicaInexistente_lanza404() {
        when(productRepository.existsByNameIgnoreCase("Hotel Sol")).thenReturn(false);
        when(featureRepository.findAllById(Set.of(1L, 99L))).thenReturn(new ArrayList<>(List.of(wifi)));

        assertThatThrownBy(() -> service.create(new ProductRequest("Hotel Sol", "Desc", List.of("img"), null, Set.of(1L, 99L))))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignCategory_aProductoExistente() {
        Product product = new Product("Hotel", "Desc", new ArrayList<>(List.of("img")));
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(hoteles));
        when(productRepository.save(product)).thenReturn(product);

        assertThat(service.assignCategory(5L, 1L).getCategory()).isSameAs(hoteles);
    }

    @Test
    void assignCategory_null_quitaLaCategoria() {
        Product product = new Product("Hotel", "Desc", new ArrayList<>(List.of("img")));
        product.setCategory(hoteles);
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        assertThat(service.assignCategory(5L, null).getCategory()).isNull();
    }

    @Test
    void update_reemplazaDatosCategoriaYCaracteristicas() {
        Product product = new Product("Viejo", "Vieja", new ArrayList<>(List.of("a", "b")));
        product.getFeatures().add(pileta);
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(productRepository.existsByNameIgnoreCaseAndIdNot("Nuevo", 5L)).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(hoteles));
        when(featureRepository.findAllById(Set.of(1L))).thenReturn(new ArrayList<>(List.of(wifi)));
        when(productRepository.save(product)).thenReturn(product);

        Product updated = service.update(5L, new ProductRequest(" Nuevo ", " Nueva ", List.of("c"), 1L, Set.of(1L)));

        assertThat(updated.getName()).isEqualTo("Nuevo");
        assertThat(updated.getDescription()).isEqualTo("Nueva");
        assertThat(updated.getImages()).containsExactly("c");
        assertThat(updated.getCategory()).isSameAs(hoteles);
        assertThat(updated.getFeatures()).containsExactly(wifi);
    }

    @Test
    void update_conNombreDeOtroProducto_lanzaConflicto() {
        when(productRepository.findById(5L)).thenReturn(Optional.of(new Product("A", "B", new ArrayList<>(List.of("x")))));
        when(productRepository.existsByNameIgnoreCaseAndIdNot("Otro", 5L)).thenReturn(true);

        assertThatThrownBy(() -> service.update(5L, new ProductRequest("Otro", "B", List.of("x"))))
                .isInstanceOf(DuplicateProductNameException.class);
    }

    @Test
    void findPage_conCategorias_filtraYDevuelveTotalGeneral() {
        List<Product> matching = List.of(new Product("Hotel", "D", List.of("i")));
        when(productRepository.findByCategoryIdIn(eq(List.of(1L, 2L)), any(Pageable.class)))
                .thenReturn(new PageImpl<>(matching, PageRequest.of(0, 10), 1));
        when(productRepository.count()).thenReturn(12L);

        ProductPageResponse response = service.findPage(0, 10, List.of(1L, 2L));

        assertThat(response.content()).hasSize(1);
        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.totalProducts()).isEqualTo(12);
        verify(productRepository, never()).findAll(any(Pageable.class));
    }
}
