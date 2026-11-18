package com.reservaya.service;

import com.reservaya.dto.AuthResponse;
import com.reservaya.dto.LoginRequest;
import com.reservaya.dto.RegisterRequest;
import com.reservaya.dto.UserResponse;
import com.reservaya.exception.ConflictException;
import com.reservaya.exception.InvalidCredentialsException;
import com.reservaya.model.AuthToken;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import com.reservaya.repository.AuthTokenRepository;
import com.reservaya.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

/**
 * Registro (#13), inicio de sesion (#14) y cierre de sesion (#15).
 * Las sesiones son tokens opacos guardados en la base: cerrar sesion borra el token y lo invalida al instante.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final long sessionHours;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       AuthTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       @Value("${app.session-hours:8}") long sessionHours) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.sessionHours = sessionHours;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Ya existe una cuenta registrada con ese correo electronico");
        }
        User user = new User(
                capitalize(request.firstName()),
                capitalize(request.lastName()),
                email,
                passwordEncoder.encode(request.password()),
                Role.USER);
        User saved = userRepository.save(user);
        emailService.sendRegistrationConfirmation(saved);
        return UserResponse.from(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(InvalidCredentialsException::new);

        tokenRepository.deleteExpired(LocalDateTime.now());
        String token = newToken();
        tokenRepository.save(new AuthToken(token, user, LocalDateTime.now().plusHours(sessionHours)));
        return new AuthResponse(token, UserResponse.from(user));
    }

    @Transactional
    public void logout(String token) {
        if (token != null) {
            tokenRepository.deleteById(token);
        }
    }

    /** Usado por el filtro de seguridad en cada peticion: el rol se lee siempre actualizado de la base. */
    @Transactional(readOnly = true)
    public Optional<User> findUserByToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return tokenRepository.findById(token)
                .filter(t -> !t.isExpired())
                .map(AuthToken::getUser);
    }

    /**
     * Reenvio del correo de confirmacion (#19). Responde igual exista o no la cuenta,
     * para no revelar que correos estan registrados.
     */
    @Transactional(readOnly = true)
    public void resendConfirmation(String email) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .ifPresent(emailService::sendRegistrationConfirmation);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    /** "  maría   josé " -> "María José" */
    static String capitalize(String value) {
        String[] words = value.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!sb.isEmpty()) {
                sb.append(' ');
            }
            sb.append(word.substring(0, 1).toUpperCase(Locale.ROOT)).append(word.substring(1).toLowerCase(Locale.ROOT));
        }
        return sb.toString();
    }
}
