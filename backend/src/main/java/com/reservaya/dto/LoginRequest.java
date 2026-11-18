package com.reservaya.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El correo electronico es obligatorio")
        String email,

        @NotBlank(message = "La contrasena es obligatoria")
        String password
) {
}
