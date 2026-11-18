package com.reservaya.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;

/**
 * Datos para registrar o editar un producto. Categoria, caracteristicas y politicas son opcionales.
 */
public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String name,

        @NotBlank(message = "La descripcion es obligatoria")
        @Size(max = 2000, message = "La descripcion no puede superar los 2000 caracteres")
        String description,

        @NotEmpty(message = "Debes subir al menos una imagen")
        List<@NotBlank(message = "Imagen invalida") String> images,

        Long categoryId,

        Set<Long> featureIds,

        @Size(max = 12, message = "Se admiten hasta 12 politicas")
        List<@Valid PolicyRequest> policies,

        @Size(max = 120, message = "La ubicacion no puede superar los 120 caracteres")
        String location
) {
    public ProductRequest(String name, String description, List<String> images) {
        this(name, description, images, null, null, null, null);
    }

    public ProductRequest(String name, String description, List<String> images, Long categoryId, Set<Long> featureIds) {
        this(name, description, images, categoryId, featureIds, null, null);
    }
}
