package com.reservaya.dto;

import com.reservaya.model.Product;

import java.util.List;

/**
 * Pagina de productos con filtro por categorias (historia #20).
 * totalElements es la cantidad que cumple el filtro y totalProducts el total sin filtrar.
 */
public record ProductPageResponse(
        List<Product> content,
        int page,
        int size,
        int totalPages,
        long totalElements,
        long totalProducts
) {
}
