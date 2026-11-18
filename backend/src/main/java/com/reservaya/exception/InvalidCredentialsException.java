package com.reservaya.exception;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Correo electronico o contrasena incorrectos");
    }
}
