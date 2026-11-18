package com.reservaya.dto;

import jakarta.validation.constraints.NotBlank;

public record EmailRequest(
        @NotBlank(message = "El correo electronico es obligatorio")
        String email
) {
}
