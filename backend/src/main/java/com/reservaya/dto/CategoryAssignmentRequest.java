package com.reservaya.dto;

/** Asigna (o quita, si es null) la categoria de un producto existente. */
public record CategoryAssignmentRequest(Long categoryId) {
}
