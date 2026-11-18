package com.reservaya.service;

import com.reservaya.dto.ReviewDtos.ReviewEligibility;
import com.reservaya.dto.ReviewDtos.ReviewRequest;
import com.reservaya.dto.ReviewDtos.ReviewSummary;
import com.reservaya.exception.ForbiddenOperationException;
import com.reservaya.model.Product;
import com.reservaya.model.Review;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import com.reservaya.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Historia #28: solo con reserva finalizada, una valoracion por usuario y media actualizada. */
@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ReservationRepository reservationRepository;

    private ReviewService service;
    private Product product;
    private User user;
    private final List<Review> stored = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new ReviewService(reviewRepository, productRepository, reservationRepository);
        product = new Product("Hotel", "d", List.of("img"));
        ReflectionTestUtils.setField(product, "id", 1L);
        user = new User("Lucia", "Fernandez", "lucia@mail.com", "x", Role.USER);
        ReflectionTestUtils.setField(user, "id", 7L);
        lenient().when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        lenient().when(reviewRepository.findByProductIdOrderByCreatedAtDesc(1L)).thenAnswer(inv -> stored);
        lenient().when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            if (!stored.contains(r)) stored.add(r);
            return r;
        });
    }

    private void completedReservation(boolean value) {
        when(reservationRepository.existsByUserIdAndProductIdAndEndDateLessThanEqual(eq(7L), eq(1L), any(LocalDate.class)))
                .thenReturn(value);
    }

    @Test
    void sinReservaFinalizada_noPuedeValorar() {
        completedReservation(false);

        assertThatThrownBy(() -> service.rate(1L, user, new ReviewRequest(5, "Genial")))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("reserva finalizada");
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void conReservaFinalizada_valoraYActualizaLaMedia() {
        completedReservation(true);
        stored.add(new Review(product, new User("Otro", "Usuario", "o@mail.com", "x", Role.USER), 2, null));
        when(reviewRepository.findByProductIdAndUserId(1L, 7L)).thenReturn(Optional.empty());

        ReviewSummary summary = service.rate(1L, user, new ReviewRequest(5, "  Muy lindo  "));

        assertThat(summary.count()).isEqualTo(2);
        assertThat(summary.average()).isEqualTo(3.5);
        assertThat(product.getRatingAverage()).isEqualTo(3.5);
        assertThat(summary.reviews()).anySatisfy(r -> {
            assertThat(r.userName()).isEqualTo("Lucia Fernandez");
            assertThat(r.comment()).isEqualTo("Muy lindo");
            assertThat(r.createdAt()).isNotNull();
        });
    }

    @Test
    void volverAValorar_actualizaEnLugarDeDuplicar() {
        completedReservation(true);
        Review previous = new Review(product, user, 2, "Regular");
        stored.add(previous);
        when(reviewRepository.findByProductIdAndUserId(1L, 7L)).thenReturn(Optional.of(previous));

        ReviewSummary summary = service.rate(1L, user, new ReviewRequest(4, ""));

        assertThat(summary.count()).isEqualTo(1);
        assertThat(previous.getRating()).isEqualTo(4);
        assertThat(previous.getComment()).isNull();
        assertThat(product.getRatingAverage()).isEqualTo(4.0);
    }

    @Test
    void elegibilidad_anonimoYSinReserva() {
        assertThat(service.eligibility(1L, null).authenticated()).isFalse();

        completedReservation(false);
        when(reviewRepository.findByProductIdAndUserId(1L, 7L)).thenReturn(Optional.empty());
        ReviewEligibility eligibility = service.eligibility(1L, user);
        assertThat(eligibility.authenticated()).isTrue();
        assertThat(eligibility.canReview()).isFalse();
        assertThat(eligibility.reason()).contains("reserva finalizada");
    }
}
