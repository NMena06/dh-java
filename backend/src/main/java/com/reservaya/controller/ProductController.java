package com.reservaya.controller;

import com.reservaya.dto.CategoryAssignmentRequest;
import com.reservaya.dto.ProductPageResponse;
import com.reservaya.dto.ProductRequest;
import com.reservaya.model.Product;
import com.reservaya.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final int HOME_LIMIT = 10;

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> findAll() {
        return productService.findAll();
    }

    @GetMapping("/random")
    public List<Product> findRandom(@RequestParam(defaultValue = "10") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, HOME_LIMIT));
        return productService.findRandom(safeLimit);
    }

    /** Paginado; con {@code categoryIds=1,2} filtra por una o varias categorias (historia #20). */
    @GetMapping("/page")
    public ProductPageResponse findPage(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(required = false) List<Long> categoryIds) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, HOME_LIMIT));
        return productService.findPage(safePage, safeSize, categoryIds);
    }

    @GetMapping("/{id}")
    public Product findById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PatchMapping("/{id}/category")
    public Product assignCategory(@PathVariable Long id, @RequestBody CategoryAssignmentRequest request) {
        return productService.assignCategory(id, request.categoryId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }
}
