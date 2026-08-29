# Backups de la base de datos

<!--
  ¿Qué? Estrategia de respaldo/restauración de PostgreSQL para AlekTours.
  ¿Para qué? El TODO "Implementar backups" en .github/project_tasks.md
             seguía sin resolver — no existía ningún mecanismo de respaldo,
             automático ni manual. Fase 1 del plan de mejora
             (docs/referencia-tecnica/plan-mejora-2026-08-28.md).
  ¿Impacto? Sin esto, un error humano, un bug o un fallo del contenedor de
             Postgres podía borrar datos de clientes/reservas/pagos sin
             ninguna forma de recuperarlos.
-->

## Qué hay

Dos scripts en `backend/scripts/`:

- **`backup_db.sh`** — genera un dump comprimido (`.sql.gz`) de la base de
  datos con `pg_dump`, lo guarda en `backend/backups/` (ignorado por git) y
  borra los respaldos locales más viejos que `RETENTION_DIAS` (14 por
  defecto — ajústalo con la variable de entorno según cuánto espacio y
  cuánta ventana de recuperación necesites).
- **`restore_db.sh`** — restaura un `.sql.gz` generado por `backup_db.sh`.
  Sobrescribe la base de destino por completo, así que exige el flag
  `--si` explícito para ejecutarse; sin él solo muestra la advertencia y
  no toca nada.

Ambos funcionan en dos modos, detectados automáticamente:

1. **Docker (desarrollo local)** — si el contenedor `postgres_db` de
   `docker-compose.yml` está corriendo, usan `docker exec` contra él.
2. **Directo** — si no hay contenedor pero `pg_dump`/`psql` están
   instalados en el host, se conectan usando `DATABASE_URL` o las
   variables estándar de libpq (`PGHOST`, `PGPORT`, `PGUSER`,
   `PGPASSWORD`, `PGDATABASE`).

## Uso manual

```bash
cd backend
./scripts/backup_db.sh
# -> backend/backups/alektours_20260829_120000.sql.gz

./scripts/restore_db.sh backend/backups/alektours_20260829_120000.sql.gz --si
```

Variables de entorno que puedes sobreescribir (todas opcionales, con
valores por defecto tomados del `docker-compose.yml` de este repo):

| Variable          | Por defecto      | Uso                                             |
| ----------------- | ---------------- | ------------------------------------------------ |
| `DB_CONTAINER`     | `postgres_db`     | Nombre del contenedor de Postgres                 |
| `POSTGRES_USER`    | `admin`           | Usuario de conexión                               |
| `POSTGRES_DB`      | `alektours_db`    | Base de datos a respaldar/restaurar               |
| `BACKUP_DIR`       | `backend/backups` | Carpeta donde se guardan los `.sql.gz`            |
| `RETENTION_DIAS`   | `14`              | Antigüedad máxima de respaldos locales            |
| `DATABASE_URL`     | *(sin valor)*     | Cadena de conexión completa (camino sin Docker)   |

## Automatizarlo

Este proyecto **no tiene todavía un servidor de producción real** con
Postgres corriendo fuera de Docker Compose, así que no podemos fijar aquí
un cron o un servicio concreto sin inventar una infraestructura que no
existe. Lo que sí se puede decir con certeza:

- **No se automatizó con un workflow de GitHub Actions.** Un runner de
  GitHub no tiene por qué tener acceso de red a la base de datos real (y
  exponer Postgres a internet solo para que CI pueda alcanzarlo sería un
  riesgo de seguridad nuevo, no una mejora). El lugar correcto para
  programar `backup_db.sh` es un cron/systemd timer en el mismo servidor
  donde corre Postgres, o el backup gestionado que ofrezca el proveedor de
  hosting elegido (por ejemplo, si el día de mañana la base se aloja en un
  servicio gestionado tipo RDS/Cloud SQL/Railway/Render, casi todos
  incluyen backups automáticos propios — conviene evaluar si eso ya cubre
  la necesidad antes de programar este script encima).
- Mientras el proyecto vive solo en `docker-compose` local, la forma más
  simple de probar la automatización es un cron del sistema operativo
  anfitrión, por ejemplo (backup diario a la 1 a.m.):

  ```cron
  0 1 * * * cd /ruta/al/proyecto/backend && ./scripts/backup_db.sh >> backups/backup.log 2>&1
  ```

- Cuando exista un servidor real, hay que decidir además **dónde vive la
  copia fuera de esa misma máquina** (S3/Backblaze/otro servidor/etc.) —
  el script de retención de este repo solo limpia el directorio local, no
  sustituye una copia externa.

## Qué falta (fuera del alcance de este cambio)

- Verificación automática de que un respaldo restaura correctamente (hoy
  solo se valida que el `.gz` no esté corrupto, no que su contenido sea
  restaurable sin errores).
- Cifrado del archivo de respaldo en reposo, si llega a contener datos
  reales de clientes.
