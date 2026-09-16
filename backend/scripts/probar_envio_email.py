"""
Script de diagnóstico manual para el envío de correos -- NO es un test de
pytest (a propósito no sigue el patrón test_*.py, para que ni pytest ni el
CI lo confundan con parte de la suite). Manda un correo real de prueba por
CADA transporte que tengas configurado en backend/.env (SMTP directo y,
si BREVO_API_KEY está definida, también la API HTTPS de Brevo), usando el
código real de app/core/mail.py::send_email() -- no una reimplementación
aparte -- así el resultado refleja exactamente lo que pasaría en la app.

Por qué correrlo en LOCAL y no en Render: tu máquina sí tiene salida
saliente a los puertos SMTP (25/465/587) que Render bloquea en el plan
free desde el 26 de septiembre de 2025 (ver el comentario del encabezado
de app/core/mail.py). Si el envío por SMTP funciona acá pero no en
Render, confirma que el problema era ese bloqueo (ya resuelto con
BREVO_API_KEY) y no tus credenciales de Brevo. Si el envío por SMTP
TAMPOCO funciona acá, el problema es la credencial o el remitente de
Brevo, no Render -- y este script te muestra el error exacto que Brevo
devuelve, sin adivinar.

Requisitos:
  - backend/.env con los valores reales (MAIL_USERNAME, MAIL_PASSWORD,
    MAIL_FROM, y opcionalmente BREVO_API_KEY) -- ver la sección
    "CONFIGURACIÓN DE EMAIL" de backend/.env.example. Sin backend/.env,
    Settings() ni siquiera arranca (DATABASE_URL/SECRET_KEY son
    obligatorias): copia .env.example a .env y llena al menos esas dos
    de relleno si solo quieres probar el envío sin levantar todo lo
    demás.

Uso (desde la carpeta backend/, con las dependencias instaladas):
    python scripts/probar_envio_email.py tu-correo-real@gmail.com
"""

import asyncio
import sys

sys.path.insert(0, ".")

from app.core.config import settings  # noqa: E402
from app.core.mail import send_email  # noqa: E402


async def _probar(destino: str) -> None:
    api_key_original = settings.BREVO_API_KEY

    print("--- Probando SMTP directo (smtplib) ---")
    print(f"MAIL_SERVER={settings.MAIL_SERVER}:{settings.MAIL_PORT}  MAIL_USERNAME={settings.MAIL_USERNAME!r}")
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        print("MAIL_USERNAME/MAIL_PASSWORD vacíos en backend/.env -- se salta esta prueba.\n")
    else:
        settings.BREVO_API_KEY = ""  # fuerza el camino SMTP aunque haya API key en .env
        ok = await send_email(destino, "Prueba SMTP directo -- AlecTours", "Prueba de envío por SMTP directo.")
        print(f"{'OK' if ok else 'FALLÓ'} -- revisa el detalle de arriba si falló.\n")

    settings.BREVO_API_KEY = api_key_original

    print("--- Probando API HTTPS de Brevo (BREVO_API_KEY) ---")
    if not settings.BREVO_API_KEY:
        print("BREVO_API_KEY vacía en backend/.env -- se salta esta prueba.")
    else:
        ok = await send_email(
            destino,
            "Prueba API Brevo -- AlecTours",
            "Prueba de envío por la API HTTPS de Brevo.",
            html_body="<p>Prueba de envío por la API HTTPS de Brevo.</p>",
        )
        print(f"{'OK' if ok else 'FALLÓ'} -- revisa el detalle de Brevo de arriba si falló.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python scripts/probar_envio_email.py tu-correo-real@gmail.com")
        sys.exit(1)
    asyncio.run(_probar(sys.argv[1]))
