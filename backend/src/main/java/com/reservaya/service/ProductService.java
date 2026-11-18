package com.reservaya.service;

import com.reservaya.dto.ProductPageResponse;
import com.reservaya.dto.ProductRequest;
import com.reservaya.exception.DuplicateProductNameException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Category;
import com.reservaya.model.Feature;
import com.reservaya.model.Product;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.FeatureRepository;
import com.reservaya.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FeatureRepository featureRepository;
    private final SecureRandom random = new SecureRandom();

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          FeatureRepository featureRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.featureRepository = featureRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return productRepository.findAll(Sort.by("id"));
    }

    /**
     * Listado paginado (historia #8) con filtro opcional por una o varias categorias (historia #20).
     * Ordenado por id para que los cambios de pagina sean estables.
     */
    @Transactional(readOnly = true)
    public ProductPageResponse findPage(int page, int size, Collection<Long> categoryIds) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id"));
        boolean filtered = categoryIds != null && !categoryIds.isEmpty();
        Page<Product> result = filtered
                ? productRepository.findByCategoryIdIn(categoryIds, pageable)
                : productRepository.findAll(pageable);
        long totalProducts = filtered ? productRepository.count() : result.getTotalElements();
        return new ProductPageResponse(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalPages(),
                result.getTotalElements(),
                totalProducts);
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

    /** Registrar producto, con categoria (historia #12) y caracteristicas (historia #17) opcionales. */
    @Transactional
    public Product create(ProductRequest request) {
        String name = request.name().trim();
        if (productRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateProductNameException(name);
        }
        Product product = new Product(name, request.description().trim(), new ArrayList<>(request.images()));
        product.setCategory(resolveCategory(request.categoryId()));
        product.setFeatures(resolveFeatures(request.featureIds()));
        return productRepository.save(product);
    }

    /** Editar producto: reemplaza nombre, descripcion, imagenes, categoria y caracteristicas. */
    @Transactional
    public Product update(Long id, ProductRequest request) {
        Product product = findById(id);
        String name = request.name().trim();
        if (productRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateProductNameException(name);
        }
        product.setName(name);
        product.setDescription(request.description().trim());
        product.getImages().clear();
        product.getImages().addAll(request.images());
        product.setCategory(resolveCategory(request.categoryId()));
        product.getFeatures().clear();
        product.getFeatures().addAll(resolveFeatures(request.featureIds()));
        return productRepository.save(product);
    }

    /** Historia #12: asignar (o quitar con null) la categoria de un producto ya creado. */
    @Transactional
    public Product assignCategory(Long id, Long categoryId) {
        Product product = findById(id);
        product.setCategory(resolveCategory(categoryId));
        return productRepository.save(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = findById(id);
        productRepository.delete(product);
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria no encontrada con id " + categoryId));
    }

    private Set<Feature> resolveFeatures(Set<Long> featureIds) {
        if (featureIds == null || featureIds.isEmpty()) {
            return new LinkedHashSet<>();
        }
        List<Feature> features = featureRepository.findAllById(featureIds);
        if (features.size() != featureIds.size()) {
            throw new ResourceNotFoundException("Una o mas caracteristicas no existen");
        }
        features.sort(Comparator.comparing(Feature::getName, String.CASE_INSENSITIVE_ORDER));
        return new LinkedHashSet<>(features);
    }
}
