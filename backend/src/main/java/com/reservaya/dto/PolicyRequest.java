package com.reservaya.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PolicyRequest(
        @NotBlank(message = "El titulo de la politica es obligatorio")
        @Size(max = 80, message = "El titulo de la politica no puede superar los 80 caracteres")
        String title,

        @NotBlank(message = "La descripcion de la politica es obligatoria")
        @Size(max = 1000, message = "La descripcion de la politica no puede superar los 1000 caracteres")
        String description
) {
}
