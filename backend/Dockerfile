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
FROM base AS dev

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------- Prod stage: sin --reload, con workers ----------
FROM base AS prod

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
