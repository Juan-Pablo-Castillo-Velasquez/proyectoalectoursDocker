# ---------- Base stage: dependencias comunes ----------
FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# uv en vez de pip: mismo requirements.txt, instalación mucho más rápida.
# --system instala en el Python global del contenedor (no crea un venv),
# así uvicorn/alembic se siguen resolviendo igual que antes en el PATH.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/bin/sh", "-c", "sed -i 's/\\r$//' /app/entrypoint.sh && exec /bin/sh /app/entrypoint.sh \"$@\"", "--"]

# ---------- Dev stage: con --reload, para docker-compose local ----------
# Se queda como root a propósito: el bind-mount de ./backend:/app en
# docker-compose.yml necesita que el usuario del contenedor pueda escribir
# donde sea que el host haya creado los archivos (uid del usuario del
# desarrollador, no el uid del contenedor) — un USER no-root acá rompería
# el hot-reload por permisos en la mayoría de setups locales.
FROM base AS dev

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------- Prod stage: sin --reload, con workers, usuario no-root ----------
FROM base AS prod

# Ejecutar como root dentro del contenedor no aporta nada aquí (no hay
# bind-mount que lo necesite) y es una superficie de ataque innecesaria si
# alguien lograra ejecutar código dentro del proceso de la API.
RUN groupadd --system app && useradd --system --gid app --no-create-home app \
    && chown -R app:app /app
USER app

# Usa el /health real (consulta la base de datos) agregado en app/main.py —
# nunca un endpoint inventado solo para pasar el check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health', timeout=4).status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
