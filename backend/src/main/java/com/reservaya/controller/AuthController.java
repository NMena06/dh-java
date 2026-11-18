package com.reservaya.controller;

import com.reservaya.dto.*;
import com.reservaya.model.User;
import com.reservaya.security.TokenAuthenticationFilter;
import com.reservaya.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        authService.logout(TokenAuthenticationFilter.extractToken(request));
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User user) {
        return UserResponse.from(user);
    }

    @PostMapping("/resend-confirmation")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> resendConfirmation(@Valid @RequestBody EmailRequest request) {
        authService.resendConfirmation(request.email());
        return Map.of("message", "Si el correo esta registrado, te reenviamos la confirmacion");
    }
}
