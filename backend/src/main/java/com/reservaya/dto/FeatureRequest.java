package com.reservaya.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FeatureRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 60, message = "El nombre no puede superar los 60 caracteres")
        String name,

        @NotBlank(message = "El icono es obligatorio")
        @Pattern(regexp = "[a-z0-9-]{1,40}", message = "Icono invalido")
        String icon
) {
}
