package com.reservaya.repository;

import com.reservaya.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByTitleIgnoreCase(String title);

    Optional<Category> findByTitleIgnoreCase(String title);
}
