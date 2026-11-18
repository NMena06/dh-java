package com.reservaya.dto;

import com.reservaya.model.Role;
import jakarta.validation.constraints.NotNull;

public record RoleRequest(@NotNull(message = "El rol es obligatorio") Role role) {
}
