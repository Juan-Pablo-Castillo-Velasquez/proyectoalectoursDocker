"""
Módulo de correo electrónico - Envío de emails con SMTP directo
Configurado para Mailpit (desarrollo) — sin TLS, sin autenticación
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


async def send_email(email: str, subject: str, body: str, html_body: str | None = None) -> bool:
    """
    Envía un email simple o con cuerpo HTML usando SMTP directo.

    Args:
        email: Dirección de correo destino
        subject: Asunto del email
        body: Cuerpo en texto plano
        html_body: Cuerpo en HTML (opcional)

    Returns:
        True si se envió correctamente, False en caso contrario
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = email

        # Siempre adjuntar texto plano primero (fallback)
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Adjuntar HTML si se provee (tiene prioridad sobre texto plano)
        if html_body:
            msg.attach(MIMEText(html_body, "html", "utf-8"))

        use_ssl = getattr(settings, "MAIL_SSL_TLS", False)
        use_tls = getattr(settings, "MAIL_STARTTLS", False)

        if use_ssl:
            # Puerto 465 — SSL desde el inicio
            with smtplib.SMTP_SSL(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as server:
                if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                    server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                server.sendmail(settings.MAIL_FROM, [email], msg.as_string())
        else:
            # Puerto 587 (STARTTLS) o 1025 (Mailpit sin cifrado)
            with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as server:
                if use_tls:
                    server.starttls()
                if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                    server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                server.sendmail(settings.MAIL_FROM, [email], msg.as_string())

        return True

    except Exception as e:
        print(f"Error al enviar email a {email}: {str(e)}")
        return False


async def send_welcome_email(email: str, name: str) -> bool:
    """
    Envía un email de bienvenida a un nuevo usuario.
    """
    subject = "Bienvenido a AlecTours"

    body = f"""
Hola {name},

¡Bienvenido a AlecTours! Tu cuenta ha sido creada exitosamente.

Ya puedes acceder a nuestra plataforma con tus credenciales.

Saludos,
El equipo de AlecTours
    """.strip()

    html_body = f"""
<html>
    <body style="font-family: Arial, sans-serif; margin: 20px;">
        <h2>¡Bienvenido a AlecTours! 🎉</h2>
        <p>Hola <strong>{name}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Ya puedes acceder a nuestra plataforma con tus credenciales.</p>
        <hr>
        <p>Saludos,<br>El equipo de AlecTours</p>
    </body>
</html>
    """.strip()

    return await send_email(email, subject, body, html_body)


async def send_verification_email(
    email: str,
    verification_token: str,
    base_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173"),
) -> bool:
    """
    Envía un email de verificación con un enlace.
    """
    verification_link = f"{base_url}/verify?token={verification_token}"

    subject = "Verifica tu correo - AlecTours"

    body = f"""
Hola,

Por favor verifica tu correo haciendo clic en el siguiente enlace:
{verification_link}

Este enlace expirará en 24 horas.

Saludos,
El equipo de AlecTours
    """.strip()

    html_body = f"""
<html>
    <body style="font-family: Arial, sans-serif; margin: 20px;">
        <h2>Verifica tu correo</h2>
        <p>Por favor, haz clic en el botón de abajo para verificar tu dirección de correo:</p>
        <a href="{verification_link}"
           style="background-color: #007bff; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            Verificar Correo
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Este enlace expirará en 24 horas.
        </p>
        <hr>
        <p>Saludos,<br>El equipo de AlecTours</p>
    </body>
</html>
    """.strip()

    return await send_email(email, subject, body, html_body)


async def send_password_reset_email(
    email: str,
    reset_token: str,
    base_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173"),
) -> bool:
    reset_link = f"{base_url}/reset-password?token={reset_token}"
    subject = "Restablecer contraseña - AlecTours"
    body = f"Haz clic aquí para restablecer tu contraseña: {reset_link}"
    html_body = f"""
    <html><body style="font-family: Arial, sans-serif; margin: 20px;">
        <h2>Restablecer contraseña</h2>
        <p>Haz clic en el botón para crear una nueva contraseña:</p>
        <a href="{reset_link}" style="background-color: #2563EB; color: white; padding: 10px 20px;
           text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Este enlace expirará en 24 horas.
        </p>
    </body></html>
    """
    return await send_email(email, subject, body, html_body)


async def send_reservation_confirmation(
    email: str, reservation_id: int, hotel_name: str, check_in: str, check_out: str, total_price: float, guest_name: str
) -> bool:
    """
    Envía confirmación de reserva.
    """
    subject = f"Confirmación de Reserva #{reservation_id} - AlecTours"

    body = f"""
Hola {guest_name},

Tu reserva ha sido confirmada.

Detalles:
- Reserva ID: {reservation_id}
- Hotel: {hotel_name}
- Check-in: {check_in}
- Check-out: {check_out}
- Total: ${total_price:.2f}

Gracias por elegir AlecTours.

Saludos,
El equipo de AlecTours
    """.strip()

    html_body = f"""
<html>
    <body style="font-family: Arial, sans-serif; margin: 20px; color: #333;">
        <h2>Confirmación de Reserva 🎉</h2>
        <p>Hola <strong>{guest_name}</strong>,</p>
        <p>Tu reserva ha sido confirmada exitosamente.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Detalles de tu Reserva</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Número de Reserva:</td>
                    <td style="padding: 8px;">#{reservation_id}</td>
                </tr>
                <tr style="background-color: #fff;">
                    <td style="padding: 8px; font-weight: bold;">Hotel:</td>
                    <td style="padding: 8px;">{hotel_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Check-in:</td>
                    <td style="padding: 8px;">{check_in}</td>
                </tr>
                <tr style="background-color: #fff;">
                    <td style="padding: 8px; font-weight: bold;">Check-out:</td>
                    <td style="padding: 8px;">{check_out}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Total:</td>
                    <td style="padding: 8px; color: #28a745; font-weight: bold;">${total_price:.2f}</td>
                </tr>
            </table>
        </div>

        <p>Gracias por elegir AlecTours para tu próxima aventura.</p>
        <hr>
        <p>Saludos,<br>El equipo de AlecTours</p>
    </body>
</html>
    """.strip()

    return await send_email(email, subject, body, html_body)


async def send_cancellation_email(
    email: str, reservation_id: int, guest_name: str, refund_amount: float | None = None
) -> bool:
    """
    Envía confirmación de cancelación de reserva.
    """
    subject = f"Cancelación de Reserva #{reservation_id} - AlecTours"

    refund_text = f"\nReembolso: ${refund_amount:.2f}" if refund_amount else ""

    body = f"""
Hola {guest_name},

Tu reserva #{reservation_id} ha sido cancelada.
{refund_text}

Si tienes dudas, contacta a nuestro equipo.

Saludos,
El equipo de AlecTours
    """.strip()

    refund_html = (
        f'<p style="color: #28a745;">Reembolso: <strong>${refund_amount:.2f}</strong></p>' if refund_amount else ""
    )

    html_body = f"""
<html>
    <body style="font-family: Arial, sans-serif; margin: 20px; color: #333;">
        <h2>Cancelación de Reserva</h2>
        <p>Hola <strong>{guest_name}</strong>,</p>
        <p>Tu reserva <strong>#{reservation_id}</strong> ha sido cancelada.</p>
        {refund_html}
        <p>Si tienes dudas, no dudes en contactarnos.</p>
        <hr>
        <p>Saludos,<br>El equipo de AlecTours</p>
    </body>
</html>
    """.strip()

    return await send_email(email, subject, body, html_body)


async def send_contact_email(nombre: str, correo: str, asunto: str, mensaje: str) -> bool:
    """
    Reenvía un mensaje del formulario de contacto a la bandeja de soporte
    y envía una confirmación de recibido al remitente.
    """
    # 1) Correo interno a soporte con los datos del formulario
    subject_interno = f"[Contacto Web] {asunto}"
    body_interno = f"""
Nuevo mensaje desde el formulario de contacto:

Nombre: {nombre}
Correo: {correo}
Asunto: {asunto}

Mensaje:
{mensaje}
    """.strip()

    html_interno = f"""
<html>
    <body style="font-family: Arial, sans-serif; margin: 20px; color: #333;">
        <h2>Nuevo mensaje de contacto</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Nombre:</td><td style="padding: 8px;">{nombre}</td></tr>
            <tr style="background-color: #f5f5f5;"><td style="padding: 8px; font-weight: bold;">Correo:</td><td style="padding: 8px;">{correo}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Asunto:</td><td style="padding: 8px;">{asunto}</td></tr>
        </table>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <p style="white-space: pre-wrap; margin: 0;">{mensaje}</p>
        </div>
    </body>
</html>
    """.strip()

    ok_interno = await send_email(settings.MAIL_FROM, subject_interno, body_interno, html_interno)

    # 2) Confirmación automática al usuario
    subject_confirmacion = "Recibimos tu mensaje - AlecTours"
    body_confirmacion = f"""
Hola {nombre},

Gracias por escribirnos. Hemos recibido tu mensaje sobre "{asunto}" y un asesor te responderá a este correo en menos de 2 horas hábiles.

Saludos,
El equipo de AlecTours
    """.strip()

    html_confirmacion = f"""
<html>
    <body style="font-family: Arial, sans-serif; margin: 20px; color: #333;">
        <h2>¡Gracias por escribirnos, {nombre}! 🎉</h2>
        <p>Hemos recibido tu mensaje sobre <strong>"{asunto}"</strong>.</p>
        <p>Un asesor de AlecTours te responderá a este correo en menos de 2 horas hábiles.</p>
        <hr>
        <p>Saludos,<br>El equipo de AlecTours</p>
    </body>
</html>
    """.strip()

    ok_confirmacion = await send_email(correo, subject_confirmacion, body_confirmacion, html_confirmacion)

    return ok_interno and ok_confirmacion
