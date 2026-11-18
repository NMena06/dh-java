package com.reservaya.dto;

import com.reservaya.config.ProviderContact;
import com.reservaya.model.Product;
import com.reservaya.model.Reservation;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/** DTOs de reservas (historias #30 a #33 y #35). No se expone la entidad. */
public final class ReservationDtos {

    private ReservationDtos() {
    }

    public record ReservationRequest(
            @NotNull(message = "El producto es obligatorio")
            Long productId,

            @NotNull(message = "La fecha de entrada es obligatoria")
            LocalDate startDate,

            @NotNull(message = "La fecha de salida es obligatoria")
            LocalDate endDate,

            @Min(value = 1, message = "La cantidad de personas debe ser al menos 1")
            @Max(value = 20, message = "La cantidad de personas no puede superar 20")
            Integer guests,

            @Pattern(regexp = "^\\+?[0-9 ()-]{6,20}$", message = "El telefono no es valido")
            String phone,

            @Size(max = 500, message = "Los comentarios no pueden superar los 500 caracteres")
            String comments
    ) {
    }

    public record ProductSummary(Long id, String name, String image, String location, String category) {

        static ProductSummary from(Product p) {
            return new ProductSummary(p.getId(), p.getName(), p.getImages().isEmpty() ? null : p.getImages().get(0),
                    p.getLocation(), p.getCategory() != null ? p.getCategory().getTitle() : null);
        }
    }

    public record Provider(String name, String email, String phone) {
    }

    /** UPCOMING (proxima), IN_PROGRESS (en curso) o COMPLETED (finalizada), segun la fecha de hoy. */
    public enum Status { UPCOMING, IN_PROGRESS, COMPLETED }

    public record ReservationResponse(
            Long id,
            String code,
            ProductSummary product,
            LocalDate startDate,
            LocalDate endDate,
            long nights,
            Integer guests,
            String phone,
            String comments,
            LocalDateTime createdAt,
            Status status,
            String userName,
            String userEmail,
            Provider provider
    ) {
        public static ReservationResponse from(Reservation r, ProviderContact contact, LocalDate today) {
            Status status = !r.getEndDate().isAfter(today) ? Status.COMPLETED
                    : !r.getStartDate().isAfter(today) ? Status.IN_PROGRESS : Status.UPCOMING;
            return new ReservationResponse(
                    r.getId(), r.getCode(), ProductSummary.from(r.getProduct()),
                    r.getStartDate(), r.getEndDate(), ChronoUnit.DAYS.between(r.getStartDate(), r.getEndDate()),
                    r.getGuests(), r.getPhone(), r.getComments(), r.getCreatedAt(), status,
                    r.getUser().getFirstName() + " " + r.getUser().getLastName(), r.getUser().getEmail(),
                    new Provider(contact.name(), contact.email(), contact.phone()));
        }
    }
}
