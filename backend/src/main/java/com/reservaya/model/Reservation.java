package com.reservaya.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Reserva de un producto. Ocupa las noches desde {@code startDate} (inclusive) hasta {@code endDate} (exclusivo,
 * dia de salida). Se usa para la disponibilidad (historia #23), la busqueda por fechas (#22)
 * y para habilitar valoraciones (#28).
 */
@Entity
@Table(name = "reservations", indexes = @Index(name = "idx_reservation_product", columnList = "product_id"))
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // Datos opcionales del formulario de reserva (historia #32)
    private Integer guests;

    @Column(length = 30)
    private String phone;

    @Column(length = 500)
    private String comments;

    /** Momento en que se hizo la reserva. Puede ser null en reservas de ejemplo anteriores al Sprint 4. */
    private LocalDateTime createdAt;

    public Reservation() {
    }

    public Reservation(Product product, User user, LocalDate startDate, LocalDate endDate) {
        this.product = product;
        this.user = user;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public User getUser() {
        return user;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public Integer getGuests() {
        return guests;
    }

    public void setGuests(Integer guests) {
        this.guests = guests;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /** Codigo legible para el usuario, por ejemplo RY-000042. */
    public String getCode() {
        return id == null ? null : "RY-%06d".formatted(id);
    }
}
