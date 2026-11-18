package com.reservaya.controller;

import com.reservaya.dto.ReservationDtos.ReservationRequest;
import com.reservaya.dto.ReservationDtos.ReservationResponse;
import com.reservaya.model.User;
import com.reservaya.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Reservas del usuario autenticado (historias #30 a #33). */
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody ReservationRequest request) {
        return reservationService.create(user, request);
    }

    @GetMapping("/me")
    public List<ReservationResponse> mine(@AuthenticationPrincipal User user) {
        return reservationService.listForUser(user);
    }

    @GetMapping("/{id}")
    public ReservationResponse findById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return reservationService.findForUser(id, user);
    }
}
