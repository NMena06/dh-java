package com.reservaya.model;

import jakarta.persistence.*;

import java.time.LocalDate;

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

    public Reservation() {
    }

    public Reservation(Product product, User user, LocalDate startDate, LocalDate endDate) {
        this.product = product;
        this.user = user;
        this.startDate = startDate;
        this.endDate = endDate;
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
}
