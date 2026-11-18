package com.reservaya.service;

import com.reservaya.dto.SearchDtos.AvailabilityResponse;
import com.reservaya.dto.SearchDtos.DateRange;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** Historia #23: rangos ya reservados de un producto, para marcarlos en el calendario. */
@Service
public class AvailabilityService {

    private static final int MAX_MONTHS = 12;

    private final ProductRepository productRepository;
    private final ReservationRepository reservationRepository;

    public AvailabilityService(ProductRepository productRepository, ReservationRepository reservationRepository) {
        this.productRepository = productRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse availability(Long productId, LocalDate from, LocalDate to) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Producto no encontrado con id " + productId);
        }
        LocalDate start = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = to != null ? to : start.plusMonths(6);
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("El rango de fechas es invalido");
        }
        if (end.isAfter(start.plusMonths(MAX_MONTHS))) {
            end = start.plusMonths(MAX_MONTHS);
        }
        List<DateRange> ranges = reservationRepository.findOverlapping(productId, start, end).stream()
                .map(r -> new DateRange(r.getStartDate(), r.getEndDate()))
                .toList();
        return new AvailabilityResponse(productId, start, end, ranges);
    }
}
