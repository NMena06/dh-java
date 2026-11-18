package com.reservaya.repository;

import com.reservaya.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    /** Filtro por una o varias categorias (historia #20). */
    Page<Product> findByCategoryIdIn(Collection<Long> categoryIds, Pageable pageable);

    List<Product> findByFeaturesId(Long featureId);

    /** Al borrar una categoria, los productos quedan sin categoria en lugar de fallar por la clave foranea. */
    @Modifying
    @Query("update Product p set p.category = null where p.category.id = :categoryId")
    int clearCategory(@Param("categoryId") Long categoryId);
}
