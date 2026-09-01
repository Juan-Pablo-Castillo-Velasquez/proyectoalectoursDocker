# Arquitectura del Sistema — AlecTours

> **Proyecto**: AlecTours — Plataforma de gestión turística y reservas
> **Stack**: FastAPI (Python 3.12) + React 18 (TypeScript) + PostgreSQL 16 + Docker Compose

---

## Vista General del Sistema

AlecTours es una plataforma web para la gestión integral de servicios turísticos: hoteles, habitaciones, reservas, paquetes turísticos, servicios, pagos, clientes y empleados. Sigue una **arquitectura desacoplada cliente–servidor** donde frontend y backend se comunican exclusivamente vía HTTP + JSON.

```
┌──────────────────────────────────────────────────────────────────┐
│  CAPA 3 — CLIENTE (Navegador Web)                                │
│                                                                  │
│  React 18 + TypeScript + TailwindCSS 4 + shadcn/ui + MUI        │
│  http://localhost:5173                                           │
│                                                                  │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │   Pages     │  │   Components    │  │  Context / Services  │ │
│  │  (24 vistas)│  │  (~50+ comps)   │  │  (auth, favoritos)   │ │
│  └──────┬──────┘  └────────┬────────┘  └──────────────────────┘ │
│         │                  │                                     │
│         └──────────────────┤                                     │
│                            ▼                                     │
│  ┌───────────────────────────────────┐                           │
│  │   apiFetch() + services/ (fetch)  │  (HTTP + JWT Bearer)     │
│  └───────────────────────────────────┘                           │
└──────────────────────────────────────████████████████████────────┘
                                        ↕ JSON / HTTPS
┌──────────────────────────────────────████████████████████────────┐
│  CAPA 2 — SERVIDOR (Backend API)                                 │
│                                                                  │
│  FastAPI + Uvicorn (ASGI) — 20 routers registrados              │
│  http://localhost:8000                                           │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐              │
│  │  Routes    │→ │  Schemas     │→ │  Services   │              │
│  │ (20+ rutas)│  │  (Pydantic)  │  │  (negocio)  │              │
│  └────────────┘  └──────────────┘  └─────────────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Repositories │  │  Core        │  │  Middleware   │           │
│  │ (11 archivos)│  │ (config,sec, │  │ (rate limit, │           │
│  │              │  │  mail,cache) │  │  security hd) │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                                                      │
│         ▼                                                      │
│  ┌───────────────────────────────────────────────┐               │
│  │  Models (SQLAlchemy 2.0 — 14 archivos ORM)    │               │
│  └───────────────────────────────────────────────┘               │
└──────────────────────────────────────████████████████████────────┘
                                        ↕ SQL (psycopg2)
┌──────────────────────────────────────████████████████████────────┐
│  CAPA 1 — DATOS                                                  │
│                                                                  │
│  PostgreSQL 16 (Docker Container)  │  Redis 7 (caché + rate)    │
│  localhost:5432                    │  localhost:6379             │
│  25+ tablas con semilla demo       │  Token bucket + cache JSON │
│  Alembic (16 migraciones)          │                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura del Backend (`backend/`)

### Estructura de capas

```
backend/app/
│
├── main.py              ← FastAPI app: 20 routers, CORS, rate limit, security headers
├── core/
│   ├── config.py        ← Pydantic Settings desde .env
│   ├── database.py      ← Engine + SessionLocal + Base (SQLAlchemy 2.0)
│   ├── security.py      ← bcrypt, JWT (access/refresh), require_admin
│   ├── deps.py          ← get_current_usuario, exigir_propietario_o_admin
│   ├── mail.py          ← SMTP directo (7 tipos de email)
│   ├── cache.py         ← Redis client (get_cached, set_cached, delete_pattern)
│   ├── exceptions.py    ← Jerarquía de excepciones (NotFoundError, DuplicateError, etc.)
│   └── file_validation.py ← Validación MIME + magic bytes
│
├── models/              ← 14 archivos ORM (25+ tablas)
│   ├── user_model.py    ← Usuario
│   ├── auth_model.py    ← Rol, UsuarioRol, SesionUsuario, RecuperacionPassword
│   ├── cliente_model.py ← Cliente, Empleado, PreferenciaCliente
│   ├── hotel_model.py   ← Hotel, Habitacion, TipoHabitacion, Caracteristica
│   ├── reserva_model.py ← Paquete, Reserva, Pago, MetodoPago, HistorialReserva
│   ├── servicio_model.py← Destino, Servicio, Proveedor, CategoriaServicio
│   ├── resena_model.py  ← Resena
│   ├── favorito_model.py← Favorito
│   ├── notificacion_model.py ← Notificacion
│   ├── banner_model.py  ← Banner
│   ├── metodo_pago_guardado_model.py ← MetodoPagoGuardado
│   ├── configuracion_model.py ← ConfiguracionSistema
│   └── empresa_model.py ← SolicitudCorporativa
│
├── schemas/             ← Validación Pydantic (request/response)
├── routes/              ← 20 routers FastAPI (HTTP layer)
├── repositories/        ← 11 archivos (acceso a datos)
├── services/            ← Lógica de negocio (auth, pagos, notificaciones, reservas)
│
├── static/uploads/      ← Archivos subidos (perfiles, comprobantes, banners)
└── alembic/versions/    ← 16 migraciones encadenadas
```

### Flujo de una petición HTTP (ejemplo: crear reserva)

```
1. Cliente envía:   POST /api/reservas { id_cliente, id_paquete, ... }
                    ↓
2. FastAPI valida   Los schemas Pydantic validan tipos y campos requeridos
   el body:         Si hay errores → 422 automático
                    ↓
3. Rate limiting:   Token-bucket middleware via Redis
                    Si supera → 429 Too Many Requests
                    ↓
4. Security headers: X-Content-Type-Options, X-Frame-Options, etc.
                    ↓
5. Route:           routes/reservas.py::crear_reserva() recibe datos validados
                   Llama a service correspondiente
                    ↓
6. Repository:      reserva_repository crea el registro en BD
                    ↓
7. Response:        FastAPI serializa a JSON con el response_model
```

### Core modules (`app/core/`)

| Archivo | Propósito |
|---|---|
| `config.py` | Pydantic Settings; DATABASE_URL, SECRET_KEY (≥32 chars), ALGORITHM (HS256), ACCESS_TOKEN_EXPIRE_MINUTES (30), REDIS_URL, SENTRY_DSN, MAIL_* |
| `security.py` | bcrypt hashing; create_access_token (30min), create_refresh_token (7d), decode_token, get_user_from_token, require_admin |
| `deps.py` | get_current_usuario, exigir_propietario_o_admin (protección IDOR) |
| `database.py` | Engine, SessionLocal, Base, get_db |
| `mail.py` | SMTP directo: send_welcome_email, send_verification_email, send_password_reset_email, send_reservation_confirmation, send_cancellation_email, send_contact_email |
| `cache.py` | Redis client; get_cached (JSON), set_cached (TTL default 600s), delete_pattern |
| `exceptions.py` | BaseAPIException, NotFoundError(404), DuplicateError(409), ValidationError(422), HotelDependencyError, ReservaDependencyError, etc. |
| `file_validation.py` | Validación MIME + magic bytes (jpg/png/webp/pdf), 64KB chunked read |

### Seguridad en el backend

```
┌────────────────────────────────────────────────────────────┐
│  Capas de seguridad (de afuera hacia adentro)              │
│                                                            │
│  1. Security Headers    → X-Frame-Options, nosniff, HSTS  │
│  2. Rate Limiting       → Redis token-bucket por endpoint  │
│  3. CORS                → Origins específicas + env        │
│  4. Pydantic Validation → Tipos, formato, fortaleza        │
│  5. JWT Verification    → get_current_usuario dependency   │
│  6. Role-based Access   → require_admin, owner-or-admin    │
│  7. SQLAlchemy ORM      → Queries parametrizadas           │
│  8. bcrypt Hashing      → Contraseñas nunca en plano       │
│  9. Sentry (optional)   → Error tracking en producción     │
│ 10. Global Exception    → Error 500 genérico (sin detalle) │
└────────────────────────────────────────────────────────────┘
```

---

## Arquitectura del Frontend (`alecktourfrondend/`)

### Estructura

```
alecktourfrondend/src/
│
├── main.tsx              ← Entry: AuthProvider + FavoritosProvider → App
├── app/
│   ├── App.tsx           ← RouterProvider (createBrowserRouter)
│   ├── routes.tsx        ← Todas las rutas definidas
│   ├── layouts/
│   │   └── RootLayout.tsx ← Layout global: AuthModal, Toaster, WhatsApp, CookieConsent
│   ├── context/
│   │   ├── AuthContext.tsx     ← Estado auth (token, user, roles, localStorage)
│   │   ├── FavoritosContext.tsx ← Estado favoritos (sync API)
│   │   └── AuthModalContext.tsx ← Control global de modales auth
│   ├── api/v1/
│   │   └── api.ts          ← apiFetch<T>(), apiLogin(), Resena API
│   ├── services/           ← 22 módulos de servicio (fetch-based)
│   ├── pages/              ← 24 componentes de página
│   ├── components/
│   │   ├── ui/             ← 42 componentes shadcn/ui
│   │   ├── admin/          ← 18 componentes admin
│   │   ├── profile/        ← Perfil con tabs
│   │   ├── payment/        ← 6 componentes de pago
│   │   └── hotel/          ← CalendarioOcupacion
│   ├── hooks/              ← useSeoMeta, usePagination
│   ├── utils/              ← localCache, generarFacturaPdf
│   └── data/               ← Tipos estáticos
│
├── src/styles/
│   ├── index.css           ← Master CSS
│   ├── tailwind.css        ← Tailwind config + dark variant
│   ├── theme.css           ← Design system completo (light/dark)
│   └── fonts.css           ← Fuentes Google Fonts
```

### Stack tecnológico del frontend

| Categoría | Tecnología |
|---|---|
| Framework | React 18.3.1 |
| Language | TypeScript |
| Build Tool | Vite 6.3.5 |
| CSS | Tailwind CSS 4.1.12 |
| UI Library | shadcn/ui (Radix UI) + MUI 7.3.5 |
| Routing | react-router 7.13.0 (createBrowserRouter) |
| State | React Context (Auth, Favoritos, AuthModal) |
| HTTP | Native fetch (apiFetch wrapper) |
| Forms | react-hook-form 7.55 |
| Animation | motion (Framer Motion) 12.23, GSAP 3.15 |
| Charts | Recharts 2.15 |
| 3D | Three.js 0.184 |
| Drag & Drop | react-dnd 16.0 |
| PDF | jsPDF 4.2 |
| Toasts | Sonner 2.0 |
| Icons | lucide-react 0.487 + MUI Icons |
| Package Manager | pnpm |

### Rutas de la aplicación

| Ruta | Componente | Auth | Descripción |
|---|---|---|---|
| `/` | Home | No | Landing page |
| `/search` | SearchResults | No | Búsqueda de hoteles/paquetes |
| `/hotel/:id` | HotelDetail | No | Detalle de hotel |
| `/package/:id` | PackageDetail | No | Detalle de paquete turístico |
| `/checkout/:id` | Checkout | No | Checkout multistep con pagos |
| `/confirmation` | Confirmation | No | Confirmación post-pago |
| `/contact` | Contact | No | Formulario de contacto |
| `/faq` | FAQ | No | Preguntas frecuentes |
| `/corporate` | Corporate | No | Solicitud corporativa |
| `/benefits` | Benefits | No | Programa de beneficios |
| `/travel-info` | TravelInfo | No | Información de viaje |
| `/testimonios` | Testimonios | No | Testimonios |
| `/terms` | TermsAndConditions | No | Términos legales |
| `/privacy` | PrivacyPolicy | No | Política de privacidad |
| `/verify` | VerifyEmail | No | Verificación de email |
| `/reset-password` | ResetPassword | No | Reset de contraseña |
| `/login` | LoginRedirect | No | Abre modal login |
| `/register` | RegisterRedirect | No | Abre modal registro |
| `/profile` | Profile | Sí | Perfil con tabs (Reservas, Favoritos, Cuenta, Preferencias) |
| `/reservas` | Reservas | Sí | Lista de reservas del usuario |
| `/preferences` | PreferencesForm | Sí | Cuestionario de preferencias |
| `/personalize/:id` | Personalization | Sí | Personalización de paquete |
| `/admin` | AdminDashboard | Sí (admin) | Panel administrativo completo |
| `*` | NotFound | No | 404 |

### Admin Dashboard módulos

Dashboard, Reservas, Crear Reserva, Pagos, Cancelaciones, Clientes, Hoteles, Paquetes, Usuarios, Banners, Empresas, Configuración, Notificaciones, Actividad, Mi Cuenta.

### Autenticación en el frontend

```
1. Login → POST /auth/login → { access_token, refresh_token, user_id, roles }
2. Token guardado en localStorage (via AuthContext)
3. apiFetch() adjunta Authorization: Bearer automáticamente
4. ProtectedRoute con requiredRole="admin" protege /admin
5. Evento auth:session-expired en 401 limpia estado
```

---

## Infraestructura Docker (6 servicios)

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Compose (dev)                                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ Frontend    │  │ Backend     │  │ PostgreSQL 16       │     │
│  │ React+Vite  │→ │ FastAPI     │→ │ localhost:5432      │     │
│  │ :5173       │  │ :8000       │  │                     │     │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘     │
│                          │                                      │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────────────┐     │
│  │ pgAdmin     │  │ Mailpit     │  │ Redis 7             │     │
│  │ :5050       │→ │ :8025/:1025 │  │ :6379               │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Producción (docker-compose.prod.yml)

- **Backend**: stage `prod` (non-root user, 4 workers, HEALTHCHECK)
- **Frontend**: Desplegado en Vercel (no Docker)
- **PostgreSQL**: Sin exposición de puerto al host
- **Redis**: Sin exposición de puerto al host
- **Sin** Mailpit ni pgAdmin

---

## Decisiones Técnicas Clave

### ¿Por qué FastAPI y no Django o Flask?

FastAPI fue elegido por su soporte nativo de tipos Python, validación automática con Pydantic, documentación Swagger auto-generada y rendimiento ASGI de alta velocidad.

### ¿Por qué Arquitectura en Capas con Repositories?

La separación Routes → Schemas → Services → Repositories → Models permite:
- Cambios en la BD sin afectar la lógica de negocio
- Testing independiente de cada capa
- Reutilización de lógica entre múltiples endpoints

### ¿Por qué Redis para caché y rate limiting?

Redis ofrece persistencia en memoria para rate limiting (token-bucket) y caché de queries frecuentes (hoteles destacados, paquetes populares) con TTL configurable.

### ¿Por qué shadcn/ui + MUI?

shadcn/ui proporciona componentes base accesibles (Radix UI) con Tailwind CSS, mientras MUI aporta componentes complejos (DataGrid, date pickers) para el panel admin.

---

## Flujo de Reservas

```
Cliente             Frontend              Backend              PostgreSQL    Mailpit
   │                   │                    │                      │           │
   │ Selecciona hotel  │                    │                      │           │
   │──────────────────►│                    │                      │           │
   │                   │ GET /hoteles/{id}  │                      │           │
   │                   │───────────────────►│                      │           │
   │                   │◄───────────────────│                      │           │
   │ Selecciona fechas │                    │                      │           │
   │──────────────────►│                    │                      │           │
   │                   │ GET /fechas-ocupadas│                     │           │
   │                   │───────────────────►│                      │           │
   │                   │◄───────────────────│                      │           │
   │ Confirma reserva  │                    │                      │           │
   │──────────────────►│ POST /reservas     │                      │           │
   │                   │───────────────────►│ INSERT reserva       │           │
   │                   │                    │─────────────────────►│           │
   │                   │◄───────────────────│                      │           │
   │ Paga              │                    │                      │           │
   │──────────────────►│ POST /reservas/{id}/pagar                 │           │
   │                   │───────────────────►│ Simula pago          │           │
   │                   │                    │──┐                   │           │
   │                   │                    │  │ send_reservation  │           │
   │                   │                    │  │ _confirmation()   │           │
   │                   │                    │◄─┘                   │──────────►│
   │                   │◄───────────────────│                      │  Email    │
   │ Reserva pagada    │                    │                      │           │
   │◄──────────────────│                    │                      │           │
```

---

## Modelo de Dominio (Resumen)

25+ tablas organizadas en dominios:

| Dominio | Tablas principales |
|---|---|
| Usuarios | usuarios, roles, usuarios_roles, sesiones_usuario |
| Auth | recuperacion_password |
| Clientes | clientes, preferencias_cliente |
| Empleados | empleados |
| Hoteles | hoteles, habitaciones, tipo_habitacion, caracteristicas_hotel, hotel_caracteristicas |
| Servicios | servicios, categoria_servicio, destino, proveedores, servicio_proveedor |
| Paquetes | paquetes, paquete_servicios, paquete_hotel |
| Reservas | reservas, reserva_habitaciones, reserva_servicios |
| Pagos | pagos, metodos_pago, metodos_pago_guardados |
| Auditoría | historial_reservas |
| Reviews | resenas |
| Favoritos | favoritos |
| Notificaciones | notificaciones, configuracion_sistema |
| Cancelaciones | solicitudes_cancelacion |
| Corporativo | solicitudes_corporativas |
| Marketing | banners_publicitarios |

> Ver [`database-schema.md`](database-schema.md) para el esquema completo y [`db_schema.sql`](../../db_schema.sql) para el SQL de referencia.
