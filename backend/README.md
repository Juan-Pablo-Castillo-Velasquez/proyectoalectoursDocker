# Backend — AlecTours API

API REST para gestión integral de servicios turísticos: hoteles, habitaciones, reservas, paquetes, servicios, pagos, clientes y empleados.

---

## Stack

- **FastAPI** — Framework web ASGI
- **SQLAlchemy 2.0** — ORM con tipos declarativos
- **Alembic** — Migraciones de base de datos
- **PostgreSQL 16** — Base de datos
- **Redis 7** — Caché y rate limiting
- **Pydantic** — Validación de datos
- **JWT** — Autenticación (python-jose)
- **bcrypt** — Hashing de contraseñas
- **SMTP directo** — Envío de emails (sin dependencia de librería externa)

---

## Estructura

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py            ← Pydantic Settings
│   │   ├── database.py          ← Engine + Session
│   │   ├── security.py          ← JWT + bcrypt
│   │   ├── deps.py              ← Dependencias (get_current_usuario, require_admin)
│   │   ├── mail.py              ← SMTP (7 tipos de email)
│   │   ├── cache.py             ← Redis client
│   │   ├── exceptions.py        ← Excepciones custom
│   │   └── file_validation.py   ← Validación MIME + magic bytes
│   │
│   ├── models/                  ← 14 archivos ORM (25+ tablas)
│   ├── schemas/                 ← Schemas Pydantic
│   ├── routes/                  ← 20 routers (200+ endpoints)
│   ├── repositories/            ← 11 repositorios
│   ├── services/                ← Lógica de negocio
│   ├── static/uploads/          ← Archivos subidos
│   └── main.py                  ← FastAPI app
│
├── alembic/
│   └── versions/                ← 16 migraciones
│
├── Dockerfile                   ← 3 stages (base, dev, prod)
├── entrypoint.sh                ← Ejecuta alembic upgrade head
├── requirements.txt             ← Dependencias
├── requirements-dev.txt         ← Dependencias de desarrollo
└── pyproject.toml               ← Configuración del proyecto
```

---

## Routers (20 registrados)

| Router | Prefijo | Descripción |
|---|---|---|
| auth | `/auth` | Registro, login, verificación email, recuperación contraseña |
| hoteles | `/api/hoteles` | CRUD hoteles, habitaciones, tipos, características |
| clientes | `/api/clientes` | CRUD clientes |
| empleados | `/api/empleados` | CRUD empleados |
| reservas | `/api/reservas` | CRUD reservas, pagar, historial |
| paquetes | `/api/paquetes` | CRUD paquetes turísticos |
| pagos | `/api/pagos` | Métodos de pago, comprobantes |
| servicios | `/api/servicios` | CRUD servicios y categorías |
| destinos | `/api/destinos` | CRUD destinos |
| preferencias | `/api/preferencias-cliente` | Preferencias de viaje |
| promociones | `/api/promociones` | Promociones destacadas |
| contacto | `/api/contacto` | Formulario de contacto |
| resenas | `/api/resenas` | Reseñas de hoteles |
| usuarios | `/api/usuarios` | CRUD usuarios, admin |
| roles | `/api/roles` | Consultar roles |
| favoritos | `/api/favoritos` | Favoritos |
| metodos-pago-guardados | `/api/metodos-pago-guardados` | Métodos de pago guardados |
| configuracion | `/api/configuracion` | Config sistema |
| notificaciones | `/api/notificaciones` | Notificaciones |
| solicitudes-cancelacion | `/api/solicitudes-cancelacion` | Solicitudes de cancelación |
| solicitudes-corporativas | `/api/solicitudes-corporativas` | Solicitudes empresa |
| dashboard | `/api/dashboard` | KPIs y métricas |
| banners | `/api/banners` | Banners publicitarios |

---

## Models (14 archivos, 25+ tablas)

| Archivo | Modelos principales |
|---|---|
| `user_model.py` | Usuario |
| `auth_model.py` | Rol, UsuarioRol, SesionUsuario, RecuperacionPassword |
| `cliente_model.py` | Cliente, Empleado, PreferenciaCliente |
| `hotel_model.py` | Hotel, Habitacion, TipoHabitacion, Caracteristica |
| `reserva_model.py` | Paquete, Reserva, Pago, MetodoPago, HistorialReserva |
| `servicio_model.py` | Destino, Servicio, Proveedor, CategoriaServicio |
| `resena_model.py` | Resena |
| `favorito_model.py` | Favorito |
| `notificacion_model.py` | Notificacion |
| `banner_model.py` | Banner |
| `metodo_pago_guardado_model.py` | MetodoPagoGuardado |
| `configuracion_model.py` | ConfiguracionSistema |
| `empresa_model.py` | SolicitudCorporativa |

---

## Migraciones (Alembic)

`entrypoint.sh` ejecuta `alembic upgrade head` automáticamente cada vez
que arranca el contenedor del backend — no hace falta aplicarlas a mano.
Los siguientes comandos son solo para consultar el estado o crear
migraciones nuevas durante el desarrollo:

```bash
docker compose exec backend alembic current         # Ver actual
docker compose exec backend alembic history          # Historial
docker compose exec backend alembic revision --autogenerate -m "descripcion"  # Crear
```

---

## Seguridad

- **bcrypt** para contraseñas
- **JWT** con access (30min) y refresh (7d) tokens
- **Rate limiting** via Redis token-bucket
- **Security headers** en todas las respuestas
- **Protección IDOR** con `exigir_propietario_o_admin`
- **Validación de archivos** con magic bytes
- **Sentry** opcional para error tracking
- **Global exception handler** — error 500 genérico

---

## Emails

7 tipos de email vía SMTP directo:

| Tipo | Trigger |
|---|---|
| Bienvenida | Registro de cliente |
| Verificación | Registro de usuario |
| Recuperación | Solicitud de reset de contraseña |
| Confirmación reserva | Creación de reserva |
| Cancelación | Cancelación de reserva |
| Contacto | Formulario de contacto (dual: soporte + confirmación) |
| Resolución cancelación | Aprobar/rechazar solicitud |

Desarrollo: Mailpit (`localhost:1025`, UI: `localhost:8025`).

---

## Docker

3 stages en el Dockerfile:

- **base**: Python 3.12-slim, gcc, dependencias del sistema
- **dev**: uvicorn --reload, bind-mount friendly
- **prod**: non-root user, 4 workers, healthcheck contra `/health`

---

## Variables de entorno

Ver `backend/.env.example` para la lista completa.

Mínimo necesario:

```env
DATABASE_URL=postgresql+psycopg2://admin:admin123@postgres:5432/alektours_db
SECRET_KEY=change_this_secret_key
REDIS_URL=redis://redis:6379/0
MAIL_SERVER=mailpit
MAIL_PORT=1025
```

`backend/.env.example` ya trae estos valores como default seguro para
desarrollo local — no es necesario crear un `.env` para levantar el
proyecto con Docker (ver "Inicio rápido" abajo). `backend/.env` es
opcional y solo hace falta para sobreescribir algún valor.

**Hosting de imágenes (opcional):** por defecto, las fotos de perfil y los
banners se guardan en disco local (`static/uploads/`). Si se define
`CLOUDINARY_URL` en `backend/.env`, se suben en su lugar a Cloudinary
(plan gratuito, sin tarjeta) — ver `app/core/image_storage.py` y el
comentario de esa variable en `.env.example`. Los comprobantes de pago
(`reserva_route.py`) se dejan siempre en disco local a propósito, por
tratarse de un dato sensible del área de pagos.

---

## Inicio rápido

```bash
# Con Docker (recomendado) — un solo comando, sin pasos manuales
cd ..
docker compose up --build

# Sin Docker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # editar DATABASE_URL (usar localhost en vez de "postgres")
alembic upgrade head
uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs
