# Despliegue en producción

Fase 2 del plan de mejora (`plan-mejora-2026-08-28.md`): "Usar el stage `prod` del Dockerfile en el despliegue real".

## Qué cambia frente a desarrollo local

`docker-compose.yml` (raíz del proyecto) es solo para desarrollo local: usa `target: dev` del `backend/Dockerfile` (hot-reload con `--reload`, corre como root porque el bind-mount `./backend:/app` lo necesita) e incluye Mailpit y pgAdmin, herramientas de desarrollo que no deben quedar expuestas en un servidor real.

Para un despliegue real se usa `docker-compose.prod.yml` (mismo repo, raíz del proyecto), que apunta al stage `prod` del mismo Dockerfile: sin `--reload`, con `--workers 4`, corriendo como usuario no-root, con el healthcheck real contra `/health`, y sin bind-mount del código (va horneado en la imagen). No incluye Mailpit ni pgAdmin, y Postgres/Redis no exponen puerto al host — solo el backend lo hace.

El frontend (`alecktourfrondend/`) **no** se despliega con Docker: se despliega directo en Vercel, como ya está hoy. `docker-compose.prod.yml` es solo para el backend + su base de datos + caché, en el servidor donde corra la API real (un VPS o similar).

## Pasos

1. En el servidor de producción, completa `backend/.env` con los valores reales (nunca copies el `.env` de desarrollo):
   - `SECRET_KEY`: uno propio y fuerte — `python -c "import secrets; print(secrets.token_urlsafe(48))"` (nunca el mismo usado en desarrollo).
   - `DATABASE_URL`: apuntando al Postgres de este mismo compose (host `postgres`, mismo usuario/clave/DB que definas en el paso 2).
   - `MAIL_*`: credenciales de un proveedor SMTP real (Gmail, SendGrid, SES, etc. — ver comentarios en `backend/.env.example`). Mailpit no existe en este compose.
   - `FRONTEND_URL` y `CORS_ORIGINS`: el dominio real del frontend en Vercel (ej. `https://alectours.vercel.app`). Sin esto, los links de verificación/reset de contraseña en los correos siguen apuntando a `localhost`.

2. Define las credenciales de Postgres como variables de entorno (no tienen valor por defecto a propósito, para no repetir el `admin`/`admin123` hardcodeado del compose de desarrollo):

   ```
   export POSTGRES_DB=alektours_db
   export POSTGRES_USER=alektours_prod
   export POSTGRES_PASSWORD=<clave real, no la de desarrollo>
   ```

   O ponlas en un archivo `.env.prod` y arranca con `docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`.

3. Levanta los servicios:

   ```
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. Verifica que las migraciones corrieron y el healthcheck pasa:

   ```
   docker compose -f docker-compose.prod.yml logs -f backend
   docker compose -f docker-compose.prod.yml ps
   ```

## Al actualizar el `.env` de un contenedor ya corriendo

Docker solo lee `env_file:` al **crear** el contenedor, no al reiniciarlo. Si cambias cualquier variable en `backend/.env` (una rotación de `SECRET_KEY`, un nuevo `MAIL_PASSWORD`, etc.), un `restart` no la recoge — hay que recrear el contenedor:

```
docker compose -f docker-compose.prod.yml up -d --build --force-recreate backend
```

## Ver también

- `docs/referencia-tecnica/backups-base-datos.md` — backups automáticos de la base de datos real.
- `docs/referencia-tecnica/plan-mejora-2026-08-28.md` — plan completo, Fase 2.
