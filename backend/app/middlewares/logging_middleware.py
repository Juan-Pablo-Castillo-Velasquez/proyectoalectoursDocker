"""Middleware de logging: registra método + ruta de cada request y el
código de estado de su respuesta.

Antes vivía embebido en app/main.py -- se separa acá junto con
security_middleware.py (ver ese archivo) para que main.py quede como el
punto donde se arma la app, no donde vive la lógica de cada pieza.
"""

import logging

logger = logging.getLogger(__name__)


async def log_requests(request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
