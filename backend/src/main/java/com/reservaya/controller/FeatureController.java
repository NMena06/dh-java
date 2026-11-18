package com.reservaya.controller;

import com.reservaya.dto.FeatureRequest;
import com.reservaya.model.Feature;
import com.reservaya.service.FeatureService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/features")
public class FeatureController {

    private final FeatureService featureService;

    public FeatureController(FeatureService featureService) {
        this.featureService = featureService;
    }

    @GetMapping
    public List<Feature> findAll() {
        return featureService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Feature create(@Valid @RequestBody FeatureRequest request) {
        return featureService.create(request);
    }

    @PutMapping("/{id}")
    public Feature update(@PathVariable Long id, @Valid @RequestBody FeatureRequest request) {
        return featureService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        featureService.delete(id);
    }
}
