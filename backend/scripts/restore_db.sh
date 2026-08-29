#!/usr/bin/env bash
set -euo pipefail

# restore_db.sh — Restaura un respaldo generado por backup_db.sh.
#
# ADVERTENCIA: esto SOBRESCRIBE por completo la base de datos de destino.
# Úsalo solo si sabes exactamente qué base vas a reemplazar.
#
# Uso:
#   ./restore_db.sh backend/backups/alektours_20260829_120000.sql.gz --si

DB_CONTAINER="${DB_CONTAINER:-postgres_db}"
POSTGRES_USER="${POSTGRES_USER:-admin}"
POSTGRES_DB="${POSTGRES_DB:-alektours_db}"

archivo="${1:-}"
confirmacion="${2:-}"

if [ -z "$archivo" ] || [ ! -f "$archivo" ]; then
    echo "Uso: $0 <archivo_de_respaldo.sql.gz> --si" >&2
    echo "El archivo indicado no existe: '${archivo:-<vacío>}'" >&2
    exit 1
fi

if [ "$confirmacion" != "--si" ]; then
    echo "Esto va a SOBRESCRIBIR por completo la base '$POSTGRES_DB'. Todo lo que" >&2
    echo "tenga ahora mismo se pierde y queda reemplazado por el contenido de:" >&2
    echo "  $archivo" >&2
    echo >&2
    echo "Si estás seguro, vuelve a ejecutar agregando '--si' al final:" >&2
    echo "  $0 \"$archivo\" --si" >&2
    exit 1
fi

echo "Restaurando '$archivo' -> '$POSTGRES_DB'..."

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$DB_CONTAINER"; then
    gunzip -c "$archivo" | docker exec -i "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
elif command -v psql >/dev/null 2>&1; then
    gunzip -c "$archivo" | psql "${DATABASE_URL:-$POSTGRES_DB}"
else
    echo "ERROR: no se encontró el contenedor '$DB_CONTAINER' corriendo ni el comando 'psql' en este host." >&2
    exit 1
fi

echo "Restauración completada."
