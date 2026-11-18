package com.reservaya.dto;

import com.reservaya.model.Role;
import com.reservaya.model.User;

import java.time.LocalDateTime;

public record UserResponse(Long id, String firstName, String lastName, String email, Role role, LocalDateTime createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getRole(), user.getCreatedAt());
    }
}
