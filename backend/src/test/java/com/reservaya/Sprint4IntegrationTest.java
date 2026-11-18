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

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Integracion del Sprint 4: realizar reserva (#30-#32), historial (#33) y ubicacion del producto (#31). */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class Sprint4IntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private String body(org.springframework.test.web.servlet.ResultActions actions) throws Exception {
        return actions.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    private String login(String email, String password) throws Exception {
        String body = body(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")));
        return "Bearer " + mapper.readTree(body).get("token").asText();
    }

    private long productId(String name) throws Exception {
        for (JsonNode p : mapper.readTree(body(mvc.perform(get("/api/products"))))) {
            if (p.get("name").asText().equals(name)) return p.get("id").asLong();
        }
        throw new AssertionError("No existe " + name);
    }

    private String reservation(long productId, LocalDate start, LocalDate end, String extra) {
        return "{\"productId\":" + productId + ",\"startDate\":\"" + start + "\",\"endDate\":\"" + end + "\"" + extra + "}";
    }

    @Test
    void reservar_requiereSesion() throws Exception {
        long id = productId("Vestido de Gala Alquiler");
        LocalDate d = LocalDate.now().plusDays(60);
        mvc.perform(post("/api/reservations").contentType(MediaType.APPLICATION_JSON).content(reservation(id, d, d.plusDays(2), "")))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/reservations/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void reservar_confirmarVerDetalleEHistorial() throws Exception {
        String auth = login("usuario@reservaya.com", "Usuario1234");
        long id = productId("Vestido de Gala Alquiler");
        LocalDate start = LocalDate.now().plusDays(60);

        String created = body(mvc.perform(post("/api/reservations").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservation(id, start, start.plusDays(3), ",\"guests\":2,\"phone\":\"+54 11 5555-5555\",\"comments\":\"Talle M\"")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", startsWith("RY-")))
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.guests").value(2))
                .andExpect(jsonPath("$.comments").value("Talle M"))
                .andExpect(jsonPath("$.status").value("UPCOMING"))
                .andExpect(jsonPath("$.product.name").value("Vestido de Gala Alquiler"))
                .andExpect(jsonPath("$.product.location").value("Palermo, Buenos Aires"))
                .andExpect(jsonPath("$.provider.email").exists()));
        long reservationId = mapper.readTree(created).get("id").asLong();

        mvc.perform(get("/api/reservations/" + reservationId).header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userEmail").value("usuario@reservaya.com"));
        // Otro usuario no puede ver la reserva
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Otro\",\"lastName\":\"Usuario\",\"email\":\"otro4@mail.com\",\"password\":\"Clave1234\"}"));
        String other = login("otro4@mail.com", "Clave1234");
        mvc.perform(get("/api/reservations/" + reservationId).header("Authorization", other)).andExpect(status().isNotFound());

        // Historial ordenado por fecha de uso (la mas reciente primero), incluye las finalizadas
        String history = body(mvc.perform(get("/api/reservations/me").header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].product.name", hasItem("Vestido de Gala Alquiler")))
                .andExpect(jsonPath("$[*].status", hasItem("COMPLETED"))));
        List<LocalDate> starts = new ArrayList<>();
        mapper.readTree(history).forEach(r -> starts.add(LocalDate.parse(r.get("startDate").asText())));
        assertThat(starts).isSortedAccordingTo((a, b) -> b.compareTo(a));

        // Las fechas reservadas aparecen como ocupadas
        mvc.perform(get("/api/products/" + id + "/availability"))
                .andExpect(jsonPath("$.bookedRanges[*].start", hasItem(start.toString())));
    }

    @Test
    void reservar_fechasOcupadasOInvalidas_devuelveMensajeEspecifico() throws Exception {
        String auth = login("usuario@reservaya.com", "Usuario1234");
        long hotel = productId("Hotel Mirador del Lago");
        LocalDate today = LocalDate.now();

        // hoy+3..+7 esta reservado en los datos iniciales
        mvc.perform(post("/api/reservations").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(reservation(hotel, today.plusDays(2), today.plusDays(5), "")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("ya no están disponibles")));
        mvc.perform(post("/api/reservations").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(reservation(hotel, today.minusDays(2), today.plusDays(1), "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha de entrada no puede ser anterior a hoy"));
        mvc.perform(post("/api/reservations").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(reservation(hotel, today.plusDays(100), today.plusDays(101), ",\"guests\":0,\"phone\":\"abc\"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.guests").exists())
                .andExpect(jsonPath("$.errors.phone").value("El telefono no es valido"));
        mvc.perform(post("/api/reservations").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + hotel + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.startDate").value("La fecha de entrada es obligatoria"));
    }

    @Test
    void reservasSimultaneas_soloUnaSeConfirma() throws Exception {
        String auth = login("usuario@reservaya.com", "Usuario1234");
        long auto = productId("Auto Compacto Automatico");
        LocalDate start = LocalDate.now().plusDays(70);
        String payload = reservation(auto, start, start.plusDays(2), "");

        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            results.add(pool.submit(() -> mvc.perform(post("/api/reservations").header("Authorization", auth)
                    .contentType(MediaType.APPLICATION_JSON).content(payload)).andReturn().getResponse().getStatus()));
        }
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> f : results) statuses.add(f.get(20, TimeUnit.SECONDS));
        pool.shutdown();

        assertThat(statuses).containsOnly(201, 409);
        assertThat(statuses.stream().filter(s -> s == 201).count()).isEqualTo(1);
    }
}
