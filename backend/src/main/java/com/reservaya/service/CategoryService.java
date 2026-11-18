package com.reservaya.service;

import com.reservaya.dto.CategoryRequest;
import com.reservaya.exception.ConflictException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Category;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return categoryRepository.findAll(Sort.by("title"));
    }

    @Transactional(readOnly = true)
    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria no encontrada con id " + id));
    }

    /** Historia #21: agregar categoria con titulo, descripcion e imagen. */
    @Transactional
    public Category create(CategoryRequest request) {
        String title = request.title().trim();
        if (categoryRepository.existsByTitleIgnoreCase(title)) {
            throw new ConflictException("La categoria \"" + title + "\" ya existe");
        }
        return categoryRepository.save(new Category(title, request.description().trim(), request.image()));
    }

    /** Al eliminar una categoria, sus productos quedan sin categoria (no se borran). */
    @Transactional
    public void delete(Long id) {
        Category category = findById(id);
        productRepository.clearCategory(category.getId());
        categoryRepository.delete(category);
    }
}
