package com.reservaya.service;

import com.reservaya.dto.ReservationDtos.ReservationResponse;
import com.reservaya.model.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Correos de la aplicacion: confirmacion de registro (#19) y confirmacion de reserva (#35).
 *
 * Si hay un servidor SMTP configurado (MAIL_HOST / spring.mail.host), el correo se envia de verdad.
 * Si no, el contenido se escribe en el log del backend para poder verificarlo en desarrollo.
 * Un fallo de envio nunca interrumpe el registro ni la reserva.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final Locale ES = Locale.forLanguageTag("es-AR");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", ES);
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("d/MM/yyyy HH:mm", ES);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String mailHost;
    private final String from;
    private final String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${spring.mail.host:}") String mailHost,
                        @Value("${app.mail.from:no-reply@reservaya.com}") String from,
                        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.mailHost = mailHost;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    private JavaMailSender sender() {
        return mailHost == null || mailHost.isBlank() ? null : mailSender.getIfAvailable();
    }

    // ------------------------------------------------------------------ #19 registro

    /** @return true si el correo se envio por SMTP; false si solo se registro en el log o fallo. */
    public boolean sendRegistrationConfirmation(User user) {
        String subject = "ReservaYa - Confirmacion de registro";
        String body = buildRegistrationBody(user);

        JavaMailSender sender = sender();
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

    // ------------------------------------------------------------------ #35 reserva

    /**
     * Correo con los datos de la reserva, enviado al correo con el que el usuario se registro, justo despues
     * de confirmarla. Se envia en HTML adaptable a moviles, con una version de texto plano alternativa.
     */
    public boolean sendReservationConfirmation(ReservationResponse reservation) {
        String subject = "ReservaYa - Reserva confirmada " + reservation.code() + " - " + reservation.product().name();
        String text = buildReservationText(reservation);

        JavaMailSender sender = sender();
        if (sender == null) {
            log.info("SMTP no configurado. Correo de reserva para {}:\nAsunto: {}\n{}", reservation.userEmail(), subject, text);
            return false;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(reservation.userEmail());
            helper.setSubject(subject);
            helper.setText(text, buildReservationHtml(reservation));
            sender.send(message);
            log.info("Correo de reserva {} enviado a {}", reservation.code(), reservation.userEmail());
            return true;
        } catch (Exception ex) {
            log.warn("No se pudo enviar el correo de la reserva {}: {}", reservation.code(), ex.getMessage());
            return false;
        }
    }

    String buildReservationText(ReservationResponse r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hola ").append(r.userName()).append(",\n\n")
                .append("Tu reserva fue confirmada. Estos son los datos:\n\n")
                .append("  Codigo de reserva: ").append(r.code()).append('\n')
                .append("  Producto: ").append(r.product().name()).append('\n');
        if (r.product().location() != null) {
            sb.append("  Ubicacion: ").append(r.product().location()).append('\n');
        }
        sb.append("  Entrada: ").append(DATE.format(r.startDate())).append('\n')
                .append("  Salida: ").append(DATE.format(r.endDate())).append('\n')
                .append("  Noches: ").append(r.nights()).append('\n');
        if (r.guests() != null) sb.append("  Personas: ").append(r.guests()).append('\n');
        if (r.phone() != null) sb.append("  Telefono de contacto: ").append(r.phone()).append('\n');
        if (r.comments() != null) sb.append("  Comentarios: ").append(r.comments()).append('\n');
        if (r.createdAt() != null) sb.append("  Reserva realizada: ").append(DATE_TIME.format(r.createdAt())).append('\n');
        sb.append("\nContacto del proveedor:\n")
                .append("  ").append(r.provider().name()).append('\n')
                .append("  Correo: ").append(r.provider().email()).append('\n')
                .append("  Telefono / WhatsApp: ").append(r.provider().phone()).append("\n\n")
                .append("Puedes ver todas tus reservas en ").append(frontendUrl).append("/mis-reservas\n\n")
                .append("Gracias por elegir ReservaYa.\n");
        return sb.toString();
    }

    String buildReservationHtml(ReservationResponse r) {
        StringBuilder rows = new StringBuilder();
        row(rows, "Código de reserva", r.code());
        row(rows, "Producto", r.product().name());
        row(rows, "Ubicación", r.product().location());
        row(rows, "Entrada", DATE.format(r.startDate()));
        row(rows, "Salida", DATE.format(r.endDate()));
        row(rows, "Noches", String.valueOf(r.nights()));
        row(rows, "Personas", r.guests() == null ? null : String.valueOf(r.guests()));
        row(rows, "Teléfono de contacto", r.phone());
        row(rows, "Comentarios", r.comments());
        row(rows, "Reserva realizada", r.createdAt() == null ? null : DATE_TIME.format(r.createdAt()));
        return """
                <!doctype html>
                <html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#efeafc;font-family:Segoe UI,Arial,sans-serif;color:#1f1f2e">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#efeafc;padding:24px 12px">
                    <tr><td align="center">
                      <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
                        <tr><td style="background:#6c4fe0;color:#ffffff;padding:24px">
                          <div style="font-size:22px;font-weight:700">¡Reserva confirmada!</div>
                          <div style="opacity:.9;margin-top:4px">Hola %s, estos son los datos de tu reserva.</div>
                        </td></tr>
                        <tr><td style="padding:20px 24px">
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="font-size:15px">%s</table>
                        </td></tr>
                        <tr><td style="padding:0 24px 20px">
                          <div style="background:#efeafc;border-radius:8px;padding:14px 16px;font-size:14px">
                            <strong>Contacto del proveedor</strong><br>%s<br>Correo: %s<br>Teléfono / WhatsApp: %s
                          </div>
                        </td></tr>
                        <tr><td align="center" style="padding:0 24px 28px">
                          <a href="%s/mis-reservas" style="display:inline-block;background:#6c4fe0;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">Ver mis reservas</a>
                        </td></tr>
                      </table>
                      <div style="font-size:12px;color:#5d5d73;margin-top:12px">ReservaYa · Tu próxima reserva, a un clic</div>
                    </td></tr>
                  </table>
                </body></html>
                """.formatted(esc(r.userName()), rows, esc(r.provider().name()), esc(r.provider().email()),
                esc(r.provider().phone()), frontendUrl);
    }

    private static void row(StringBuilder sb, String label, String value) {
        if (value == null || value.isBlank()) return;
        sb.append("<tr><td style=\"padding:8px 0;color:#5d5d73;width:45%;vertical-align:top\">").append(esc(label))
                .append("</td><td style=\"padding:8px 0;font-weight:600\">").append(esc(value)).append("</td></tr>");
    }

    private static String esc(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }

    /** Usado en pruebas para fijar la fecha en los textos. */
    static String formatDate(LocalDate date) {
        return DATE.format(date);
    }
}
