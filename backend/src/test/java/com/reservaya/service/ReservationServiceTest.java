package com.reservaya.service;

import com.reservaya.config.ProviderContact;
import com.reservaya.dto.ReservationDtos.ReservationRequest;
import com.reservaya.dto.ReservationDtos.ReservationResponse;
import com.reservaya.dto.ReservationDtos.Status;
import com.reservaya.exception.ConflictException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Product;
import com.reservaya.model.Reservation;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import com.reservaya.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Historias #30 a #33 y #35: reglas de la reserva. */
@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2030, 6, 1);

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private TransactionTemplate transactionTemplate;

    private ReservationService service;
    private User user;
    private Product product;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atStartOfDay(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        service = new ReservationService(reservationRepository, productRepository, userRepository, emailService,
                new ProviderContact("Proveedor", "p@mail.com", "+54 11 1"), transactionTemplate, clock);
        user = new User("Lucia", "Fernandez", "lucia@mail.com", "x", Role.USER);
        ReflectionTestUtils.setField(user, "id", 7L);
        product = new Product("Hotel", "d", List.of("img"));
        ReflectionTestUtils.setField(product, "id", 1L);
        // La plantilla de transaccion ejecuta el callback directamente
        lenient().when(transactionTemplate.execute(any())).thenAnswer(inv -> ((TransactionCallback<?>) inv.getArgument(0)).doInTransaction(null));
        lenient().when(userRepository.getReferenceById(7L)).thenReturn(user);
    }

    private ReservationRequest request(LocalDate start, LocalDate end) {
        return new ReservationRequest(1L, start, end, 2, " +54 11 5555-5555 ", "  ");
    }

    @Test
    void reservaValida_guardaDatosOpcionalesYEnviaCorreo() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reservationRepository.findOverlapping(1L, TODAY.plusDays(2), TODAY.plusDays(5))).thenReturn(List.of());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            ReflectionTestUtils.setField(r, "id", 42L);
            return r;
        });

        ReservationResponse response = service.create(user, request(TODAY.plusDays(2), TODAY.plusDays(5)));

        assertThat(response.code()).isEqualTo("RY-000042");
        assertThat(response.nights()).isEqualTo(3);
        assertThat(response.guests()).isEqualTo(2);
        assertThat(response.phone()).isEqualTo("+54 11 5555-5555");
        assertThat(response.comments()).isNull();
        assertThat(response.status()).isEqualTo(Status.UPCOMING);
        assertThat(response.userEmail()).isEqualTo("lucia@mail.com");
        assertThat(response.provider().email()).isEqualTo("p@mail.com");
        assertThat(response.createdAt()).isNotNull();
        verify(emailService).sendReservationConfirmation(response);
    }

    @Test
    void fechasOcupadas_lanzaConflictoYNoGuarda() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reservationRepository.findOverlapping(1L, TODAY.plusDays(2), TODAY.plusDays(5)))
                .thenReturn(List.of(new Reservation(product, user, TODAY.plusDays(4), TODAY.plusDays(6))));

        assertThatThrownBy(() -> service.create(user, request(TODAY.plusDays(2), TODAY.plusDays(5))))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ya no están disponibles");
        verify(reservationRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void fechasInvalidas_lanzanErrorConMensajeEspecifico() {
        assertThatThrownBy(() -> service.create(user, request(TODAY.minusDays(1), TODAY.plusDays(2))))
                .hasMessage("La fecha de entrada no puede ser anterior a hoy");
        assertThatThrownBy(() -> service.create(user, request(TODAY.plusDays(3), TODAY.plusDays(3))))
                .hasMessage("La fecha de salida debe ser posterior a la de entrada");
        assertThatThrownBy(() -> service.create(user, request(TODAY, TODAY.plusDays(91))))
                .hasMessageContaining("90 noches");
        verifyNoInteractions(reservationRepository);
    }

    @Test
    void productoInexistente_lanza404() {
        when(productRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(user, request(TODAY.plusDays(1), TODAY.plusDays(2))))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void historial_calculaEstadoSegunHoy() {
        when(reservationRepository.findByUserIdOrderByStartDateDesc(7L)).thenReturn(List.of(
                new Reservation(product, user, TODAY.plusDays(10), TODAY.plusDays(12)),
                new Reservation(product, user, TODAY.minusDays(1), TODAY.plusDays(1)),
                new Reservation(product, user, TODAY.minusDays(9), TODAY.minusDays(7))));

        List<ReservationResponse> list = service.listForUser(user);

        assertThat(list).extracting(ReservationResponse::status)
                .containsExactly(Status.UPCOMING, Status.IN_PROGRESS, Status.COMPLETED);
    }

    @Test
    void detalle_soloTitularOAdmin() {
        Reservation r = new Reservation(product, user, TODAY.plusDays(1), TODAY.plusDays(2));
        when(reservationRepository.findById(5L)).thenReturn(Optional.of(r));
        User other = new User("Otro", "Usuario", "o@mail.com", "x", Role.USER);
        ReflectionTestUtils.setField(other, "id", 8L);
        User admin = new User("Admin", "R", "a@mail.com", "x", Role.ADMIN);
        ReflectionTestUtils.setField(admin, "id", 9L);

        assertThat(service.findForUser(5L, user).userName()).isEqualTo("Lucia Fernandez");
        assertThat(service.findForUser(5L, admin)).isNotNull();
        assertThatThrownBy(() -> service.findForUser(5L, other)).isInstanceOf(ResourceNotFoundException.class);
    }
}
