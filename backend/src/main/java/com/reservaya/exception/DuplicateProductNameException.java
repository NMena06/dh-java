package com.reservaya.exception;

public class DuplicateProductNameException extends RuntimeException {

    public DuplicateProductNameException(String name) {
        super("El nombre \"" + name + "\" ya esta en uso");
    }
}
