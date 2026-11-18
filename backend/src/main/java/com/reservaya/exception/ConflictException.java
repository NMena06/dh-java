package com.reservaya.exception;

/** Conflicto con el estado actual (nombre o correo ya en uso, quitar el ultimo administrador, etc.). Responde 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
