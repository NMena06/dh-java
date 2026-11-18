package com.reservaya.service;

import com.reservaya.model.Role;
import com.reservaya.model.User;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/** Historia #19: contenido del correo de confirmacion. */
class EmailServiceTest {

    private final User user = new User("Ana", "Perez", "ana@mail.com", "x", Role.USER);

    @SuppressWarnings("unchecked")
    @Test
    void conSmtp_enviaCorreoConNombreCorreoYEnlaceDeLogin() {
        JavaMailSender sender = mock(JavaMailSender.class);
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        EmailService service = new EmailService(provider, "no-reply@reservaya.com", "http://localhost:5173");

        assertThat(service.sendRegistrationConfirmation(user)).isTrue();

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly("ana@mail.com");
        assertThat(message.getSubject()).contains("Confirmacion de registro");
        assertThat(message.getText())
                .contains("registro en ReservaYa fue exitoso")
                .contains("Ana Perez")
                .contains("ana@mail.com")
                .contains("http://localhost:5173/login");
    }

    @SuppressWarnings("unchecked")
    @Test
    void sinSmtp_noFallaYSoloRegistraEnLog() {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        EmailService service = new EmailService(provider, "no-reply@reservaya.com", "http://localhost:5173");

        assertThat(service.sendRegistrationConfirmation(user)).isFalse();
    }
}
