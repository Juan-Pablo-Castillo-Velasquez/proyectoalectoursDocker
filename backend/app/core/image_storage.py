"""
Almacenamiento de imágenes subidas por la app (fotos de perfil, banners).

Si la variable de entorno CLOUDINARY_URL está configurada (ver
app/core/config.py y backend/.env.example), las imágenes se suben a
Cloudinary y se guarda la URL https:// que devuelve. Si NO está
configurada, el comportamiento es exactamente el de antes de este módulo:
se guardan en disco local bajo backend/app/static/uploads/<carpeta>/,
servidas por el mount /uploads ya existente en app/main.py.

Este fallback es intencional: el requisito general del proyecto es que
`docker compose up --build` funcione de cero sin que nadie tenga que crear
ninguna cuenta externa. Cloudinary es 100% opcional — solo se activa si
alguien define CLOUDINARY_URL en backend/.env.

No se usa para los comprobantes de pago (reserva_route.py): esos son
capturas de transferencias/pagos que puede traer datos bancarios del
cliente, y se dejan deliberadamente en disco local por ahora (ver nota en
reserva_route.py) — sección conservadora del proyecto por instrucción
explícita, no un descuido.
"""

from __future__ import annotations

import contextlib
import os
import uuid

import cloudinary
import cloudinary.uploader

from app.core.config import settings

# True si hay una cuenta de Cloudinary configurada. Se calcula una sola vez
# al importar el módulo — cambiar backend/.env requiere reiniciar el
# contenedor backend para que tome efecto, igual que cualquier otra
# variable de entorno de este proyecto.
CLOUDINARY_CONFIGURADO = bool(settings.CLOUDINARY_URL)

if CLOUDINARY_CONFIGURADO:
    cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL, secure=True)


def _directorio_local(carpeta: str) -> str:
    """backend/app/static/uploads/<carpeta> — misma ruta que se usaba antes
    de este módulo en usuario_route.py / banner_route.py."""
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads", carpeta)


def guardar_imagen(
    contenido: bytes,
    extension: str,
    *,
    carpeta: str,
    public_path_prefix: str,
    resource_type: str = "image",
) -> str:
    """Guarda un archivo ya validado (bytes reales + extensión real, ver
    file_validation.py::validar_y_leer_archivo) y devuelve la URL a guardar
    en la base de datos.

    - Con Cloudinary configurado: sube el archivo y devuelve la URL https://
      completa (el frontend ya sabe mostrar una URL absoluta tal cual, ver
      resolveFotoUrl en components/admin/types.ts y resolveImagenBanner en
      services/banner.service.ts).
    - Sin Cloudinary: guarda en disco local y devuelve la ruta relativa
      "/uploads/<carpeta>/archivo.ext", como siempre.

    `resource_type` por defecto es "image" -- todos los llamadores
    existentes (fotos de perfil, banners, imagen de tema) siguen igual sin
    tocar nada. Se agregó para el video decorativo de temas (ver
    tema_route.py::subir_video_tema), que necesita resource_type="video"
    para que Cloudinary no intente procesarlo como imagen.
    """
    identificador = uuid.uuid4().hex

    if CLOUDINARY_CONFIGURADO:
        # "folder" (no un public_id con "/" a mano) es lo que de verdad
        # crea la carpeta visible en el Media Library — las cuentas nuevas
        # de Cloudinary usan "Dynamic Folder Mode" por defecto, donde un
        # public_id con barras se guarda tal cual (un nombre largo con
        # barras) pero NO arma ninguna carpeta real; hallazgo real de esta
        # cuenta (ver conversación): la primera prueba subió la foto sin
        # ninguna carpeta "alectours" en el Media Library.
        resultado = cloudinary.uploader.upload(
            contenido,
            folder=f"alectours/{carpeta}",
            public_id=identificador,
            resource_type=resource_type,
            overwrite=False,
        )
        return resultado["secure_url"]

    directorio = _directorio_local(carpeta)
    os.makedirs(directorio, exist_ok=True)
    nombre_archivo = f"{identificador}.{extension}"
    ruta_destino = os.path.join(directorio, nombre_archivo)
    with open(ruta_destino, "wb") as f:
        f.write(contenido)
    return f"{public_path_prefix}/{nombre_archivo}"


def _public_id_desde_url_cloudinary(url: str) -> str | None:
    """Extrae el public_id (ej. 'alectours/perfiles/<hex>') de una URL de
    Cloudinary tipo:
    https://res.cloudinary.com/<cloud>/image/upload/v169.../alectours/perfiles/<hex>.jpg
    """
    try:
        sin_query = url.split("?", 1)[0]
        despues_upload = sin_query.split("/upload/", 1)[1]
        segmentos = despues_upload.split("/", 1)
        # El primer segmento tras /upload/ es la versión ("v1234567") si
        # Cloudinary la incluyó — se descarta, no es parte del public_id.
        if len(segmentos) == 2 and segmentos[0].startswith("v") and segmentos[0][1:].isdigit():
            despues_upload = segmentos[1]
        return despues_upload.rsplit(".", 1)[0]
    except (IndexError, ValueError):
        return None


def borrar_imagen(
    url: str | None,
    *,
    carpeta: str,
    public_path_prefix: str,
    resource_type: str = "image",
) -> None:
    """Borra el archivo anterior al reemplazarlo o eliminarlo. Revisa la
    FORMA de la url (http = Cloudinary, ruta relativa = disco local) en vez
    de asumir el modo activo ahora mismo — así una cuenta que ya tenía
    fotos guardadas en disco local antes de configurar Cloudinary no se
    queda con archivos huérfanos sin poder borrarlos.

    `resource_type` debe coincidir con el que se usó al subirlo en
    guardar_imagen() -- Cloudinary no encuentra un video si se le pide
    destroy() con resource_type="image" (por defecto)."""
    if not url:
        return

    if url.startswith("http"):
        if not CLOUDINARY_CONFIGURADO:
            return
        public_id = _public_id_desde_url_cloudinary(url)
        if public_id:
            # Nota: en cuentas con "Dynamic Folder Mode" (todas las nuevas,
            # ver guardar_imagen arriba) Cloudinary puede esperar el
            # public_id SIN el prefijo de carpeta para destroy(). Si esto
            # no borra el archivo viejo, no falla nada (try/except lo
            # traga) — solo queda una imagen huérfana en Cloudinary, sin
            # impacto funcional para la app.
            with contextlib.suppress(Exception):
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return

    if not url.startswith(public_path_prefix):
        return
    filename = url.rsplit("/", 1)[-1]
    ruta = os.path.join(_directorio_local(carpeta), filename)
    if os.path.isfile(ruta):
        with contextlib.suppress(OSError):
            os.remove(ruta)
