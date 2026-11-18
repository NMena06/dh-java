package com.reservaya.service;

import com.reservaya.dto.FeatureRequest;
import com.reservaya.exception.ConflictException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Feature;
import com.reservaya.model.Product;
import com.reservaya.repository.FeatureRepository;
import com.reservaya.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Historia #17: administrar (alta, edicion y baja) las caracteristicas de producto.
 */
@Service
public class FeatureService {

    private final FeatureRepository featureRepository;
    private final ProductRepository productRepository;

    public FeatureService(FeatureRepository featureRepository, ProductRepository productRepository) {
        this.featureRepository = featureRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Feature> findAll() {
        return featureRepository.findAll(Sort.by("name"));
    }

    @Transactional(readOnly = true)
    public Feature findById(Long id) {
        return featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caracteristica no encontrada con id " + id));
    }

    @Transactional
    public Feature create(FeatureRequest request) {
        String name = request.name().trim();
        if (featureRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("La caracteristica \"" + name + "\" ya existe");
        }
        return featureRepository.save(new Feature(name, request.icon()));
    }

    @Transactional
    public Feature update(Long id, FeatureRequest request) {
        Feature feature = findById(id);
        String name = request.name().trim();
        if (featureRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("La caracteristica \"" + name + "\" ya existe");
        }
        feature.setName(name);
        feature.setIcon(request.icon());
        return featureRepository.save(feature);
    }

    /** Antes de borrar la caracteristica se la quita de los productos que la usan. */
    @Transactional
    public void delete(Long id) {
        Feature feature = findById(id);
        for (Product product : productRepository.findByFeaturesId(id)) {
            product.getFeatures().removeIf(f -> f.getId().equals(id));
        }
        featureRepository.delete(feature);
    }
}
