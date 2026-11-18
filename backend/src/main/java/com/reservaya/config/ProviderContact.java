package com.reservaya.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Datos de contacto del proveedor que se muestran en la confirmacion de reserva y en el correo (#35).
 * Se configuran con app.provider.* (o las variables PROVIDER_NAME, PROVIDER_EMAIL, PROVIDER_PHONE).
 */
@Component
public class ProviderContact {

    private final String name;
    private final String email;
    private final String phone;

    public ProviderContact(@Value("${app.provider.name:ReservaYa Atencion al cliente}") String name,
                           @Value("${app.provider.email:contacto@reservaya.com}") String email,
                           @Value("${app.provider.phone:+54 9 11 0000-0000}") String phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    public String name() {
        return name;
    }

    public String email() {
        return email;
    }

    public String phone() {
        return phone;
    }
}
