<p align="center">
  <img
    src="https://ghrb.waren.build/banner?header=AlekTours&subheader=Agencia%20de%20viajes%20%7C%20Hoteles%20%7C%20Reservas%20%7C%20Experiencias&bg=1A0A10-7A173F&color=FFFFFF&subheadercolor=F3B3C9&headerfont=Playfair%20Display&subheaderfont=Inter"
    alt="AlekTours"
    width="100%"
  />
</p>

<p align="center">
  <a href="https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker">
    <img src="https://img.shields.io/github/stars/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=for-the-badge&label=Stars&color=9E315C" alt="GitHub Stars">
  </a>
  <a href="https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker/issues">
    <img src="https://img.shields.io/github/issues/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=for-the-badge&label=Issues&color=B83B68" alt="GitHub Issues">
  </a>
  <a href="https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker">
    <img src="https://img.shields.io/github/last-commit/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=for-the-badge&label=Last%20Commit&color=6E1738" alt="Last Commit">
  </a>
</p>

<p align="center">
  <strong>Una plataforma moderna para descubrir destinos, reservar hoteles y gestionar experiencias de viaje.</strong>
</p>

<p align="center">
  <a href="#características">Características</a>
  •
  <a href="#arquitectura">Arquitectura</a>
  •
  <a href="#instalación">Instalación</a>
  •
  <a href="#contribución">Contribución</a>
</p>

---

## AlekTours

AlekTours es una plataforma web orientada a la gestión integral de servicios turísticos, diseñada para centralizar hoteles, habitaciones, reservas, paquetes de viaje, usuarios y procesos relacionados con la experiencia del viajero.

El proyecto combina una interfaz moderna con una arquitectura backend desacoplada, una API REST y una infraestructura completamente contenerizada mediante Docker.

### Stack tecnológico

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=111827" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

## Características

* Gestión de usuarios y autenticación.
* Gestión de hoteles y habitaciones.
* Sistema de reservas.
* Gestión de paquetes turísticos.
* Gestión de servicios.
* Procesamiento y seguimiento de pagos.
* Notificaciones por correo electrónico.
* API REST documentada con OpenAPI.
* Migraciones mediante Alembic.
* PostgreSQL como sistema de persistencia.
* Entorno de desarrollo mediante Docker Compose.
* Herramientas de administración mediante pgAdmin.
* Mailpit para pruebas de correo electrónico.

---

## Arquitectura

```text
                        ALEKTOURS
                           │
                           │
                 ┌─────────▼─────────┐
                 │      Frontend     │
                 │ React + TypeScript│
                 │       + Vite      │
                 └─────────┬─────────┘
                           │
                         REST
                           │
                 ┌─────────▼─────────┐
                 │      Backend      │
                 │      FastAPI      │
                 └─────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          Routes       Services    Repositories
                           │            │
                           └─────┬──────┘
                                 │
                           SQLAlchemy
                                 │
                                 ▼
                           PostgreSQL
```

La arquitectura separa la presentación, la lógica de negocio y el acceso a datos, permitiendo mantener el código organizado y facilitar futuras ampliaciones.

---

## Estructura

```text
proyectoalectoursDocker/
│
├── .github/
│   └── workflows/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── Dockerfile
│   └── requirements.txt
│
├── alecktourfrondend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
├── db_schema.sql
├── docker-compose.yml
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENCE
└── README.md
```

---

## Instalación

```bash
git clone https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker.git

cd proyectoalectoursDocker
```

Configurar las variables de entorno del backend y posteriormente iniciar los servicios:

```bash
docker compose up -d
```

Comprobar los contenedores:

```bash
docker compose ps
```

Ejecutar las migraciones:

```bash
docker compose exec backend alembic upgrade head
```

---

## Desarrollo

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

```bash
cd alecktourfrondend

pnpm install

pnpm dev
```

---

## API

La API está construida con FastAPI y proporciona documentación OpenAPI automáticamente.

### Swagger

```text
http://localhost:8000/docs
```

### ReDoc

```text
http://localhost:8000/redoc
```

---

## Docker

El entorno de desarrollo utiliza Docker Compose para coordinar los diferentes servicios de la aplicación.

```bash
docker compose up -d
```

Detener los servicios:

```bash
docker compose down
```

Visualizar logs:

```bash
docker compose logs -f
```

Reiniciar completamente el entorno:

```bash
docker compose down -v
docker compose up -d
```

---

## Contribución

Las contribuciones son bienvenidas.

Antes de realizar cambios:

1. Crear una rama específica.
2. Mantener cada cambio enfocado en una funcionalidad.
3. Seguir las convenciones existentes.
4. Probar los cambios antes de crear el Pull Request.
5. Actualizar la documentación cuando sea necesario.

Ejemplo:

```bash
git checkout -b feature/nueva-funcionalidad

git add .

git commit -m "feat: agregar nueva funcionalidad"

git push origin feature/nueva-funcionalidad
```

Consulta la guía completa en [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Seguridad

Las vulnerabilidades de seguridad no deben publicarse como Issues públicos.

Para conocer el procedimiento de reporte consulta [`SECURITY.md`](SECURITY.md).

Nunca subir al repositorio:

```text
.env
Credenciales
Tokens
Secret Keys
Contraseñas
Credenciales SMTP
Credenciales de PostgreSQL
```

---

## Documentación

La documentación adicional del proyecto se encuentra disponible en:

```text
docs/
```

Otros documentos importantes:

* [`CONTRIBUTING.md`](CONTRIBUTING.md)
* [`SECURITY.md`](SECURITY.md)
* [`db_schema.sql`](db_schema.sql)

---

## Estado del proyecto

<p align="center">
  <img src="https://img.shields.io/badge/Project-Active-9E315C?style=for-the-badge" alt="Project Status">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge" alt="Backend">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge" alt="Frontend">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge" alt="Database">
  <img src="https://img.shields.io/badge/Infrastructure-Docker-2496ED?style=for-the-badge" alt="Infrastructure">
</p>

---

<p align="center">
  AlekTours
</p>

<p align="center">
  Plataforma de gestión turística y reservas.
</p>
