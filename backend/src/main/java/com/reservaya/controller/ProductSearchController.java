package com.reservaya.controller;

import com.reservaya.dto.ProductPageResponse;
import com.reservaya.dto.ReviewDtos.ReviewEligibility;
import com.reservaya.dto.ReviewDtos.ReviewRequest;
import com.reservaya.dto.ReviewDtos.ReviewSummary;
import com.reservaya.dto.SearchDtos.AvailabilityResponse;
import com.reservaya.dto.SearchDtos.Suggestion;
import com.reservaya.model.User;
import com.reservaya.service.AvailabilityService;
import com.reservaya.service.ProductSearchService;
import com.reservaya.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Busqueda (#22), disponibilidad (#23) y valoraciones (#28) de productos. */
@RestController
@RequestMapping("/api/products")
public class ProductSearchController {

    private static final int MAX_PAGE_SIZE = 10;

    private final ProductSearchService searchService;
    private final AvailabilityService availabilityService;
    private final ReviewService reviewService;

    public ProductSearchController(ProductSearchService searchService,
                                   AvailabilityService availabilityService,
                                   ReviewService reviewService) {
        this.searchService = searchService;
        this.availabilityService = availabilityService;
        this.reviewService = reviewService;
    }

    @GetMapping("/search")
    public ProductPageResponse search(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
                                      @RequestParam(required = false) List<Long> categoryIds,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        return searchService.search(q, checkIn, checkOut, categoryIds, Math.max(0, page), safeSize);
    }

    @GetMapping("/suggestions")
    public List<Suggestion> suggestions(@RequestParam(defaultValue = "") String q) {
        return searchService.suggestions(q);
    }

    @GetMapping("/{id}/availability")
    public AvailabilityResponse availability(@PathVariable Long id,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return availabilityService.availability(id, from, to);
    }

    @GetMapping("/{id}/reviews")
    public ReviewSummary reviews(@PathVariable Long id) {
        return reviewService.summary(id);
    }

    /** Publico: sin sesion responde que hay que iniciar sesion. */
    @GetMapping("/{id}/reviews/eligibility")
    public ReviewEligibility eligibility(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return reviewService.eligibility(id, user);
    }

    @PostMapping("/{id}/reviews")
    public ReviewSummary rate(@PathVariable Long id,
                              @AuthenticationPrincipal User user,
                              @Valid @RequestBody ReviewRequest request) {
        return reviewService.rate(id, user, request);
    }
}
