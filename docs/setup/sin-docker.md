# Setup sin Docker — AlecTours

> **Modo recomendado para:** desarrollo activo, depuración con IDE, hot-reload nativo.

Cada servicio corre directamente en el sistema operativo:

| Servicio | Cómo corre | URL / Puerto |
|---|---|---|
| PostgreSQL | Instalado localmente | `localhost:5432` |
| Redis | Instalado o Docker | `localhost:6379` |
| Backend | `uvicorn` con `.venv` activo | http://localhost:8000 |
| Frontend | `pnpm dev` (Vite) | http://localhost:5173 |
| Mailpit | Binario o Docker | http://localhost:8025 |

---

## Prerrequisitos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Python | 3.12+ | `python3 --version` |
| Node.js | 22+ | `node --version` |
| pnpm | 11+ | `pnpm --version` |
| PostgreSQL | 16+ | `psql --version` |
| Redis | 7+ | `redis-cli ping` |
| Git | 2.40+ | `git --version` |

> **Nunca usar `npm` ni `yarn`** — solo `pnpm` para instalar dependencias de Node.js.

### Instalar pnpm

```bash
corepack enable
corepack prepare pnpm@11.0.9 --activate
```

### Instalar Redis

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:** Usar Docker solo para Redis:
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker.git
cd proyectoalectoursDocker
```

---

## Paso 2 — Preparar PostgreSQL

```bash
sudo -u postgres psql    # Linux
psql -U postgres          # macOS / Windows
```

Dentro de la consola:

```sql
CREATE USER admin WITH PASSWORD 'admin123';
CREATE DATABASE alektours_db OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE alektours_db TO admin;
\q
```

Verificar:

```bash
psql -U admin -d alektours_db -h localhost -c "SELECT version();"
```

---

## Paso 3 — Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate      # Linux / macOS / Git Bash

# Instalar dependencias
pip install -r requirements.txt

# Copiar variables de entorno
cp .env.example .env
```

Editar `backend/.env` — cambiar `postgres` por `localhost` en DATABASE_URL:

```env
DATABASE_URL=postgresql+psycopg://admin:admin123@localhost:5432/alektours_db
SECRET_KEY=change_this_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379/0
MAIL_SERVER=localhost
MAIL_PORT=1025
```

### Ejecutar migraciones

```bash
alembic upgrade head
```

### Iniciar el backend

```bash
uvicorn app.main:app --reload
```

URLs disponibles:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## Paso 4 — Configurar el Frontend

```bash
cd ../alecktourfrondend

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env
```

Verificar `alecktourfrondend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Iniciar el frontend

```bash
pnpm dev
```

Salida:
```
VITE v6.x.x ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## Paso 5 — Configurar emails (desarrollo local)

### Opción A — Mailpit (recomendado)

```bash
# Descargar e instalar Mailpit
curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh | bash

# Iniciar en terminal aparte
mailpit
# → SMTP en localhost:1025
# → Web UI en http://localhost:8025
```

### Opción B — Sin emails

Dejar `MAIL_SERVER=` vacío en `.env`. El backend printea links en los logs de uvicorn.

---

## Paso 6 — Verificar todo

| URL | Qué muestra |
|---|---|
| http://localhost:5173 | Frontend |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/health | Health check |
| http://localhost:8025 | Mailpit (si está corriendo) |

Probar con curl:

```bash
# Registrar usuario
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","correo_electronico":"test@example.com","password":"Test1234!"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!"}'
```

---

## Resumen rápido

```bash
# Backend (terminal 1)
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload

# Frontend (terminal 2)
cd alecktourfrondend && pnpm dev

# Mailpit (terminal 3, opcional)
mailpit
```
