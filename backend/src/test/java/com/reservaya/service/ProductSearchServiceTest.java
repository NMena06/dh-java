package com.reservaya.service;

import com.reservaya.dto.ProductPageResponse;
import com.reservaya.dto.SearchDtos.Suggestion;
import com.reservaya.model.Category;
import com.reservaya.model.Product;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/** Historia #22: relevancia, filtro por fechas y autocompletado. */
@ExtendWith(MockitoExtension.class)
class ProductSearchServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ReservationRepository reservationRepository;

    private ProductSearchService service;

    private final Category hoteles = category(1L, "Hoteles");
    private final Category autos = category(2L, "Autos");
    private Product hotelLago;
    private Product deptoCentro;
    private Product auto;

    private static Category category(long id, String title) {
        Category c = new Category(title, "d", "img");
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private static Product product(long id, String name, String description, Category category) {
        Product p = new Product(name, description, List.of("img"));
        ReflectionTestUtils.setField(p, "id", id);
        p.setCategory(category);
        return p;
    }

    @BeforeEach
    void setUp() {
        service = new ProductSearchService(productRepository, categoryRepository, reservationRepository);
        hotelLago = product(1, "Hotel Mirador del Lago", "Frente al lago con piscina", hoteles);
        deptoCentro = product(2, "Departamento Centro Histórico", "Cerca del hotel Plaza y del lago urbano", hoteles);
        auto = product(3, "Auto Compacto Automatico", "Transmision automatica", autos);
        lenient().when(productRepository.findAll()).thenReturn(List.of(hotelLago, deptoCentro, auto));
    }

    @Test
    void buscarPorTexto_ordenaPorRelevancia_nombreAntesQueDescripcion() {
        ProductPageResponse result = service.search("lago", null, null, null, 0, 10);

        assertThat(result.content()).extracting(Product::getName)
                .containsExactly("Hotel Mirador del Lago", "Departamento Centro Histórico");
        assertThat(result.totalElements()).isEqualTo(2);
        assertThat(result.totalProducts()).isEqualTo(3);
    }

    @Test
    void buscar_sinTildesNiMayusculas_yPorCategoria() {
        assertThat(service.search("HISTORICO", null, null, null, 0, 10).content()).containsExactly(deptoCentro);
        assertThat(service.search("autos", null, null, null, 0, 10).content()).containsExactly(auto);
    }

    @Test
    void buscar_todasLasPalabrasDebenCoincidir() {
        assertThat(service.search("hotel piscina", null, null, null, 0, 10).content()).containsExactly(hotelLago);
        assertThat(service.search("hotel transmision", null, null, null, 0, 10).content()).isEmpty();
    }

    @Test
    void buscarConFechas_excluyeProductosReservados() {
        LocalDate in = LocalDate.of(2030, 1, 10);
        LocalDate out = LocalDate.of(2030, 1, 15);
        when(reservationRepository.findBookedProductIds(in, out)).thenReturn(Set.of(1L));

        ProductPageResponse result = service.search("", in, out, null, 0, 10);

        assertThat(result.content()).extracting(Product::getId).containsExactlyInAnyOrder(2L, 3L);
    }

    @Test
    void fechasInvalidas_lanzanError() {
        LocalDate d = LocalDate.of(2030, 1, 10);
        assertThatThrownBy(() -> service.search("", d, null, null, 0, 10)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.search("", d, d, null, 0, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("posterior");
    }

    @Test
    void buscar_combinaConCategorias() {
        assertThat(service.search("", null, null, List.of(2L), 0, 10).content()).containsExactly(auto);
    }

    @Test
    void sugerencias_categoriasYProductos_primeroLosQueEmpiezan() {
        when(categoryRepository.findAll()).thenReturn(List.of(hoteles, autos));

        List<Suggestion> suggestions = service.suggestions("hot");

        assertThat(suggestions).extracting(Suggestion::label).containsExactly("Hoteles", "Hotel Mirador del Lago");
        assertThat(suggestions.get(0).type()).isEqualTo("category");
        assertThat(service.suggestions("h")).isEmpty();
    }
}
