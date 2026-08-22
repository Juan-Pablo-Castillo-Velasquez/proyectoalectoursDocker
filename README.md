# AlekTours

## Plataforma de gestión de viajes, hoteles y reservas

AlekTours es una plataforma web orientada a la gestión integral de servicios turísticos, reservas de hoteles, habitaciones, paquetes de viaje, clientes, empleados y pagos.

El proyecto está construido bajo una arquitectura desacoplada entre frontend y backend, utilizando una API REST desarrollada con FastAPI, PostgreSQL como sistema de gestión de base de datos y una aplicación web moderna para la interacción con los usuarios.

El entorno completo puede ejecutarse mediante Docker Compose, facilitando la configuración, desarrollo y despliegue del sistema.

---

## Estado del proyecto

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-2563EB?style=for-the-badge" alt="Estado del proyecto">
  <img src="https://img.shields.io/badge/Version-Development-7C3AED?style=for-the-badge" alt="Versión">
  <img src="https://img.shields.io/badge/License-MIT-059669?style=for-the-badge" alt="Licencia">
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=flat-square" alt="Último commit">
  <img src="https://img.shields.io/github/issues/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=flat-square" alt="Issues">
  <img src="https://img.shields.io/github/forks/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=flat-square" alt="Forks">
  <img src="https://img.shields.io/github/stars/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker?style=flat-square" alt="Stars">
</p>

---

## Tecnologías

### Backend

<p>
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115.x-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?style=flat-square" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Pydantic-2.x-E92063?style=flat-square" alt="Pydantic">
  <img src="https://img.shields.io/badge/Alembic-Migrations-1F2937?style=flat-square" alt="Alembic">
  <img src="https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square" alt="JWT">
</p>

### Frontend

<p>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7+-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
</p>

### Infraestructura

<p>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Mailpit-Email%20Testing-6B7280?style=flat-square" alt="Mailpit">
  <img src="https://img.shields.io/badge/pgAdmin-Database%20Management-336791?style=flat-square" alt="pgAdmin">
</p>

---

## Arquitectura

AlekTours utiliza una arquitectura separada por responsabilidades:

```text
┌──────────────────────────────────────────────────────────────┐
│                         AlekTours                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     Frontend Web                             │
│                 React + TypeScript                           │
│                                                              │
│                           │                                  │
│                           │ HTTP / REST                       │
│                           ▼                                  │
│                                                              │
│                     Backend API                              │
│                     FastAPI                                  │
│                                                              │
│          ┌────────────────┼─────────────────┐                │
│          │                │                 │                │
│          ▼                ▼                 ▼                │
│      Routes           Services         Repositories          │
│          │                │                 │                │
│          └────────────────┼─────────────────┘                │
│                           │                                  │
│                           ▼                                  │
│                     SQLAlchemy                               │
│                           │                                  │
│                           ▼                                  │
│                      PostgreSQL                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Docker Compose                                               │
│                                                              │
│ PostgreSQL | Backend | Frontend | pgAdmin | Mailpit          │
└──────────────────────────────────────────────────────────────┘
```

La separación entre rutas, servicios, repositorios, modelos y esquemas permite mantener la lógica de negocio aislada de la infraestructura y facilita la evolución del proyecto.

---

## Características principales

### Gestión de usuarios

* Registro y autenticación de usuarios.
* Autenticación basada en JWT.
* Hash seguro de contraseñas.
* Access tokens.
* Refresh tokens.
* Gestión de perfiles.
* Control de acceso según roles.

### Gestión hotelera

* Administración de hoteles.
* Gestión de habitaciones.
* Información de disponibilidad.
* Gestión de servicios.
* Organización de información turística.

### Reservas

* Creación de reservas.
* Consulta de reservas.
* Gestión del estado de las reservas.
* Confirmaciones.
* Cancelaciones.
* Integración con notificaciones por correo.

### Paquetes turísticos

* Creación y gestión de paquetes.
* Asociación de servicios.
* Organización de ofertas turísticas.
* Gestión de información relacionada con viajes.

### Pagos

* Estructura preparada para la gestión de pagos.
* Asociación de pagos con reservas.
* Seguimiento del estado de las transacciones.

### Sistema de correo

El backend incorpora servicios para:

* Correos de bienvenida.
* Verificación de cuentas.
* Recuperación de contraseña.
* Confirmación de reservas.
* Cancelación de reservas.
* Correos transaccionales.

Durante el desarrollo se utiliza Mailpit para interceptar y visualizar correos sin necesidad de utilizar un servidor SMTP real.

---

## Estructura del proyecto

```text
proyectoalectoursDocker/
│
├── .github/
│   └── workflows/
│
├── alecktourfrondend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── mail.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
│
├── docs/
│   └── documentación técnica
│
├── db_schema.sql
├── docker-compose.yml
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENCE
└── README.md
```

---

## Responsabilidad de cada capa

### `routes`

Contiene los endpoints HTTP de la API.

Su responsabilidad principal es:

* Recibir solicitudes.
* Validar parámetros.
* Gestionar respuestas HTTP.
* Delegar la lógica de negocio.

Las rutas no deberían contener lógica de negocio compleja.

### `services`

Contiene la lógica de negocio de la aplicación.

Aquí deben implementarse operaciones como:

* Crear reservas.
* Validar disponibilidad.
* Procesar operaciones relacionadas con usuarios.
* Gestionar reglas de negocio.
* Coordinar diferentes repositorios.

### `repositories`

Responsable del acceso a los datos.

Esta capa abstrae las operaciones realizadas sobre PostgreSQL mediante SQLAlchemy.

### `models`

Contiene los modelos ORM utilizados para representar las entidades de la base de datos.

### `schemas`

Contiene los modelos Pydantic utilizados para:

* Validación de entrada.
* Serialización.
* Validación de respuestas.
* Contratos de la API.

### `core`

Contiene componentes transversales de la aplicación:

* Configuración.
* Base de datos.
* Seguridad.
* JWT.
* Hashing.
* Correo.

---

## Requisitos

Antes de ejecutar el proyecto se recomienda tener instalado:

* Git
* Docker
* Docker Compose
* Node.js y pnpm para desarrollo local del frontend
* Python 3.x para desarrollo local del backend

Para una ejecución completamente contenerizada, Docker y Docker Compose son suficientes para levantar los servicios definidos en el proyecto.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker.git

cd proyectoalectoursDocker
```

### 2. Configurar las variables de entorno

Crear el archivo:

```text
backend/.env
```

Ejemplo:

```env
DATABASE_URL=postgresql+psycopg://admin:admin123@postgres:5432/alektours_db

SECRET_KEY=change_this_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@alektours.com
MAIL_PORT=1025
MAIL_SERVER=mailpit
MAIL_FROM_NAME=AlekTours
MAIL_STARTTLS=False
MAIL_SSL_TLS=False
```

No se deben almacenar credenciales reales dentro del repositorio.

---

## Ejecución con Docker

La forma recomendada de ejecutar AlekTours durante el desarrollo es mediante Docker Compose.

```bash
docker compose up -d
```

Para comprobar el estado de los servicios:

```bash
docker compose ps
```

Para visualizar los logs:

```bash
docker compose logs -f
```

Para visualizar los logs únicamente del backend:

```bash
docker compose logs -f backend
```

---

## Migraciones de base de datos

Una vez iniciados los contenedores, ejecutar las migraciones:

```bash
docker compose exec backend alembic upgrade head
```

Para comprobar las migraciones:

```bash
docker compose exec backend alembic current
```

Para consultar el historial:

```bash
docker compose exec backend alembic history
```

---

## Servicios disponibles

Una vez levantado el entorno, los principales servicios se encuentran disponibles en:

| Servicio | URL                           | Descripción                  |
| -------- | ----------------------------- | ---------------------------- |
| Backend  | `http://localhost:8000`       | API principal                |
| Swagger  | `http://localhost:8000/docs`  | Documentación interactiva    |
| ReDoc    | `http://localhost:8000/redoc` | Documentación alternativa    |
| pgAdmin  | `http://localhost:5050`       | Administración de PostgreSQL |
| Mailpit  | `http://localhost:8025`       | Visualización de correos     |
| Frontend | Según configuración de Docker | Aplicación web               |

---

## Documentación de la API

AlekTours utiliza OpenAPI mediante FastAPI.

### Swagger UI

```text
http://localhost:8000/docs
```

Desde Swagger es posible:

* Consultar endpoints.
* Visualizar esquemas.
* Ejecutar solicitudes.
* Probar autenticación.
* Revisar respuestas.
* Consultar parámetros.

### ReDoc

```text
http://localhost:8000/redoc
```

---

## Base de datos

AlekTours utiliza PostgreSQL como sistema de gestión de base de datos.

El modelo contempla entidades relacionadas con:

```text
Hoteles
    │
    ├── Habitaciones
    │
    └── Servicios

Clientes
    │
    └── Reservas
            │
            ├── Habitaciones
            ├── Paquetes
            └── Pagos

Empleados
    │
    └── Gestión administrativa
```

Entre las entidades principales se encuentran:

* `hoteles`
* `habitaciones`
* `clientes`
* `empleados`
* `reservas`
* `servicios`
* `paquetes`
* `pagos`

El archivo `db_schema.sql` contiene información relacionada con el esquema de la base de datos.

---

## Seguridad

El proyecto contempla diferentes mecanismos de seguridad:

* Autenticación mediante JWT.
* Hashing de contraseñas.
* Variables sensibles mediante `.env`.
* Separación de configuración y código.
* Control de acceso basado en roles.
* Validación mediante Pydantic.
* Protección de credenciales.
* Configuración separada para desarrollo y producción.

Las credenciales utilizadas durante el desarrollo deben considerarse únicamente de prueba.

Nunca utilizar las credenciales de desarrollo en producción.

Para reportar vulnerabilidades de seguridad, consultar:

```text
SECURITY.md
```

---

## Desarrollo del backend

Para trabajar directamente sobre el backend:

```bash
cd backend
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

Ejecutar FastAPI:

```bash
uvicorn app.main:app --reload
```

La API estará disponible en:

```text
http://localhost:8000
```

---

## Desarrollo del frontend

Entrar al directorio del frontend:

```bash
cd alecktourfrondend
```

Instalar dependencias:

```bash
pnpm install
```

Ejecutar el entorno de desarrollo:

```bash
pnpm dev
```

El puerto utilizado dependerá de la configuración de Vite.

---

## Flujo de desarrollo recomendado

El proyecto sigue una separación clara entre las responsabilidades del sistema.

```text
Cliente
   │
   ▼
Frontend
   │
   ▼
API Route
   │
   ▼
Schema / Validation
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
SQLAlchemy
   │
   ▼
PostgreSQL
```

La lógica de negocio debe mantenerse principalmente dentro de `services`.

Las operaciones de persistencia deben mantenerse dentro de `repositories`.

Los endpoints deben actuar como una capa de entrada y coordinación de la API.

---

## Crear una nueva funcionalidad

Una nueva funcionalidad debería seguir una estructura similar a:

```text
1. Definir modelo
       │
       ▼
2. Crear migración
       │
       ▼
3. Crear schema
       │
       ▼
4. Crear repository
       │
       ▼
5. Implementar service
       │
       ▼
6. Crear route
       │
       ▼
7. Registrar router
       │
       ▼
8. Probar endpoint
       │
       ▼
9. Documentar
```

Esto permite evitar que la lógica de negocio termine directamente dentro de los controladores.

---

## Migraciones

Para crear una nueva migración:

```bash
docker compose exec backend alembic revision --autogenerate -m "descripcion_del_cambio"
```

Revisar siempre la migración generada antes de aplicarla.

Aplicar migraciones:

```bash
docker compose exec backend alembic upgrade head
```

No se recomienda modificar manualmente migraciones que ya hayan sido aplicadas en entornos compartidos.

---

## Detener el proyecto

Para detener los servicios:

```bash
docker compose down
```

Para detener los servicios y eliminar los volúmenes:

```bash
docker compose down -v
```

El segundo comando elimina los datos persistidos de los contenedores asociados.

Utilizarlo únicamente cuando sea necesario reiniciar completamente el entorno de desarrollo.

---

## Solución de problemas

### El backend no inicia

Consultar los logs:

```bash
docker compose logs backend
```

También se puede reiniciar el servicio:

```bash
docker compose restart backend
```

### PostgreSQL no responde

Comprobar el estado:

```bash
docker compose ps
```

Consultar logs:

```bash
docker compose logs postgres
```

Reiniciar PostgreSQL:

```bash
docker compose restart postgres
```

### Las migraciones presentan errores

Consultar el estado:

```bash
docker compose exec backend alembic current
```

Consultar el historial:

```bash
docker compose exec backend alembic history
```

### Reiniciar completamente el entorno

```bash
docker compose down -v
docker compose up -d
docker compose exec backend alembic upgrade head
```

Este procedimiento elimina los volúmenes y, por lo tanto, los datos persistidos en ellos.

---

## Variables de entorno

Las variables principales utilizadas por el backend son:

| Variable                      | Descripción                           |
| ----------------------------- | ------------------------------------- |
| `DATABASE_URL`                | Cadena de conexión a PostgreSQL       |
| `SECRET_KEY`                  | Clave utilizada para JWT              |
| `ALGORITHM`                   | Algoritmo utilizado para JWT          |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tiempo de expiración del access token |
| `MAIL_USERNAME`               | Usuario SMTP                          |
| `MAIL_PASSWORD`               | Credencial SMTP                       |
| `MAIL_FROM`                   | Dirección de correo remitente         |
| `MAIL_PORT`                   | Puerto SMTP                           |
| `MAIL_SERVER`                 | Servidor SMTP                         |
| `MAIL_FROM_NAME`              | Nombre del remitente                  |
| `MAIL_STARTTLS`               | Configuración STARTTLS                |
| `MAIL_SSL_TLS`                | Configuración SSL/TLS                 |

Los valores reales deben mantenerse fuera del control de versiones.

---

## Convenciones de Git

Se recomienda utilizar ramas separadas para cada cambio:

```text
main
│
├── develop
│
├── feature/nueva-funcionalidad
├── fix/error-reservas
├── refactor/estructura-backend
└── docs/actualizar-readme
```

Ejemplo:

```bash
git checkout -b feature/nueva-funcionalidad
```

Realizar los cambios y posteriormente:

```bash
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

---

## Convenciones de commits

Se recomienda utilizar Conventional Commits.

```text
feat: nueva funcionalidad

fix: corrección de errores

refactor: modificación interna sin cambiar comportamiento

docs: actualización de documentación

test: incorporación o modificación de pruebas

chore: tareas de mantenimiento

perf: mejora de rendimiento

style: cambios de formato o estilo
```

Ejemplos:

```bash
git commit -m "feat: agregar gestión de reservas"

git commit -m "fix: corregir validación de habitaciones"

git commit -m "docs: actualizar documentación de instalación"

git commit -m "refactor: separar lógica de reservas del router"
```

---

## Contribución

Las contribuciones son bienvenidas.

Antes de comenzar un cambio:

1. Revisar los Issues existentes.
2. Comprobar si la funcionalidad ya está siendo desarrollada.
3. Crear una rama específica.
4. Mantener los cambios enfocados.
5. Seguir las convenciones del proyecto.
6. Actualizar la documentación cuando sea necesario.
7. Verificar que el proyecto continúe funcionando.
8. Crear un Pull Request describiendo claramente los cambios.

### Crear una rama

```bash
git checkout main
git pull origin main

git checkout -b feature/nombre-de-la-funcionalidad
```

### Realizar cambios

```bash
git add .
git commit -m "feat: descripcion del cambio"
```

### Subir la rama

```bash
git push origin feature/nombre-de-la-funcionalidad
```

### Pull Request

El Pull Request debería incluir:

* Descripción del problema.
* Descripción de la solución.
* Cambios principales.
* Evidencia de pruebas cuando corresponda.
* Cambios en base de datos, si existen.
* Cambios en variables de entorno, si existen.
* Cambios de documentación, si son necesarios.

No realizar cambios directamente sobre `main` salvo que el flujo de trabajo del equipo lo permita explícitamente.

La documentación completa de contribución se encuentra en:

```text
CONTRIBUTING.md
```

---

## Política de seguridad

Las vulnerabilidades de seguridad no deberían publicarse como Issues públicos.

Para reportar problemas de seguridad, consultar:

```text
SECURITY.md
```

No incluir nunca en Issues, Pull Requests o commits:

* Contraseñas.
* Secret keys.
* Tokens.
* Credenciales de bases de datos.
* Credenciales SMTP.
* Archivos `.env`.
* Información privada de usuarios.

---

## Documentación del proyecto

La documentación técnica adicional se encuentra en:

```text
docs/
```

Documentación del backend:

```text
backend/
```

Documentación de seguridad:

```text
SECURITY.md
```

Guía de contribución:

```text
CONTRIBUTING.md
```

Esquema de base de datos:

```text
db_schema.sql
```

---

## Licencia

Este proyecto se distribuye bajo los términos definidos en:

```text
LICENCE
```

---

## Repositorio

Repositorio oficial:

https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker

---

## Aplicación

AlekTours cuenta con una aplicación desplegada para consulta y demostración:

https://proyectoalectours-docker.vercel.app

---

## Equipo

Proyecto desarrollado como una solución integral para la gestión de servicios turísticos, combinando desarrollo frontend, backend, bases de datos, autenticación, infraestructura Docker y documentación técnica.

---

## Roadmap

Las siguientes áreas pueden formar parte de la evolución del proyecto:

* [ ] Ampliación de cobertura de pruebas automatizadas.
* [ ] Mejoras en validación y manejo de errores.
* [ ] Optimización del sistema de reservas.
* [ ] Mejoras en gestión de disponibilidad.
* [ ] Integración de proveedores externos.
* [ ] Mejoras en procesamiento de pagos.
* [ ] Implementación de CI/CD.
* [ ] Mejoras de observabilidad.
* [ ] Optimización del despliegue en producción.
* [ ] Ampliación de documentación técnica.
* [ ] Mejoras de accesibilidad en frontend.
* [ ] Optimización de rendimiento.

---

## Resumen técnico

```text
AlekTours
│
├── Frontend
│   ├── React
│   ├── TypeScript
│   └── Vite
│
├── Backend
│   ├── Python
│   ├── FastAPI
│   ├── Pydantic
│   ├── SQLAlchemy
│   ├── Alembic
│   └── JWT
│
├── Database
│   └── PostgreSQL 16
│
├── Infrastructure
│   ├── Docker
│   └── Docker Compose
│
├── Development Tools
│   ├── pgAdmin
│   └── Mailpit
│
└── Documentation
    ├── README
    ├── CONTRIBUTING
    ├── SECURITY
    ├── docs/
    └── db_schema.sql
```

---

## Mantenimiento

La documentación debe actualizarse junto con los cambios relevantes del sistema.

Cuando una modificación afecte alguno de los siguientes elementos, también debe revisarse este README:

* Arquitectura.
* Instalación.
* Variables de entorno.
* Puertos.
* Servicios Docker.
* Base de datos.
* Dependencias principales.
* Comandos de desarrollo.
* Seguridad.
* Flujo de contribución.
* Estructura del proyecto.

**AlekTours — Plataforma de gestión turística y reservas.**
