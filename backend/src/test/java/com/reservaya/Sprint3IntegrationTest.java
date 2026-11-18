package com.reservaya;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integracion del Sprint 3 con los datos iniciales (productos, reservas, usuario demo y valoracion del admin):
 * busqueda (#22), disponibilidad (#23), favoritos (#24/#25), politicas (#26), valoraciones (#28).
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class Sprint3IntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        return "Bearer " + mapper.readTree(body).get("token").asText();
    }

    private long productId(String name) throws Exception {
        JsonNode all = mapper.readTree(mvc.perform(get("/api/products")).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        for (JsonNode p : all) {
            if (p.get("name").asText().equals(name)) return p.get("id").asLong();
        }
        throw new AssertionError("No existe " + name);
    }

    @Test
    void busquedaYSugerencias() throws Exception {
        mvc.perform(get("/api/products/search").param("q", "lago"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Hotel Mirador del Lago"))
                .andExpect(jsonPath("$.totalProducts").value(greaterThanOrEqualTo(4)));

        mvc.perform(get("/api/products/suggestions").param("q", "aut"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].label", hasItems("Autos", "Auto Compacto Automatico")));

        // Las fechas excluyen productos reservados: hoy+3..+7 esta ocupado para el primer producto
        LocalDate in = LocalDate.now().plusDays(4);
        String body = mvc.perform(get("/api/products/search")
                        .param("checkIn", in.toString()).param("checkOut", in.plusDays(1).toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        JsonNode dated = mapper.readTree(body);
        assertThat(dated.get("totalElements").asInt()).isLessThan(dated.get("totalProducts").asInt());

        mvc.perform(get("/api/products/search").param("checkIn", in.toString()).param("checkOut", in.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha de salida debe ser posterior a la de entrada"));
        mvc.perform(get("/api/products/search").param("checkIn", "no-es-fecha"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void disponibilidadYPoliticas() throws Exception {
        long id = productId("Hotel Mirador del Lago");
        mvc.perform(get("/api/products/" + id + "/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookedRanges", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.bookedRanges[0].start").exists());
        mvc.perform(get("/api/products/999999/availability")).andExpect(status().isNotFound());

        mvc.perform(get("/api/products/" + id))
                .andExpect(jsonPath("$.policies", hasSize(3)))
                .andExpect(jsonPath("$.policies[0].title").value("Normas de la casa"))
                .andExpect(jsonPath("$.ratingAverage").value(5.0))
                .andExpect(jsonPath("$.ratingCount").value(1));
    }

    @Test
    void favoritos_requierenSesion_marcarListarYQuitar() throws Exception {
        long id = productId("Auto Compacto Automatico");
        mvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/favorites/" + id)).andExpect(status().isUnauthorized());

        String auth = login("usuario@reservaya.com", "Usuario1234");
        mvc.perform(put("/api/favorites/" + id).header("Authorization", auth)).andExpect(status().isOk());
        mvc.perform(put("/api/favorites/" + id).header("Authorization", auth)).andExpect(status().isOk());
        mvc.perform(get("/api/favorites").header("Authorization", auth))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Auto Compacto Automatico"));

        mvc.perform(delete("/api/favorites/" + id).header("Authorization", auth)).andExpect(status().isNoContent());
        mvc.perform(get("/api/favorites").header("Authorization", auth)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void valoraciones_soloConReservaFinalizada() throws Exception {
        long hotel = productId("Hotel Mirador del Lago");
        long vestido = productId("Vestido de Gala Alquiler");

        mvc.perform(get("/api/products/" + hotel + "/reviews"))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.reviews[0].userName").value("Admin ReservaYa"))
                .andExpect(jsonPath("$.reviews[0].rating").value(5));
        mvc.perform(get("/api/products/" + hotel + "/reviews/eligibility"))
                .andExpect(jsonPath("$.authenticated").value(false));
        mvc.perform(post("/api/products/" + hotel + "/reviews").contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":4}")).andExpect(status().isUnauthorized());

        String auth = login("usuario@reservaya.com", "Usuario1234");
        // Sin reserva finalizada del vestido
        mvc.perform(get("/api/products/" + vestido + "/reviews/eligibility").header("Authorization", auth))
                .andExpect(jsonPath("$.canReview").value(false));
        mvc.perform(post("/api/products/" + vestido + "/reviews").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":4}"))
                .andExpect(status().isForbidden());

        // Con reserva finalizada del hotel: la media pasa de 5 a 4
        mvc.perform(get("/api/products/" + hotel + "/reviews/eligibility").header("Authorization", auth))
                .andExpect(jsonPath("$.canReview").value(true));
        mvc.perform(post("/api/products/" + hotel + "/reviews").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":6}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/products/" + hotel + "/reviews").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":3,\"comment\":\"Lindo pero ruidoso\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.average").value(4.0))
                .andExpect(jsonPath("$.reviews[0].userName").value("Lucia Fernandez"))
                .andExpect(jsonPath("$.reviews[0].comment").value("Lindo pero ruidoso"));
        mvc.perform(get("/api/products/search").param("q", "mirador"))
                .andExpect(jsonPath("$.content[0].ratingAverage").value(4.0))
                .andExpect(jsonPath("$.content[0].ratingCount").value(2));
    }

    @Test
    void eliminarProducto_conReservasFavoritosYValoraciones() throws Exception {
        String admin = login("admin@reservaya.com", "Admin1234");
        long id = productId("Departamento Centro Histórico");
        String user = login("usuario@reservaya.com", "Usuario1234");
        mvc.perform(put("/api/favorites/" + id).header("Authorization", user)).andExpect(status().isOk());
        mvc.perform(post("/api/products/" + id + "/reviews").header("Authorization", user)
                .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":4}")).andExpect(status().isOk());

        mvc.perform(delete("/api/products/" + id).header("Authorization", admin)).andExpect(status().isNoContent());
        mvc.perform(get("/api/products/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/favorites").header("Authorization", user))
                .andExpect(jsonPath("$[*].name", not(hasItem("Departamento Centro Histórico"))));
    }
}
