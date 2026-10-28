package com.reservaya.service;

import com.reservaya.dto.PageResponse;
import com.reservaya.dto.ProductRequest;
import com.reservaya.exception.DuplicateProductNameException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Product;
import com.reservaya.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final SecureRandom random = new SecureRandom();

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    /**
     * Listado paginado (historia #8). Ordenado por id para que los cambios de pagina sean estables.
     */
    @Transactional(readOnly = true)
    public PageResponse<Product> findPage(int page, int size) {
        Page<Product> result = productRepository.findAll(PageRequest.of(page, size, Sort.by("id")));
        return new PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalPages(),
                result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id " + id));
    }

    /**
     * Devuelve hasta {@code limit} productos distintos en orden aleatorio.
     * Se mezcla la lista completa con SecureRandom, por lo que no hay repeticiones ni patron previsible.
     */
    @Transactional(readOnly = true)
    public List<Product> findRandom(int limit) {
        List<Product> all = new ArrayList<>(productRepository.findAll());
        Collections.shuffle(all, random);
        return all.subList(0, Math.min(limit, all.size()));
    }

    @Transactional
    public Product create(ProductRequest request) {
        String name = request.name().trim();
        if (productRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateProductNameException(name);
        }
        Product product = new Product(name, request.description().trim(), new ArrayList<>(request.images()));
        return productRepository.save(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = findById(id);
        productRepository.delete(product);
    }
}
