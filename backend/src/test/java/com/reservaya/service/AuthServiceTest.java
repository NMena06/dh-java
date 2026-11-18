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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Historias #13 (registro), #14 (login), #15 (logout) y #19 (correo de confirmacion). */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthTokenRepository tokenRepository;
    @Mock
    private EmailService emailService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(userRepository, tokenRepository, encoder, emailService, 8);
    }

    @Test
    void register_guardaHashNormalizaDatosYEnviaCorreo() {
        when(userRepository.existsByEmailIgnoreCase("ana@mail.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = service.register(new RegisterRequest("  ana  maría ", "pérez", " Ana@Mail.com ", "Clave1234"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getFirstName()).isEqualTo("Ana María");
        assertThat(saved.getLastName()).isEqualTo("Pérez");
        assertThat(saved.getEmail()).isEqualTo("ana@mail.com");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getPassword()).isNotEqualTo("Clave1234");
        assertThat(encoder.matches("Clave1234", saved.getPassword())).isTrue();
        assertThat(response.email()).isEqualTo("ana@mail.com");
        verify(emailService).sendRegistrationConfirmation(saved);
    }

    @Test
    void register_correoDuplicado_lanzaConflicto() {
        when(userRepository.existsByEmailIgnoreCase("ana@mail.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(new RegisterRequest("Ana", "Perez", "ANA@mail.com", "Clave1234")))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void login_credencialesValidas_creaToken() {
        User user = new User("Ana", "Perez", "ana@mail.com", encoder.encode("Clave1234"), Role.USER);
        when(userRepository.findByEmailIgnoreCase("ana@mail.com")).thenReturn(Optional.of(user));

        AuthResponse response = service.login(new LoginRequest("Ana@mail.com", "Clave1234"));

        assertThat(response.token()).hasSize(64);
        assertThat(response.user().firstName()).isEqualTo("Ana");
        verify(tokenRepository).save(any(AuthToken.class));
    }

    @Test
    void login_contrasenaIncorrecta_lanzaCredencialesInvalidas() {
        User user = new User("Ana", "Perez", "ana@mail.com", encoder.encode("Clave1234"), Role.USER);
        when(userRepository.findByEmailIgnoreCase("ana@mail.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@mail.com", "otra")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Correo electronico o contrasena incorrectos");
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void login_usuarioInexistente_mismoMensaje() {
        when(userRepository.findByEmailIgnoreCase("x@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("x@mail.com", "Clave1234")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void logout_borraElToken() {
        service.logout("abc");
        verify(tokenRepository).deleteById("abc");
    }

    @Test
    void findUserByToken_expirado_noAutentica() {
        User user = new User("Ana", "Perez", "ana@mail.com", "x", Role.USER);
        when(tokenRepository.findById("t")).thenReturn(Optional.of(new AuthToken("t", user, LocalDateTime.now().minusMinutes(1))));

        assertThat(service.findUserByToken("t")).isEmpty();
    }

    @Test
    void findUserByToken_vigente_devuelveUsuario() {
        User user = new User("Ana", "Perez", "ana@mail.com", "x", Role.USER);
        when(tokenRepository.findById("t")).thenReturn(Optional.of(new AuthToken("t", user, LocalDateTime.now().plusHours(1))));

        assertThat(service.findUserByToken("t")).contains(user);
    }

    @Test
    void resendConfirmation_soloSiExisteLaCuenta() {
        User user = new User("Ana", "Perez", "ana@mail.com", "x", Role.USER);
        when(userRepository.findByEmailIgnoreCase("ana@mail.com")).thenReturn(Optional.of(user));
        when(userRepository.findByEmailIgnoreCase("nadie@mail.com")).thenReturn(Optional.empty());

        service.resendConfirmation("ana@mail.com");
        service.resendConfirmation("nadie@mail.com");

        verify(emailService, times(1)).sendRegistrationConfirmation(user);
    }
}
