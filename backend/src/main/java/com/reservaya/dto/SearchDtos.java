package com.reservaya.dto;

import java.time.LocalDate;
import java.util.List;

/** DTOs de busqueda (#22) y disponibilidad (#23). */
public final class SearchDtos {

    private SearchDtos() {
    }

    /** Sugerencia de autocompletado: un producto o una categoria. */
    public record Suggestion(String type, Long id, String label, String detail) {
    }

    /** Rango ocupado: desde {@code start} (inclusive) hasta {@code end} (dia de salida, exclusivo). */
    public record DateRange(LocalDate start, LocalDate end) {
    }

    public record AvailabilityResponse(Long productId, LocalDate from, LocalDate to, List<DateRange> bookedRanges) {
    }
}
