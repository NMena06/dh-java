package com.reservaya.repository;

import com.reservaya.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** Reservas de un producto que se superponen con [from, to). */
    @Query("select r from Reservation r where r.product.id = :productId and r.startDate < :to and r.endDate > :from "
            + "order by r.startDate")
    List<Reservation> findOverlapping(@Param("productId") Long productId,
                                      @Param("from") LocalDate from,
                                      @Param("to") LocalDate to);

    /** Ids de productos con alguna reserva que se superpone con [from, to): no estan disponibles. */
    @Query("select distinct r.product.id from Reservation r where r.startDate < :to and r.endDate > :from")
    Set<Long> findBookedProductIds(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** Una reserva finalizada (dia de salida hoy o antes) habilita a valorar el producto. */
    boolean existsByUserIdAndProductIdAndEndDateLessThanEqual(Long userId, Long productId, LocalDate date);
}
