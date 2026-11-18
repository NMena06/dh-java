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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba de integracion con la seguridad real, H2 en memoria y los datos iniciales.
 * Cubre registro (#13), login (#14), logout (#15), permisos de administrador (#16),
 * categorias (#12, #20, #21) y caracteristicas (#17, #18).
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private String login(String email, String password) throws Exception {
        String response = mvc.perform(json(post("/api/auth/login"),
                        "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).get("token").asText();
    }

    private long register(String email) throws Exception {
        String response = mvc.perform(json(post("/api/auth/register"),
                        "{\"firstName\":\"Juan\",\"lastName\":\"Gomez\",\"email\":\"" + email + "\",\"password\":\"Clave1234\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).get("id").asLong();
    }

    @Test
    void lecturaPublica_escrituraSoloAdmin() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isOk());
        mvc.perform(get("/api/categories")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(4)));
        mvc.perform(get("/api/features")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(greaterThan(5))));

        String product = "{\"name\":\"Producto Seguridad\",\"description\":\"d\",\"images\":[\"img\"]}";
        mvc.perform(json(post("/api/products"), product))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Debes iniciar sesion"));

        register("comun@mail.com");
        String userToken = login("comun@mail.com", "Clave1234");
        mvc.perform(json(post("/api/products"), product).header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        String adminToken = login("admin@reservaya.com", "Admin1234");
        mvc.perform(json(post("/api/products"), product).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated());
    }

    @Test
    void registro_validaCamposYCorreoUnico() throws Exception {
        mvc.perform(json(post("/api/auth/register"),
                        "{\"firstName\":\"J\",\"lastName\":\"Gomez2\",\"email\":\"no-es-correo\",\"password\":\"corta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists())
                .andExpect(jsonPath("$.errors.lastName").value("El apellido solo puede contener letras"))
                .andExpect(jsonPath("$.errors.email").value("El correo electronico no es valido"))
                .andExpect(jsonPath("$.errors.password").exists());

        mvc.perform(json(post("/api/auth/register"),
                        "{\"firstName\":\"Juan\",\"lastName\":\"Gomez\",\"email\":\"x@mail.com\",\"password\":\"solamenteletras\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").value("La contrasena debe incluir al menos una letra y un numero"));

        register("unico@mail.com");
        mvc.perform(json(post("/api/auth/register"),
                        "{\"firstName\":\"Otro\",\"lastName\":\"Usuario\",\"email\":\"UNICO@mail.com\",\"password\":\"Clave1234\"}"))
                .andExpect(status().isConflict());

        mvc.perform(json(post("/api/auth/resend-confirmation"), "{\"email\":\"unico@mail.com\"}"))
                .andExpect(status().isAccepted());
    }

    @Test
    void login_meYLogoutInvalidaElToken() throws Exception {
        mvc.perform(json(post("/api/auth/login"), "{\"email\":\"admin@reservaya.com\",\"password\":\"mala\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Correo electronico o contrasena incorrectos"));

        register("sesion@mail.com");
        String token = login("sesion@mail.com", "Clave1234");

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Juan"))
                .andExpect(jsonPath("$.email").value("sesion@mail.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());

        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        // Despues de cerrar sesion se puede seguir navegando como anonimo
        mvc.perform(get("/api/products/page").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void otorgarYQuitarAdmin_seAplicaDeInmediato() throws Exception {
        String admin = login("admin@reservaya.com", "Admin1234");
        long id = register("colaborador@mail.com");
        String collaborator = login("colaborador@mail.com", "Clave1234");

        mvc.perform(get("/api/users").header("Authorization", "Bearer " + collaborator)).andExpect(status().isForbidden());

        mvc.perform(json(patch("/api/users/" + id + "/role"), "{\"role\":\"ADMIN\"}").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        // Con el mismo token, ya tiene acceso de administrador
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + collaborator)).andExpect(status().isOk());

        mvc.perform(json(patch("/api/users/" + id + "/role"), "{\"role\":\"USER\"}").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + collaborator)).andExpect(status().isForbidden());
    }

    @Test
    void categoriasYCaracteristicas_flujoCompleto() throws Exception {
        String admin = login("admin@reservaya.com", "Admin1234");
        String auth = "Bearer " + admin;

        // #21 agregar categoria
        String catResponse = mvc.perform(json(post("/api/categories"),
                        "{\"title\":\"Cabañas\",\"description\":\"Escapadas a la montaña\",\"image\":\"data:image/png;base64,AA\"}")
                        .header("Authorization", auth))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long categoryId = mapper.readTree(catResponse).get("id").asLong();
        mvc.perform(json(post("/api/categories"), "{\"title\":\"cabañas\",\"description\":\"x\",\"image\":\"x\"}")
                        .header("Authorization", auth))
                .andExpect(status().isConflict());

        // #17 agregar caracteristica
        String featResponse = mvc.perform(json(post("/api/features"), "{\"name\":\"Chimenea\",\"icon\":\"aire\"}")
                        .header("Authorization", auth))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long featureId = mapper.readTree(featResponse).get("id").asLong();

        // Registrar producto con categoria y caracteristica (#12, #17)
        String prodResponse = mvc.perform(json(post("/api/products"),
                        "{\"name\":\"Cabaña del Bosque\",\"description\":\"d\",\"images\":[\"img\"],\"categoryId\":" + categoryId
                                + ",\"featureIds\":[" + featureId + "]}")
                        .header("Authorization", auth))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.title").value("Cabañas"))
                .andExpect(jsonPath("$.category.image").doesNotExist())
                .andExpect(jsonPath("$.features[0].name").value("Chimenea"))
                .andReturn().getResponse().getContentAsString();
        long productId = mapper.readTree(prodResponse).get("id").asLong();

        // #18 el detalle publico incluye las caracteristicas con su icono
        mvc.perform(get("/api/products/" + productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.features[0].icon").value("aire"));

        // #20 filtro por categoria con cantidad filtrada y total
        String page = mvc.perform(get("/api/products/page").param("categoryIds", String.valueOf(categoryId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Cabaña del Bosque"))
                .andReturn().getResponse().getContentAsString();
        JsonNode pageJson = mapper.readTree(page);
        org.assertj.core.api.Assertions.assertThat(pageJson.get("totalProducts").asLong()).isGreaterThan(1);

        // #12 asignar otra categoria a un producto existente
        long hotelesId = mapper.readTree(mvc.perform(get("/api/categories")).andReturn().getResponse().getContentAsString())
                .findParents("title").stream().filter(n -> n.get("title").asText().equals("Hoteles"))
                .findFirst().orElseThrow().get("id").asLong();
        mvc.perform(json(patch("/api/products/" + productId + "/category"), "{\"categoryId\":" + hotelesId + "}")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category.title").value("Hoteles"));

        // Editar caracteristica y eliminarla: desaparece del producto
        mvc.perform(json(put("/api/features/" + featureId), "{\"name\":\"Hogar a leña\",\"icon\":\"cocina\"}")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Hogar a leña"));
        mvc.perform(delete("/api/features/" + featureId).header("Authorization", auth))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/products/" + productId))
                .andExpect(jsonPath("$.features", hasSize(0)));

        // Eliminar categoria no borra sus productos
        mvc.perform(delete("/api/categories/" + categoryId).header("Authorization", auth))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/products/" + productId)).andExpect(status().isOk());
    }
}
