package com.reservaya.service;

import com.reservaya.exception.ConflictException;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import com.reservaya.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Historia #16: otorgar y quitar el permiso de administrador. */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService service;

    private static User user(long id, Role role) {
        User u = new User("U" + id, "Test", "u" + id + "@mail.com", "x", role);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    void otorgarAdmin() {
        User admin = user(1, Role.ADMIN);
        User target = user(2, Role.USER);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(target)).thenReturn(target);

        assertThat(service.changeRole(2L, Role.ADMIN, admin).role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void quitarAdmin_conOtrosAdmins() {
        User admin = user(1, Role.ADMIN);
        User target = user(2, Role.ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
        when(userRepository.save(target)).thenReturn(target);

        assertThat(service.changeRole(2L, Role.USER, admin).role()).isEqualTo(Role.USER);
    }

    @Test
    void noPuedeQuitarseSusPropiosPermisos() {
        User admin = user(1, Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.changeRole(1L, Role.USER, admin))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("propios permisos");
        verify(userRepository, never()).save(any());
    }

    @Test
    void noSePuedeQuitarElUltimoAdmin() {
        User target = user(2, Role.ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> service.changeRole(2L, Role.USER, user(3, Role.ADMIN)))
                .isInstanceOf(ConflictException.class);
    }
}
