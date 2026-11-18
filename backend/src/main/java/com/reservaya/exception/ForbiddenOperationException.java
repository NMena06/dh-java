package com.reservaya.exception;

/** El usuario esta autenticado pero no cumple la regla de negocio (por ejemplo, valorar sin reserva finalizada). 403. */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
