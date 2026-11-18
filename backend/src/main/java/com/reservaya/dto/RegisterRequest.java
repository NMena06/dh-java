package com.reservaya.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registro de usuario (historia #13). Reglas:
 * nombre y apellido de 2 a 50 letras (se admiten tildes, espacios, apostrofo y guion),
 * correo con formato valido y contrasena de 8 a 64 caracteres con al menos una letra y un numero.
 */
public record RegisterRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        @Pattern(regexp = NAME_REGEX, message = "El nombre solo puede contener letras")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
        @Pattern(regexp = NAME_REGEX, message = "El apellido solo puede contener letras")
        String lastName,

        @NotBlank(message = "El correo electronico es obligatorio")
        @Size(max = 120, message = "El correo electronico es demasiado largo")
        @Email(regexp = EMAIL_REGEX, message = "El correo electronico no es valido")
        String email,

        @NotBlank(message = "La contrasena es obligatoria")
        @Size(min = 8, max = 64, message = "La contrasena debe tener entre 8 y 64 caracteres")
        @Pattern(regexp = PASSWORD_REGEX, message = "La contrasena debe incluir al menos una letra y un numero")
        String password
) {
    public static final String NAME_REGEX = "^\\s*\\p{L}+(?:[ '\\-]\\p{L}+)*\\s*$";
    public static final String EMAIL_REGEX = "^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$";
    public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).+$";
}
