"""
Módulo de correo electrónico - Envío de emails con SMTP directo
Configurado para Mailpit (desarrollo) — sin TLS, sin autenticación
"""

import html
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
    username: str | None = None,
) -> bool:
    """
    Envía el correo de verificación de registro con la identidad visual de
    AlecTours (granate + dorado, la misma paleta que --primary/--gold en
    theme.css) en vez de la plantilla generica de Arial + boton azul que
    traia antes. `username` es opcional (compatibilidad hacia atras con
    quien ya llamaba esta funcion sin ese dato) -- sin el, el saludo
    simplemente queda generico ("Hola,") en vez de "Hola, <nombre>,".
    """
    verification_link = f"{base_url}/verify?token={verification_token}"
    # Texto plano: el username tal cual (no es HTML, no hace falta escapar
    # nada ahí, y escaparlo solo ensuciaría el correo con "&lt;...&gt;"
    # literal si alguien puso caracteres raros en su nombre de usuario).
    saludo_nombre_texto = f", {username}" if username else ""
    # HTML: sí se escapa -- username es texto libre que el usuario eligió
    # al registrarse, y va insertado directo en el <body> del correo.
    nombre_seguro = html.escape(username) if username else None
    saludo_nombre_html = f", {nombre_seguro}" if nombre_seguro else ""

    subject = "Confirma tu correo para activar tu cuenta - AlecTours"

    body = f"""
Hola{saludo_nombre_texto},

¡Gracias por crear tu cuenta en AlecTours! Solo falta un paso: confirma
tu correo electrónico para activarla del todo.

Verifica tu correo aquí:
{verification_link}

Este enlace expira en 24 horas. Si tú no creaste esta cuenta, puedes
ignorar este mensaje con tranquilidad.

Saludos,
El equipo de AlecTours
    """.strip()

    html_body = f"""
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#fbf8f6; -webkit-text-size-adjust:100%; text-size-adjust:100%;">
  <div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#fbf8f6; mso-hide:all;">
    Confirma tu correo para activar tu cuenta en AlecTours. El enlace expira en 24 horas.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fbf8f6; border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; border-collapse:collapse; box-shadow:0 4px 24px rgba(110,24,50,0.08);">

          <tr>
            <td style="background-color:#6e1832; padding:32px 40px 28px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;" valign="middle">
                    <table role="presentation" width="44" height="44" cellpadding="0" cellspacing="0" border="0" style="width:44px; height:44px; background-color:#b8912e; border-radius:12px;">
                      <tr>
                        <td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif; font-size:20px; font-weight:700; color:#2e2611; line-height:44px;">A</td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" align="left">
                    <div style="font-family:Georgia,'Times New Roman',serif; font-size:24px; font-weight:700; color:#ffffff; letter-spacing:-0.3px; line-height:1.1;">AlecTours</div>
                    <div style="font-family:Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; color:#e7b9c5; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px;">Agencia de viajes y turismo</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#b8912e; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:40px 40px 32px 40px; font-family:Helvetica,Arial,sans-serif;">
              <h1 style="margin:0 0 16px 0; font-family:Georgia,'Times New Roman',serif; font-size:26px; font-weight:700; color:#241a1f; line-height:1.3;">
                Ya casi estás dentro
              </h1>
              <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#4a3f41;">
                Hola{saludo_nombre_html}, gracias por crear tu cuenta en <strong style="color:#6e1832;">AlecTours</strong>. Solo falta un paso: confirma tu correo para activarla y empezar a reservar tus próximos viajes.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td align="center" style="background-color:#6e1832; border-radius:10px;">
                    <a href="{verification_link}" target="_blank"
                       style="display:inline-block; padding:14px 36px; font-family:Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;">
                      Verificar mi correo
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#fbf3e2; border-radius:8px; padding:10px 14px;">
                    <span style="font-family:Helvetica,Arial,sans-serif; font-size:13px; color:#7a5f1e;">⏳ Este enlace expira en 24 horas.</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0; font-size:13px; line-height:1.6; color:#73686a;">
                ¿El botón no funciona? Copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px 0; font-size:12px; line-height:1.5; color:#6e1832; word-break:break-all; background-color:#f5f1ee; padding:10px 12px; border-radius:8px;">
                {verification_link}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid #f0e5e8; padding-top:20px;">
                  <p style="margin:0; font-size:12px; line-height:1.6; color:#a89a9d;">
                    Si tú no creaste esta cuenta, puedes ignorar este correo con tranquilidad -- no se activará nada sin confirmar.
                  </p>
                </td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f5f1ee; padding:20px 40px; text-align:center;">
              <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#8a7d7f;">
                Con cariño, el equipo de <strong style="color:#6e1832;">AlecTours</strong> ✈️
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
