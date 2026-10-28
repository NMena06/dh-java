package com.reservaya.service;

import com.reservaya.dto.PageResponse;
import com.reservaya.dto.ProductRequest;
import com.reservaya.exception.DuplicateProductNameException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Product;
import com.reservaya.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository repository;

    private ProductService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        service = new ProductService(repository);
    }

    private List<Product> products(int count) {
        return IntStream.rangeClosed(1, count)
                .mapToObj(i -> new Product("Producto " + i, "Descripcion " + i, List.of("img" + i)))
                .collect(Collectors.toList());
    }

    @Test
    void create_guardaProductoConNombreRecortado() {
        when(repository.existsByNameIgnoreCase("Hotel Sol")).thenReturn(false);
        when(repository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product saved = service.create(new ProductRequest("  Hotel Sol  ", " Lindo ", List.of("data:image/png;base64,AA")));

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Hotel Sol");
        assertThat(captor.getValue().getDescription()).isEqualTo("Lindo");
        assertThat(captor.getValue().getImages()).hasSize(1);
        assertThat(saved.getName()).isEqualTo("Hotel Sol");
    }

    @Test
    void create_nombreDuplicado_lanzaExcepcion() {
        when(repository.existsByNameIgnoreCase("HOTEL SOL")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new ProductRequest("HOTEL SOL", "d", List.of("img"))))
                .isInstanceOf(DuplicateProductNameException.class)
                .hasMessageContaining("ya esta en uso");
        verify(repository, never()).save(any());
    }

    @Test
    void findRandom_devuelveLimiteSinRepetidos() {
        when(repository.findAll()).thenReturn(products(20));

        List<Product> random = service.findRandom(10);

        assertThat(random).hasSize(10);
        Set<String> names = random.stream().map(Product::getName).collect(Collectors.toSet());
        assertThat(names).hasSize(10);
    }

    @Test
    void findRandom_conMenosProductosQueElLimite_devuelveTodos() {
        when(repository.findAll()).thenReturn(products(3));

        assertThat(service.findRandom(10)).hasSize(3);
    }

    @Test
    void findRandom_noSiempreEsElMismoOrden() {
        when(repository.findAll()).thenReturn(products(30));

        Set<String> firstElements = new java.util.HashSet<>();
        for (int i = 0; i < 20; i++) {
            firstElements.add(service.findRandom(10).get(0).getName());
        }
        assertThat(firstElements.size()).isGreaterThan(1);
    }

    @Test
    void findPage_devuelveMetadatosDePaginacion() {
        Page<Product> page = new PageImpl<>(products(10), PageRequest.of(1, 10), 25);
        when(repository.findAll(any(PageRequest.class))).thenReturn(page);

        PageResponse<Product> response = service.findPage(1, 10);

        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(10);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.totalElements()).isEqualTo(25);
        assertThat(response.content()).hasSize(10);
    }

    @Test
    void findById_inexistente_lanzaNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_existente_borraDeRepositorio() {
        Product product = new Product("A", "B", List.of("img"));
        when(repository.findById(1L)).thenReturn(Optional.of(product));

        service.delete(1L);

        verify(repository).delete(product);
    }

    @Test
    void delete_inexistente_noBorra() {
        when(repository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(5L)).isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).delete(any());
    }
}
