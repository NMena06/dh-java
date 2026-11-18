package com.reservaya.service;

import com.reservaya.dto.ReservationDtos.ProductSummary;
import com.reservaya.dto.ReservationDtos.Provider;
import com.reservaya.dto.ReservationDtos.ReservationResponse;
import com.reservaya.dto.ReservationDtos.Status;
import com.reservaya.model.Role;
import com.reservaya.model.User;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Historias #19 (confirmacion de registro) y #35 (confirmacion de reserva). */
class EmailServiceTest {

    private final User user = new User("Ana", "Perez", "ana@mail.com", "x", Role.USER);

    @SuppressWarnings("unchecked")
    private EmailService service(JavaMailSender sender, String host) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        return new EmailService(provider, host, "no-reply@reservaya.com", "http://localhost:5173");
    }

    private ReservationResponse reservation() {
        return new ReservationResponse(42L, "RY-000042",
                new ProductSummary(1L, "Hotel Mirador del Lago", "img", "Bariloche", "Hoteles"),
                LocalDate.of(2030, 3, 10), LocalDate.of(2030, 3, 13), 3, 2, "+54 11 5555-5555", "Llegamos <tarde>",
                LocalDateTime.of(2030, 1, 5, 18, 30), Status.UPCOMING, "Ana Perez", "ana@mail.com",
                new Provider("ReservaYa Atencion", "contacto@reservaya.com", "+54 9 11 0000-0000"));
    }

    @Test
    void registro_conSmtp_enviaCorreoConNombreCorreoYEnlaceDeLogin() {
        JavaMailSender sender = mock(JavaMailSender.class);

        assertThat(service(sender, "smtp.test").sendRegistrationConfirmation(user)).isTrue();

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

    @Test
    void sinSmtp_noFallaYSoloRegistraEnLog() {
        JavaMailSender sender = mock(JavaMailSender.class);
        EmailService service = service(sender, "");

        assertThat(service.sendRegistrationConfirmation(user)).isFalse();
        assertThat(service.sendReservationConfirmation(reservation())).isFalse();
        verifyNoInteractions(sender);
    }

    @Test
    void reserva_conSmtp_enviaHtmlAlCorreoDelUsuario() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage((jakarta.mail.Session) null));

        assertThat(service(sender, "smtp.test").sendReservationConfirmation(reservation())).isTrue();

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(captor.capture());
        assertThat(captor.getValue().getAllRecipients()[0].toString()).isEqualTo("ana@mail.com");
        assertThat(captor.getValue().getSubject()).contains("RY-000042").contains("Hotel Mirador del Lago");
    }

    @Test
    void reserva_contenido_productoFechasHoraYContactoDelProveedor() {
        EmailService service = service(null, "");
        String text = service.buildReservationText(reservation());
        String html = service.buildReservationHtml(reservation());

        assertThat(text)
                .contains("RY-000042").contains("Hotel Mirador del Lago").contains("Bariloche")
                .contains(EmailService.formatDate(LocalDate.of(2030, 3, 10)))
                .contains("Noches: 3").contains("Personas: 2")
                .contains("5/01/2030 18:30")
                .contains("contacto@reservaya.com").contains("+54 9 11 0000-0000")
                .contains("http://localhost:5173/mis-reservas");
        assertThat(html)
                .contains("viewport")
                .contains("¡Reserva confirmada!")
                .contains("Llegamos &lt;tarde&gt;")
                .doesNotContain("<tarde>");
    }

    @Test
    void reserva_fallaElEnvio_noLanzaExcepcion() {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage((jakarta.mail.Session) null));
        doThrow(new org.springframework.mail.MailSendException("sin conexion")).when(sender).send(any(MimeMessage.class));

        assertThat(service(sender, "smtp.test").sendReservationConfirmation(reservation())).isFalse();
    }
}
