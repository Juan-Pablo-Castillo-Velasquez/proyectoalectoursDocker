# Despliegue en producción — AlecTours

Guía verificada contra lo que ya existe hoy en el repo (`docker-compose.prod.yml`, `backend/Dockerfile` stage `prod`, `alecktourfrondend/Dockerfile.prod` + `nginx.conf`, `backend/.env.example`, `alecktourfrondend/.env.example` y `.github/workflows/ci.yml`) — nada de esto es especulativo, se leyó directamente del repo.

## Qué cambia frente a desarrollo local

`docker-compose.yml` (raíz del proyecto) es solo para desarrollo local: usa `target: dev` del `backend/Dockerfile` (hot-reload con `--reload`, corre como root porque el bind-mount `./backend:/app` lo necesita) e incluye Mailpit y pgAdmin, herramientas de desarrollo que no deben quedar expuestas en un servidor real.

Para un despliegue real se usa `docker-compose.prod.yml` (misma raíz del repo), que apunta al stage `prod` del mismo Dockerfile: sin `--reload`, con `--workers 4`, corriendo como usuario no-root, con healthcheck real contra `/health` (valida conexión a la base de datos, no es un endpoint de mentira), y sin bind-mount del código — va horneado en la imagen. No incluye Mailpit ni pgAdmin, y Postgres/Redis no exponen puerto al host: solo el backend lo hace, en el `8000`.

El frontend (`alecktourfrondend/`) está pensado para desplegarse directo en **Vercel**, no con Docker — por eso `docker-compose.prod.yml` no incluye ningún servicio de frontend, solo backend + su base de datos + caché. El repo también trae un `Dockerfile.prod` de frontend por si en algún momento prefieres auto-alojarlo en vez de usar Vercel (ver Parte 2).

El pipeline de CI (`.github/workflows/ci.yml`) solo valida: lint (ruff + eslint), tests del backend con pytest, y que `docker compose` construya bien. **No despliega nada automáticamente**, ni al servidor ni a Vercel — el despliegue es un paso manual (o lo conectas tú a Vercel/tu propio CI, eso ya es aparte).

---

## El hueco real entre CI y CD

Esto es distinto de "el CI no despliega nada" (arriba) — es sobre qué pasa cuando el CI **falla**.

Si usas Vercel (frontend) y/o Render (backend) conectados directo a GitHub (que es justo lo que recomiendan Parte 1/Parte 2 y `despliegue-produccion-servicios-gestionados.md`), cada uno tiene su propia integración de Git que redespliega en cada `git push` a `main` **sin esperar a que termine `.github/workflows/ci.yml`** — son dos sistemas completamente independientes. En la práctica: puedes hacer push de un cambio que rompe el lint o un test, ver el workflow de GitHub Actions en rojo unos minutos después, y para entonces Vercel/Render ya sirvieron ese mismo código roto en producción. El CI de este repo hoy es solo informativo, no es un gate real.

Dos formas de cerrar esto, de más simple a más completa:

1. **Branch protection en GitHub (rápido, pero con una condición):** en Settings → Branches → agregar una regla para `main` que exija "Require status checks to pass" con los jobs `lint`, `test` y `docker`. Esto bloquea que un Pull Request se pueda mezclar a `main` si el CI no pasó. **La condición:** esta protección solo aplica a Pull Requests — un `git push` directo a `main` (el flujo que este mismo repo usa hoy, al ser un proyecto de una sola persona) la salta por completo, salvo que en la misma regla también actives "Restrict who can push to matching branches" y trabajes siempre por rama+PR en vez de empujar directo a `main`.

2. **Deploy Hooks gatillados desde el propio CI (más trabajo, pero cierra el hueco de verdad incluso empujando directo a `main`):** tanto Render como Vercel ofrecen una "Deploy Hook" — una URL única que, al recibir un `POST`, dispara un deploy — y ambos permiten desactivar el auto-deploy de su integración de Git nativa. La idea: desactivar el auto-deploy en cada plataforma, guardar sus URLs de Deploy Hook como secrets de GitHub (`RENDER_DEPLOY_HOOK_URL`, `VERCEL_DEPLOY_HOOK_URL`), y agregar un job `deploy` nuevo a `ci.yml` con `needs: [lint, test, docker]` y `if: github.ref == 'refs/heads/main'` que simplemente haga:
   ```yaml
   - run: curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
     env:
       RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
   - run: curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"
     env:
       VERCEL_DEPLOY_HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
   ```
   Así, el propio `needs` de GitHub Actions garantiza que ese `curl` nunca corre si `lint`/`test`/`docker` fallaron antes — el despliegue queda condicionado al CI sin depender de que nadie use Pull Requests.

No se implementó ninguna de las dos en este repo todavía: la opción 1 es una configuración de GitHub (Settings del repo, no código), y la opción 2 necesita las URLs reales de Deploy Hook de tus propias cuentas de Render/Vercel — ambas cosas solo las puedes crear tú desde los dashboards correspondientes. Si quieres, en la próxima sesión puedo dejar el job `deploy` de la opción 2 ya escrito en `ci.yml`, listo para que solo pegues las dos URLs como secrets.

---

## Parte 1 — Backend en un VPS con Docker

### Requisitos del servidor

- Un VPS con Docker y Docker Compose instalados (Ubuntu 22.04/24.04 es lo más simple; sirve cualquier proveedor — DigitalOcean, Hetzner, un EC2, etc., nada en el repo está atado a uno en particular).
- Un dominio o subdominio apuntando a la IP del servidor si quieres HTTPS con nombre real (ej. `api.tudominio.com`). Puedes desplegar igual sin dominio todavía y usar la IP mientras tanto.

### 1. Clonar el repo en el servidor

```bash
git clone https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker.git
cd proyectoalectoursDocker
```

### 2. Completar `backend/.env` con valores REALES de producción

Nunca copies el `.env` de desarrollo tal cual — cámbialos todos:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

- `SECRET_KEY`: uno propio y fuerte, nunca el de desarrollo:
  ```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(48))"
  ```
- `DATABASE_URL`: apuntando al Postgres de este mismo compose (host `postgres`, mismo usuario/clave/DB que definas en el paso 3) — nunca `admin`/`admin123`.
- `REDIS_URL=redis://redis:6379/0` — el host `redis` es el nombre del servicio en `docker-compose.prod.yml`, no lo cambies.
- `MAIL_*`: credenciales de Brevo, el proveedor SMTP real que usa este proyecto (Mailpit no existe en este compose, solo en desarrollo) — servidor `smtp-relay.brevo.com`, puerto `587`, usuario tipo `xxxxx@smtp-brevo.com` y como contraseña tu API key de Brevo (empieza con `xkeysib-`). Pasos completos para crear el remitente y encontrar estas credenciales en `backend/.env.example`. Sin esto, los correos de verificación/reset de contraseña no salen.
- `FRONTEND_URL` y `CORS_ORIGINS`: el dominio real donde publiques el frontend (Vercel u otro, ver Parte 2) — ej. `https://tudominio.com`. Sin esto los links de esos correos siguen apuntando a `localhost` y el navegador bloquea las llamadas por CORS.
- `CLOUDINARY_URL` (opcional): si no la defines, las fotos se guardan en disco local dentro del volumen `backend_uploads_prod` (ver más abajo).
- `SENTRY_DSN` (opcional): déjalo vacío si no vas a usar monitoreo de errores todavía.

### 3. Definir las credenciales de Postgres

`docker-compose.prod.yml` las exige por variable de entorno y no trae ningún valor por defecto (a propósito, para no repetir el `admin`/`admin123` hardcodeado del compose de desarrollo):

```bash
export POSTGRES_DB=alektours_db
export POSTGRES_USER=alektours_prod
export POSTGRES_PASSWORD=<clave real, distinta a la de desarrollo>
```

O ponlas en un archivo `.env.prod` en la raíz del repo (más cómodo para no perderlas al cerrar la terminal) y arranca con `--env-file .env.prod` en el paso 4. Importante: este usuario/clave debe ser el mismo que pusiste en `DATABASE_URL` dentro de `backend/.env` — son la misma base vista desde dos archivos distintos.

### 4. Levantar los servicios

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Las migraciones de Alembic corren solas al arrancar el contenedor del backend — no hace falta ejecutar `alembic upgrade head` a mano.

### 5. Verificar que quedó arriba

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
```

### 6. Poner HTTPS delante del backend

El compose deja el backend en el puerto 8000 sin TLS a propósito — se espera un reverse proxy delante. La forma más simple es Caddy (TLS automático con Let's Encrypt, sin tocar certificados a mano):

```bash
sudo apt install -y caddy

sudo tee /etc/caddy/Caddyfile << 'EOF'
api.tudominio.com {
    reverse_proxy localhost:8000
}
EOF

sudo systemctl restart caddy
```

`https://api.tudominio.com` queda entonces apuntando al backend con certificado válido — ese es el dominio que va en `VITE_API_BASE_URL` (frontend, Parte 2) y el que ya pusiste en `CORS_ORIGINS`/`FRONTEND_URL` arriba.

### Qué se conserva entre despliegues

Dos volúmenes con nombre (no bind-mounts), sobreviven a un `up -d --build --force-recreate`:

- `postgres_data_prod` — los datos de la base de datos.
- `backend_uploads_prod` — todo lo que la app guarda en `app/static/uploads` en tiempo de ejecución (fotos de perfil, comprobantes de pago, imágenes de banners).

Solo se pierden con `docker compose down -v` (el `-v` borra volúmenes) — evita ese flag salvo que quieras borrar todo a propósito.

### Al cambiar el `.env` de un contenedor ya corriendo

Docker solo lee `env_file:` al **crear** el contenedor, no al reiniciarlo. Si cambias cualquier variable en `backend/.env` más adelante (rotar `SECRET_KEY`, un `MAIL_PASSWORD` nuevo, etc.), un `restart` no la recoge — hay que recrear el contenedor:

```bash
docker compose -f docker-compose.prod.yml up -d --build --force-recreate backend
```

### Actualizar a una versión nueva

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Docker reconstruye solo la imagen del backend (Postgres/Redis quedan igual si no cambiaron), y las migraciones nuevas de Alembic corren solas al reiniciar el contenedor.

---

## Parte 2 — Frontend

### Opción recomendada: Vercel

Es la que ya asume el propio repo.

1. En vercel.com → "Add New Project" → importa `Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker`.
2. En "Root Directory" pon `alecktourfrondend` (el frontend vive en ese subdirectorio, no en la raíz del repo).
3. Framework preset: Vite (Vercel normalmente lo detecta solo).
4. En "Environment Variables" agrega:
   ```
   VITE_API_BASE_URL=https://api.tudominio.com
   ```
   el mismo dominio donde dejaste el backend corriendo en la Parte 1. Sin esta variable, el build usa `http://localhost:8000` por defecto, que en producción no sirve de nada.
5. Deploy. Vercel te da un dominio `algo.vercel.app` gratis; puedes agregar tu propio dominio después desde Project Settings → Domains.

Cada `git push` a `main` después de esto, Vercel lo vuelve a desplegar solo — eso lo configura Vercel por su cuenta, no depende de nada en este repo.

### Alternativa: auto-alojar el frontend con Docker

El repo también trae `alecktourfrondend/Dockerfile.prod` (build con Node 22 + Vite, servido después por Nginx 1.27) y `alecktourfrondend/nginx.conf`, por si prefieres no usar Vercel:

```bash
cd alecktourfrondend
docker build -f Dockerfile.prod \
  --build-arg VITE_API_BASE_URL=https://api.tudominio.com \
  -t alectours-frontend .
docker run -d --name alectours_frontend -p 80:80 --restart unless-stopped alectours-frontend
```

`nginx.conf` solo sirve los archivos estáticos del build y maneja el ruteo de React Router (`try_files ... /index.html`) — no hace de proxy hacia el backend, así que el navegador sigue llamando directo a `https://api.tudominio.com` (por eso `CORS_ORIGINS` en el backend importa tanto). Necesitarías tu propio Caddy/Nginx con TLS delante de este contenedor también, igual que en la Parte 1.

---

## Resumen de lo que falta decidir de tu lado

- Un dominio (o subdominio) real para el backend, y otro para el frontend si no vas a usar el gratuito de Vercel.
- Proveedor SMTP para `MAIL_*`: ya resuelto con Brevo (ver Parte 1, paso 2) — solo falta que crees tu propia cuenta y tu propio remitente verificado, salvo que prefieras otro proveedor.
- Si vas a usar Cloudinary para las fotos o dejarlas en el volumen `backend_uploads_prod` (ambas opciones ya están soportadas por el código, es solo definir o no `CLOUDINARY_URL`).
- Elegir el VPS — cualquiera con Docker sirve, nada en el repo está atado a un proveedor específico.
