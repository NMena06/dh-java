package com.reservaya.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "El titulo es obligatorio")
        @Size(max = 60, message = "El titulo no puede superar los 60 caracteres")
        String title,

        @NotBlank(message = "La descripcion es obligatoria")
        @Size(max = 500, message = "La descripcion no puede superar los 500 caracteres")
        String description,

        @NotBlank(message = "La imagen es obligatoria")
        String image
) {
}
