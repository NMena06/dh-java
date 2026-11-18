package com.reservaya.controller;

import com.reservaya.dto.RoleRequest;
import com.reservaya.dto.UserResponse;
import com.reservaya.model.User;
import com.reservaya.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @PatchMapping("/{id}/role")
    public UserResponse changeRole(@PathVariable Long id,
                                   @Valid @RequestBody RoleRequest request,
                                   @AuthenticationPrincipal User currentUser) {
        return userService.changeRole(id, request.role(), currentUser);
    }
}
