package com.reservaya.controller;

import com.reservaya.exception.DuplicateProductNameException;
import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Product;
import com.reservaya.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    private static final String VALID_BODY = """
            {"name":"Hotel Sol","description":"Vista al mar","images":["data:image/png;base64,AA"]}
            """;

    @Test
    void crear_conDatosValidos_responde201() throws Exception {
        when(productService.create(any())).thenReturn(new Product("Hotel Sol", "Vista al mar", List.of("img")));

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Hotel Sol"));
    }

    @Test
    void crear_sinNombre_responde400() throws Exception {
        String body = """
                {"name":"","description":"x","images":["img"]}
                """;

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El nombre es obligatorio"));
    }

    @Test
    void crear_sinImagenes_responde400() throws Exception {
        String body = """
                {"name":"Hotel","description":"x","images":[]}
                """;

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_nombreDuplicado_responde409() throws Exception {
        when(productService.create(any())).thenThrow(new DuplicateProductNameException("Hotel Sol"));

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El nombre \"Hotel Sol\" ya esta en uso"));
    }

    @Test
    void obtenerPorId_inexistente_responde404() throws Exception {
        when(productService.findById(99L)).thenThrow(new ResourceNotFoundException("Producto no encontrado con id 99"));

        mockMvc.perform(get("/api/products/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void random_limitaA10() throws Exception {
        when(productService.findRandom(10)).thenReturn(List.of());

        mockMvc.perform(get("/api/products/random").param("limit", "50"))
                .andExpect(status().isOk());
        verify(productService).findRandom(10);
    }

    @Test
    void eliminar_responde204() throws Exception {
        mockMvc.perform(delete("/api/products/1"))
                .andExpect(status().isNoContent());
        verify(productService).delete(1L);
    }
}
