package com.reservaya.service;

import com.reservaya.dto.ReviewDtos.ReviewEligibility;
import com.reservaya.dto.ReviewDtos.ReviewRequest;
import com.reservaya.dto.ReviewDtos.ReviewResponse;
import com.reservaya.dto.ReviewDtos.ReviewSummary;
import com.reservaya.exception.ForbiddenOperationException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Product;
import com.reservaya.model.Review;
import com.reservaya.model.User;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import com.reservaya.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Historia #28: valoraciones con estrellas. Solo puede valorar quien tiene una reserva finalizada del producto.
 * Cada usuario tiene una valoracion por producto (si vuelve a enviar, se actualiza).
 * La media y la cantidad se recalculan y se guardan en el producto en cada valoracion.
 */
@Service
public class ReviewService {

    static final String NEEDS_RESERVATION = "Solo pueden valorar los usuarios con una reserva finalizada de este producto";

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final ReservationRepository reservationRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         ReservationRepository reservationRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public ReviewSummary summary(Long productId) {
        Product product = findProduct(productId);
        List<ReviewResponse> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(ReviewResponse::from)
                .toList();
        return new ReviewSummary(productId, product.getRatingAverage(), product.getRatingCount(), reviews);
    }

    @Transactional(readOnly = true)
    public ReviewEligibility eligibility(Long productId, User user) {
        findProduct(productId);
        if (user == null) {
            return new ReviewEligibility(false, false, "Inicia sesion para valorar este producto", null);
        }
        ReviewResponse mine = reviewRepository.findByProductIdAndUserId(productId, user.getId())
                .map(ReviewResponse::from).orElse(null);
        boolean completed = hasCompletedReservation(user, productId);
        return new ReviewEligibility(true, completed, completed ? null : NEEDS_RESERVATION, mine);
    }

    @Transactional
    public ReviewSummary rate(Long productId, User user, ReviewRequest request) {
        Product product = findProduct(productId);
        if (!hasCompletedReservation(user, productId)) {
            throw new ForbiddenOperationException(NEEDS_RESERVATION);
        }
        String comment = request.comment() == null || request.comment().isBlank() ? null : request.comment().trim();
        Review review = reviewRepository.findByProductIdAndUserId(productId, user.getId())
                .orElseGet(() -> new Review(product, user, request.rating(), comment));
        review.setRating(request.rating());
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now());
        reviewRepository.save(review);
        recalculate(product);
        return summary(productId);
    }

    /** Recalcula y guarda la media del producto a partir de todas sus valoraciones. */
    void recalculate(Product product) {
        List<Review> all = reviewRepository.findByProductIdOrderByCreatedAtDesc(product.getId());
        double average = all.stream().mapToInt(Review::getRating).average().orElse(0);
        product.updateRating(average, all.size());
        productRepository.save(product);
    }

    private boolean hasCompletedReservation(User user, Long productId) {
        return reservationRepository.existsByUserIdAndProductIdAndEndDateLessThanEqual(user.getId(), productId, LocalDate.now());
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id " + productId));
    }
}
