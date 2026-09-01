# Setup con Docker — AlecTours

> **Modo recomendado para:** demostraciones, pruebas rápidas, entornos de clase.

Con Docker Compose, todos los servicios corren en contenedores:

| Servicio | Qué es | Puerto |
|---|---|---|
| `postgres` | PostgreSQL 16 | 5432 |
| `backend` | FastAPI + Uvicorn | 8000 |
| `frontend` | React + Vite | 5173 |
| `pgadmin` | Administración de BD | 5050 |
| `mailpit` | Servidor SMTP local + Web UI | 8025 / 1025 |
| `redis` | Cache + rate limiting | 6379 |

---

## Prerrequisitos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.40+ | `git --version` |

> **Windows**: Docker Desktop requiere WSL2 habilitado.

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker.git
cd proyectoalectoursDocker
```

---

## Paso 2 — Configurar variables de entorno del Backend

```bash
cp backend/.env.example backend/.env
```

Abrir `backend/.env` y revisar los valores:

```env
DATABASE_URL=postgresql+psycopg://admin:admin123@postgres:5432/alektours_db
SECRET_KEY=change_this_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_password
MAIL_FROM=noreply@alektours.com
MAIL_PORT=1025
MAIL_SERVER=mailpit
MAIL_FROM_NAME=AlekTours
MAIL_STARTTLS=False
MAIL_SSL_TLS=False
REDIS_URL=redis://redis:6379/0
```

> Dentro de Docker, la BD se llama `postgres` (nombre del servicio), no `localhost`.

---

## Paso 3 — Levantar todos los servicios

```bash
docker compose up -d
```

La primera vez tarda más porque descarga las imágenes base.

Verificar que todos los contenedores están corriendo:

```bash
docker compose ps
```

Deberías ver algo así:

```
NAME              IMAGE                    STATUS
postgres_db       postgres:16              Up (healthy)
fastapi_backend   ...                      Up
react_frontend    ...                      Up
pgadmin           dpage/pgadmin4           Up
mailpit           axllent/mailpit          Up
redis_cache       redis:7-alpine           Up
```

---

## Paso 4 — Aplicar migraciones

```bash
docker compose exec backend alembic upgrade head
```

Esto crea todas las tablas y carga los datos semilla (hoteles, clientes, reservas, etc.).

---

## Paso 5 — Verificar que todo funciona

| URL | Qué muestra |
|---|---|
| http://localhost:5173 | Frontend (landing page) |
| http://localhost:8000/docs | Swagger UI del backend |
| http://localhost:8000/redoc | ReDoc del backend |
| http://localhost:5050 | pgAdmin |
| http://localhost:8025 | Mailpit (bandeja de emails) |

### Credenciales de prueba

| Usuario | Email/Username | Contraseña | Rol |
|---|---|---|---|
| Admin | `admin@alektours.com` | `Admin1234!` | admin |
| Cliente | `juanp` | `Cliente1234!` | cliente |
| Cliente | `mariag` | `Cliente1234!` | cliente |

---

## Paso 6 — Comandos útiles del día a día

```bash
# Ver logs
docker compose logs -f              # todos los servicios
docker compose logs -f backend      # solo backend
docker compose logs -f frontend     # solo frontend
docker compose logs -f postgres     # solo PostgreSQL

# Detener y reiniciar
docker compose stop                 # detiene (conserva datos)
docker compose start                # vuelve a iniciar
docker compose restart backend      # reinicia solo backend

# Reconstruir (cuando cambias código)
docker compose up --build -d        # reconstruye + levanta

# Limpiar
docker compose down                 # elimina contenedores (datos persisten)
docker compose down -v              # elimina contenedores + volúmenes (¡borra datos!)

# Ejecutar comandos dentro de un contenedor
docker compose exec backend bash
docker compose exec postgres psql -U admin -d alektours_db

# Migraciones
docker compose exec backend alembic current
docker compose exec backend alembic history
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "descripcion"
```

---

## Producción

Para despliegue real, usar el compose de producción:

```bash
# Completar backend/.env con valores reales de producción
# Exportar variables de PostgreSQL (no usar defaults de dev)
docker compose -f docker-compose.prod.yml up -d --build
```

Diferencias con dev:
- Backend usa stage `prod` (non-root user, 4 workers, healthcheck)
- PostgreSQL y Redis sin exposición de puerto al host
- Sin Mailpit ni pgAdmin
- Frontend desplegado en Vercel (no Docker)

---

## Solución de problemas

### Backend arranca y se cae

```bash
docker compose logs backend
# Causa común: backend/.env no existe → cp backend/.env.example backend/.env
```

### Puerto ya en uso

```bash
# Ver qué usa el puerto (ej: 5432)
netstat -ano | findstr :5432
# Cambiar puerto en docker-compose.yml o cerrar el proceso
```

### Emails no aparecen en Mailpit

```bash
# Verificar que MAIL_SERVER=mailpit en backend/.env
grep MAIL_SERVER backend/.env
# Verificar que Mailpit está corriendo
docker compose ps mailpit
```

### Reset total

```bash
docker compose down -v
docker system prune -f
docker compose up --build -d
docker compose exec backend alembic upgrade head
```
