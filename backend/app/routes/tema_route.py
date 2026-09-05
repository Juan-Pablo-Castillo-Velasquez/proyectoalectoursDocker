"""Temas de color de temporada (Navidad, Halloween, etc.) -- el admin los
crea/edita y activa uno a la vez para recolorear el acento de marca (granate
+ dorado) en todo el sitio, sin tocar fondos/textos base. Ver
app/models/tema_model.py para el porqué de cada campo y la verificación de
contraste WCAG 2.1 AA."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.cache import delete_pattern, get_cached, set_cached
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.file_validation import validar_y_leer_archivo
from app.core.image_storage import borrar_imagen, guardar_imagen
from app.core.security import require_admin
from app.repositories.tema_repository import TemaEnUsoError, TemaRepository
from app.schemas.tema_schema import TemaCreate, TemaResponse, TemaUpdate

router = APIRouter(prefix="/api/temas", tags=["Temas"])

TEMA_ACTIVO_CACHE_KEY = "tema:activo"
TEMA_CACHE_PATTERN = "tema:*"
TEMA_ACTIVO_CACHE_TTL = 300  # 5 min -- igual se invalida al instante en cada escritura

# Imagen decorativa real (opcional) del tema -- Halloween/Navidad con una
# foto/ilustración real, no solo el ícono lucide. Mismas validaciones y
# mismo mecanismo de almacenamiento (Cloudinary si está configurado, disco
# local si no) que ya usan banners y fotos de perfil.
TEMA_IMAGEN_PUBLIC_PREFIX = "/uploads/temas"
TEMA_IMAGEN_TIPOS_PERMITIDOS = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
TEMA_IMAGEN_TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024  # 5MB

# Video decorativo (opcional) para el fondo del Hero cuando este tema está
# activo -- ej. un clip de nieve cayendo para Navidad. Mismo mecanismo de
# almacenamiento que la imagen de arriba (Cloudinary si está configurado,
# resource_type="video" para que no se procese como imagen), pero con su
# propia carpeta y límites: un video pesa mucho más que una foto, así que
# el máximo se pone bajo a propósito -- el Hero necesita un clip corto en
# loop, no una película; 15MB alcanza de sobra para unos segundos bien
# comprimidos y evita que alguien suba un archivo enorme sin querer.
TEMA_VIDEO_PUBLIC_PREFIX = "/uploads/temas-video"
TEMA_VIDEO_TIPOS_PERMITIDOS = {"video/mp4", "video/webm"}
TEMA_VIDEO_TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024  # 15MB


# ===================== PÚBLICO =====================
@router.get("/activo", response_model=TemaResponse)
def get_tema_activo(db: Session = Depends(get_db)):
    """El tema vigente ahora mismo -- lo consume el frontend en el arranque
    de la app para pintar --primary/--gold correctos antes del primer
    render (ver TemaProvider.tsx)."""
    cached = get_cached(TEMA_ACTIVO_CACHE_KEY)
    if cached is not None:
        return cached

    tema = TemaRepository.get_activo(db)
    if not tema:
        raise HTTPException(status_code=404, detail="No hay ningún tema configurado")
    data = TemaResponse.model_validate(tema).model_dump(mode="json")
    set_cached(TEMA_ACTIVO_CACHE_KEY, data, ttl_seconds=TEMA_ACTIVO_CACHE_TTL)
    return data


# ===================== ADMIN =====================
@router.get("/", response_model=list[TemaResponse])
def get_temas_admin(db: Session = Depends(get_db), admin_id: int = Depends(require_admin)):
    return TemaRepository.get_all(db)


@router.post("/", response_model=TemaResponse, status_code=201)
def create_tema(
    datos: TemaCreate,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    nuevo = TemaRepository.create(db, datos.model_dump())
    return nuevo


@router.put("/{id_tema}", response_model=TemaResponse)
def update_tema(
    id_tema: int,
    datos: TemaUpdate,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    try:
        actualizado = TemaRepository.update(db, id_tema, datos.model_dump())
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail) from e
    delete_pattern(TEMA_CACHE_PATTERN)  # por si el tema editado era el activo
    return actualizado


@router.put("/{id_tema}/activar", response_model=TemaResponse)
def activar_tema(
    id_tema: int,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    try:
        tema = TemaRepository.activar(db, id_tema)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail) from e
    delete_pattern(TEMA_CACHE_PATTERN)
    return tema


@router.delete("/{id_tema}")
def delete_tema(id_tema: int, db: Session = Depends(get_db), admin_id: int = Depends(require_admin)):
    try:
        resultado = TemaRepository.delete(db, id_tema)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail) from e
    except TemaEnUsoError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    delete_pattern(TEMA_CACHE_PATTERN)
    return resultado


@router.post("/{id_tema}/imagen", response_model=TemaResponse)
async def subir_imagen_tema(
    id_tema: int,
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    """Sube (o reemplaza) la imagen decorativa real del tema -- ej. una
    foto de calabazas para Halloween o de un árbol para Navidad. Opcional:
    un tema sigue funcionando solo con su ícono lucide si nunca se le sube
    ninguna."""
    tema = TemaRepository.get_by_id(db, id_tema)
    if not tema:
        raise HTTPException(status_code=404, detail=f"Tema con ID {id_tema} no encontrado")

    contenido, extension = await validar_y_leer_archivo(
        imagen,
        tipos_permitidos=TEMA_IMAGEN_TIPOS_PERMITIDOS,
        mensaje_tipo="Formato de imagen no soportado. Usa JPG, PNG o WEBP.",
        tamano_maximo_bytes=TEMA_IMAGEN_TAMANO_MAXIMO_BYTES,
    )
    nueva_url = guardar_imagen(contenido, extension, carpeta="temas", public_path_prefix=TEMA_IMAGEN_PUBLIC_PREFIX)
    borrar_imagen(tema.imagen_url, carpeta="temas", public_path_prefix=TEMA_IMAGEN_PUBLIC_PREFIX)

    actualizado = TemaRepository.update(db, id_tema, {"imagen_url": nueva_url})
    delete_pattern(TEMA_CACHE_PATTERN)
    return actualizado


@router.delete("/{id_tema}/imagen", response_model=TemaResponse)
def borrar_imagen_tema(
    id_tema: int,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    """Quita la imagen decorativa del tema -- vuelve a depender solo del
    ícono lucide, nunca deja el tema en un estado inválido."""
    tema = TemaRepository.get_by_id(db, id_tema)
    if not tema:
        raise HTTPException(status_code=404, detail=f"Tema con ID {id_tema} no encontrado")

    borrar_imagen(tema.imagen_url, carpeta="temas", public_path_prefix=TEMA_IMAGEN_PUBLIC_PREFIX)
    actualizado = TemaRepository.update(db, id_tema, {"imagen_url": None})
    delete_pattern(TEMA_CACHE_PATTERN)
    return actualizado


@router.post("/{id_tema}/video", response_model=TemaResponse)
async def subir_video_tema(
    id_tema: int,
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    """Sube (o reemplaza) el video decorativo del fondo del Hero para este
    tema -- ej. un clip corto de nieve para Navidad. Opcional: un tema
    sigue funcionando con el video genérico de por defecto (ver Hero.tsx)
    si nunca se le sube ninguno."""
    tema = TemaRepository.get_by_id(db, id_tema)
    if not tema:
        raise HTTPException(status_code=404, detail=f"Tema con ID {id_tema} no encontrado")

    contenido, extension = await validar_y_leer_archivo(
        video,
        tipos_permitidos=TEMA_VIDEO_TIPOS_PERMITIDOS,
        mensaje_tipo="Formato de video no soportado. Usa MP4 o WEBM.",
        tamano_maximo_bytes=TEMA_VIDEO_TAMANO_MAXIMO_BYTES,
    )
    nueva_url = guardar_imagen(
        contenido,
        extension,
        carpeta="temas-video",
        public_path_prefix=TEMA_VIDEO_PUBLIC_PREFIX,
        resource_type="video",
    )
    borrar_imagen(
        tema.video_url,
        carpeta="temas-video",
        public_path_prefix=TEMA_VIDEO_PUBLIC_PREFIX,
        resource_type="video",
    )

    actualizado = TemaRepository.update(db, id_tema, {"video_url": nueva_url})
    delete_pattern(TEMA_CACHE_PATTERN)
    return actualizado


@router.delete("/{id_tema}/video", response_model=TemaResponse)
def borrar_video_tema(
    id_tema: int,
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin),
):
    """Quita el video decorativo del tema -- el Hero vuelve a caer en el
    video genérico de por defecto, nunca deja el tema en un estado inválido."""
    tema = TemaRepository.get_by_id(db, id_tema)
    if not tema:
        raise HTTPException(status_code=404, detail=f"Tema con ID {id_tema} no encontrado")

    borrar_imagen(
        tema.video_url,
        carpeta="temas-video",
        public_path_prefix=TEMA_VIDEO_PUBLIC_PREFIX,
        resource_type="video",
    )
    actualizado = TemaRepository.update(db, id_tema, {"video_url": None})
    delete_pattern(TEMA_CACHE_PATTERN)
    return actualizado
