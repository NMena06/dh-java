package com.reservaya.service;

import com.reservaya.dto.UserResponse;
import com.reservaya.exception.ConflictException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import com.reservaya.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Historia #16: listado de usuarios y asignacion/quita del permiso de administrador.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll(Sort.by("id")).stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse changeRole(Long userId, Role role, User currentUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id " + userId));

        if (user.getRole() == role) {
            return UserResponse.from(user);
        }
        if (currentUser != null && user.getId().equals(currentUser.getId())) {
            throw new ConflictException("No puedes modificar tus propios permisos");
        }
        if (user.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ConflictException("Debe existir al menos un administrador");
        }
        user.setRole(role);
        return UserResponse.from(userRepository.save(user));
    }
}
