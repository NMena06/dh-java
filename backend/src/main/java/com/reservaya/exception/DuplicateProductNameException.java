package com.reservaya.exception;

public class DuplicateProductNameException extends ConflictException {

    public DuplicateProductNameException(String name) {
        super("El nombre \"" + name + "\" ya esta en uso");
    }
}
