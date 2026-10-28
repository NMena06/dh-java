package com.reservaya.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String name,

        @NotBlank(message = "La descripcion es obligatoria")
        @Size(max = 2000, message = "La descripcion no puede superar los 2000 caracteres")
        String description,

        @NotEmpty(message = "Debes subir al menos una imagen")
        List<@NotBlank(message = "Imagen invalida") String> images
) {
}
