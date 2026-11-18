package com.reservaya.dto;

import com.reservaya.model.Review;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** DTOs de valoraciones (historia #28). */
public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record ReviewRequest(
            @NotNull(message = "La puntuacion es obligatoria")
            @Min(value = 1, message = "La puntuacion minima es 1 estrella")
            @Max(value = 5, message = "La puntuacion maxima es 5 estrellas")
            Integer rating,

            @Size(max = 1000, message = "El comentario no puede superar los 1000 caracteres")
            String comment
    ) {
    }

    public record ReviewResponse(Long id, int rating, String comment, String userName, LocalDateTime createdAt) {

        public static ReviewResponse from(Review review) {
            String name = review.getUser().getFirstName() + " " + review.getUser().getLastName();
            return new ReviewResponse(review.getId(), review.getRating(), review.getComment(), name, review.getCreatedAt());
        }
    }

    public record ReviewSummary(Long productId, double average, int count, List<ReviewResponse> reviews) {
    }

    /** Si el usuario actual puede valorar el producto y, si ya lo hizo, su valoracion. */
    public record ReviewEligibility(boolean authenticated, boolean canReview, String reason, ReviewResponse myReview) {
    }
}
