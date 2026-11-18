package com.reservaya;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Se excluye el usuario en memoria por defecto de Spring Security: la autenticacion es propia (tokens en BD).
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class ReservaYaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReservaYaApplication.class, args);
    }
}
