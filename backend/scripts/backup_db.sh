#!/usr/bin/env bash
set -euo pipefail

# backup_db.sh — Respaldo de la base de datos de AlekTours (Fase 1 del plan
# de mejora: "Base de datos: sin estrategia de backup" — TODO abierto en
# .github/project_tasks.md, nunca implementado hasta ahora).
#
# Por defecto asume el docker-compose local de este repo (docker-compose.yml):
# contenedor "postgres_db", base "alektours_db", usuario "admin". Para un
# servidor real de producción, sobreescribe las variables de entorno de
# abajo antes de ejecutar el script — este proyecto todavía no tiene un
# servidor de producción con credenciales reales configuradas, así que no
# se puede fijar aquí un valor por defecto que sea cierto para ese entorno.
#
# Uso:
#   ./backup_db.sh
#   BACKUP_DIR=/otra/ruta RETENTION_DIAS=30 ./backup_db.sh
#
# Requiere: el contenedor de Docker corriendo (camino de desarrollo), o el
# cliente "pg_dump" instalado en el host + variables estándar de libpq
# (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE) o DATABASE_URL (camino
# de un servidor real sin Docker).

DB_CONTAINER="${DB_CONTAINER:-postgres_db}"
POSTGRES_USER="${POSTGRES_USER:-admin}"
POSTGRES_DB="${POSTGRES_DB:-alektours_db}"
BACKUP_DIR="${BACKUP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups}"
RETENTION_DIAS="${RETENTION_DIAS:-14}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d_%H%M%S)"
archivo="$BACKUP_DIR/alektours_${timestamp}.sql.gz"

echo "Respaldando '$POSTGRES_DB' -> $archivo"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$DB_CONTAINER"; then
    # Camino Docker (desarrollo local con docker-compose)
    docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$archivo"
elif command -v pg_dump >/dev/null 2>&1; then
    # Camino directo: pg_dump instalado en el mismo host que ejecuta este
    # script, contra DATABASE_URL o las variables PGHOST/PGUSER/etc.
    pg_dump "${DATABASE_URL:-$POSTGRES_DB}" | gzip > "$archivo"
else
    echo "ERROR: no se encontró el contenedor '$DB_CONTAINER' corriendo ni el comando 'pg_dump' en este host." >&2
    echo "Define DB_CONTAINER (si usas Docker) o instala postgresql-client y configura PGHOST/PGUSER/PGPASSWORD/PGDATABASE (o DATABASE_URL)." >&2
    exit 1
fi

# Verificación mínima: que el archivo exista, no esté vacío y sea un gzip
# válido — para no quedarnos con un "respaldo" corrupto sin darnos cuenta.
if [ ! -s "$archivo" ]; then
    echo "ERROR: el respaldo quedó vacío. Revisa las credenciales/conexión." >&2
    rm -f "$archivo"
    exit 1
fi

if ! gzip -t "$archivo"; then
    echo "ERROR: el archivo de respaldo está corrupto." >&2
    exit 1
fi

echo "Respaldo OK ($(du -h "$archivo" | cut -f1))"

# Retención: borra respaldos LOCALES más viejos que RETENTION_DIAS días.
# Esto no reemplaza una copia externa real (a otro disco, servidor o
# almacenamiento en la nube) — solo evita que este directorio crezca sin
# límite. La copia fuera de esta máquina es responsabilidad de quien
# programe la ejecución de este script (cron, systemd timer, el backup
# gestionado del proveedor de hosting, etc. — ver docs/referencia-tecnica/
# backups-base-datos.md).
find "$BACKUP_DIR" -name 'alektours_*.sql.gz' -mtime "+${RETENTION_DIAS}" -print -delete

echo "Listo."
