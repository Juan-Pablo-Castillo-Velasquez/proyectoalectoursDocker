"""
services/payment_service.py

Logica de decision para el pago simulado por metodo (tarjeta, PSE, Nequi,
PayPal, otros). Este modulo NO toca la base de datos ni conoce a FastAPI:
las rutas (reserva_route.py) siguen siendo responsables de la transaccion,
esto solo decide "que debe pasar" segun el metodo y los datos de prueba.

Ningun proveedor real esta conectado (Tarjeta/PSE/Nequi/PayPal son 100%
simulados), tal como pide el brief.
"""

# PSE y Nequi simulan una confirmacion externa (banco / app) que llega
# despues de iniciar el pago; tarjeta, PayPal y el resto resuelven al
# instante, igual que antes.
ASYNC_CODIGOS = {"pse", "nequi"}

# Valores de prueba conocidos para poder ver el camino de rechazo sin
# conectar ninguna pasarela real (mismo principio que las tarjetas de
# prueba de Stripe: un valor "marcado" siempre rechaza).
_REJECT_CARD_LAST4 = {"0002"}
_REJECT_NEQUI_SUFIJO = "0000"
_REJECT_PSE_DOCUMENTO = {"0000000000"}


def es_pago_asincrono(codigo_metodo: str) -> bool:
    """True si el metodo debe quedar en 'procesando' hasta que el frontend
    llame a POST /api/pagos/{id}/confirmar (PSE, Nequi)."""
    return codigo_metodo in ASYNC_CODIGOS


def debe_simular_rechazo(codigo_metodo: str, data) -> bool:
    """Decide si el pago debe terminar rechazado, segun valores de prueba:
    - Tarjeta terminada en 0002 -> rechazada.
    - Nequi con celular terminado en 0000 -> rechazada.
    - PSE con documento 0000000000 -> rechazada.
    Cualquier otro valor (o metodo sin regla) se aprueba.
    `data` es un PagarRequest (o cualquier objeto con los mismos atributos
    opcionales: ultimos4, celular, documento).
    """
    if codigo_metodo in ("tarjeta_credito", "tarjeta_debito"):
        return (getattr(data, "ultimos4", None) or "") in _REJECT_CARD_LAST4
    if codigo_metodo == "nequi":
        return (getattr(data, "celular", None) or "").endswith(_REJECT_NEQUI_SUFIJO)
    if codigo_metodo == "pse":
        return (getattr(data, "documento", None) or "") in _REJECT_PSE_DOCUMENTO
    return False
