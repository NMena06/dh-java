package com.reservaya.service;

import com.reservaya.config.ProviderContact;
import com.reservaya.dto.ReservationDtos.ReservationRequest;
import com.reservaya.dto.ReservationDtos.ReservationResponse;
import com.reservaya.exception.ConflictException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Product;
import com.reservaya.model.Reservation;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import com.reservaya.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Historias #30 a #33 y #35: crear reservas, verlas y enviar el correo de confirmacion.
 *
 * Para que dos personas no reserven las mismas fechas a la vez, la verificacion de disponibilidad y el guardado
 * se hacen dentro de un bloqueo por producto y en una transaccion que termina antes de soltar el bloqueo.
 * Es suficiente para una sola instancia del backend (el caso del MVP). El correo se envia despues del commit.
 */
@Service
public class ReservationService {

    static final int MAX_NIGHTS = 90;
    static final String DATES_TAKEN = "Las fechas seleccionadas ya no están disponibles para este producto. Elige otro rango en el calendario.";

    private final ReservationRepository reservationRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ProviderContact providerContact;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;
    private final ConcurrentHashMap<Long, Object> productLocks = new ConcurrentHashMap<>();

    @Autowired
    public ReservationService(ReservationRepository reservationRepository,
                              ProductRepository productRepository,
                              UserRepository userRepository,
                              EmailService emailService,
                              ProviderContact providerContact,
                              PlatformTransactionManager transactionManager) {
        this(reservationRepository, productRepository, userRepository, emailService, providerContact,
                new TransactionTemplate(transactionManager), Clock.systemDefaultZone());
    }

    ReservationService(ReservationRepository reservationRepository, ProductRepository productRepository,
                       UserRepository userRepository, EmailService emailService, ProviderContact providerContact,
                       TransactionTemplate transactionTemplate, Clock clock) {
        this.reservationRepository = reservationRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.providerContact = providerContact;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    public ReservationResponse create(User user, ReservationRequest request) {
        LocalDate today = LocalDate.now(clock);
        validateDates(request.startDate(), request.endDate(), today);

        Object lock = productLocks.computeIfAbsent(request.productId(), id -> new Object());
        ReservationResponse created;
        synchronized (lock) {
            created = transactionTemplate.execute(status -> {
                Product product = productRepository.findById(request.productId())
                        .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id " + request.productId()));
                if (!reservationRepository.findOverlapping(product.getId(), request.startDate(), request.endDate()).isEmpty()) {
                    throw new ConflictException(DATES_TAKEN);
                }
                Reservation reservation = new Reservation(product, userRepository.getReferenceById(user.getId()),
                        request.startDate(), request.endDate());
                reservation.setGuests(request.guests());
                reservation.setPhone(blankToNull(request.phone()));
                reservation.setComments(blankToNull(request.comments()));
                Reservation saved = reservationRepository.save(reservation);
                return ReservationResponse.from(saved, providerContact, today);
            });
        }
        emailService.sendReservationConfirmation(created);
        return created;
    }

    /** Historial del usuario: la fecha de uso mas reciente primero. */
    @Transactional(readOnly = true)
    public List<ReservationResponse> listForUser(User user) {
        LocalDate today = LocalDate.now(clock);
        return reservationRepository.findByUserIdOrderByStartDateDesc(user.getId()).stream()
                .map(r -> ReservationResponse.from(r, providerContact, today))
                .toList();
    }

    /** Detalle para la pagina de confirmacion. Solo el titular o un administrador. */
    @Transactional(readOnly = true)
    public ReservationResponse findForUser(Long id, User user) {
        Reservation reservation = reservationRepository.findById(id)
                .filter(r -> r.getUser().getId().equals(user.getId()) || user.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));
        return ReservationResponse.from(reservation, providerContact, LocalDate.now(clock));
    }

    static void validateDates(LocalDate start, LocalDate end, LocalDate today) {
        if (start.isBefore(today)) {
            throw new IllegalArgumentException("La fecha de entrada no puede ser anterior a hoy");
        }
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("La fecha de salida debe ser posterior a la de entrada");
        }
        if (ChronoUnit.DAYS.between(start, end) > MAX_NIGHTS) {
            throw new IllegalArgumentException("La reserva no puede superar las " + MAX_NIGHTS + " noches");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
