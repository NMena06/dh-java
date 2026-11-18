package com.reservaya.service;

import com.reservaya.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Historia #19 (opcional): correo de confirmacion de registro.
 *
 * Si hay un servidor SMTP configurado (propiedades spring.mail.*), el correo se envia de verdad.
 * Si no, el contenido se escribe en el log del backend para poder verificarlo en desarrollo.
 * Un fallo de envio nunca interrumpe el registro.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.mail.from:no-reply@reservaya.com}") String from,
                        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    /** @return true si el correo se envio por SMTP; false si solo se registro en el log o fallo. */
    public boolean sendRegistrationConfirmation(User user) {
        String subject = "ReservaYa - Confirmacion de registro";
        String body = buildRegistrationBody(user);

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("SMTP no configurado. Correo de confirmacion para {}:\nAsunto: {}\n{}", user.getEmail(), subject, body);
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(user.getEmail());
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
            log.info("Correo de confirmacion enviado a {}", user.getEmail());
            return true;
        } catch (Exception ex) {
            log.warn("No se pudo enviar el correo de confirmacion a {}: {}", user.getEmail(), ex.getMessage());
            return false;
        }
    }

    String buildRegistrationBody(User user) {
        return """
                Hola %s,

                Tu registro en ReservaYa fue exitoso. Estos son los datos de tu cuenta:

                  Nombre: %s %s
                  Correo electronico: %s

                Ya puedes iniciar sesion desde este enlace:
                %s/login

                Si no fuiste tu quien creo esta cuenta, ignora este mensaje.

                El equipo de ReservaYa
                """.formatted(user.getFirstName(), user.getFirstName(), user.getLastName(), user.getEmail(), frontendUrl);
    }
}
