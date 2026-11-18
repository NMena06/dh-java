package com.reservaya.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reservaya.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Reglas de acceso (historias #14, #15 y #16):
 * - Lectura de productos, categorias y caracteristicas: publica.
 * - Registro, login y reenvio de correo: publicos.
 * - /api/auth/me, /api/auth/logout, favoritos y valorar productos: requieren sesion.
 * - Altas, ediciones y bajas, y gestion de usuarios: solo ROLE_ADMIN.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthService authService, ObjectMapper mapper)
            throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(ant(null, "/h2-console/**"), ant(null, "/error")).permitAll()
                        .requestMatchers(ant(HttpMethod.OPTIONS, "/**")).permitAll()
                        .requestMatchers(
                                ant(HttpMethod.POST, "/api/auth/register"),
                                ant(HttpMethod.POST, "/api/auth/login"),
                                ant(HttpMethod.POST, "/api/auth/resend-confirmation")).permitAll()
                        .requestMatchers(
                                ant(HttpMethod.GET, "/api/products/**"),
                                ant(HttpMethod.GET, "/api/categories/**"),
                                ant(HttpMethod.GET, "/api/features/**")).permitAll()
                        .requestMatchers(ant(null, "/api/auth/**")).authenticated()
                        // Sprint 3: valorar (#28) y favoritos (#24, #25) requieren sesion, no rol admin
                        .requestMatchers(ant(HttpMethod.POST, "/api/products/*/reviews")).authenticated()
                        .requestMatchers(ant(null, "/api/favorites/**")).authenticated()
                        .requestMatchers(
                                ant(null, "/api/products/**"),
                                ant(null, "/api/categories/**"),
                                ant(null, "/api/features/**"),
                                ant(null, "/api/users/**")).hasRole("ADMIN")
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                writeError(res, mapper, HttpServletResponse.SC_UNAUTHORIZED, "Debes iniciar sesion"))
                        .accessDeniedHandler((req, res, e) ->
                                writeError(res, mapper, HttpServletResponse.SC_FORBIDDEN, "No tienes permisos para realizar esta accion")))
                .addFilterBefore(new TokenAuthenticationFilter(authService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static AntPathRequestMatcher ant(HttpMethod method, String pattern) {
        return method == null
                ? AntPathRequestMatcher.antMatcher(pattern)
                : AntPathRequestMatcher.antMatcher(method, pattern);
    }

    private static void writeError(HttpServletResponse response, ObjectMapper mapper, int status, String message)
            throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("message", message);
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), body);
    }
}
