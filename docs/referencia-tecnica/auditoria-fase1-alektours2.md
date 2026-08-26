# Auditoría Fase 1 — AlekTours 2.0

**Fecha:** 26 de agosto de 2026
**Alcance:** Auditoría de arquitectura, backend, base de datos y frontend del repositorio `proyectoalectoursDocker`, previo a cualquier modificación de código (siguiendo el orden de trabajo solicitado).
**Estado:** Ningún archivo de código fue modificado durante esta fase. Solo lectura.

---

## 1. Resumen ejecutivo

AlekTours ya es un proyecto sustancialmente más maduro que un "CRUD académico". Tiene arquitectura por capas real y respetada (routes → schemas → services → repositories → models), 29 tablas en PostgreSQL con relaciones correctas, migraciones Alembic activas, un sistema de diseño con tokens de marca ya definidos (granate `#7B1E3A` con modo oscuro), una librería de componentes UI extensa (estilo shadcn/Radix), un checkout tipo wizard de 4 pasos funcional, un panel admin con sidebar y 7 módulos con gráficos reales (recharts), y CI en GitHub Actions que corre pytest y valida el build de Docker.

De los 53 puntos del brief, una parte relevante ya está resuelta (login exclusivamente por correo, usuario admin y cliente de prueba sembrados, verificación real de disponibilidad de habitaciones con cruce de fechas, montos de pago siempre calculados en backend). El trabajo pendiente se concentra en: desacoplar la arquitectura de pagos (hoy vive dentro de un solo archivo de 51 KB), construir los flujos de PSE/Nequi/PayPal (hoy solo existe tarjeta), rediseñar el SearchBox para que sea de hoteles y no de vuelos, unificar la documentación (hay documentos de referencia que pertenecen a otro proyecto y no describen el código real), y producir el archivo `sql/admin_queries.sql`.

---

## 2. Arquitectura actual

```
Frontend (React + TS + Vite)
        │  fetch / HTTP REST
        ▼
   Routes (FastAPI)
        │
        ▼
Pydantic Schemas ── validación de entrada/salida
        │
        ▼
   Services ── lógica de negocio
        │
        ▼
 Repositories ── acceso a datos
        │
        ▼
SQLAlchemy Models
        │
        ▼
   PostgreSQL 16
```

Servicios Docker Compose confirmados en `docker-compose.yml`: `postgres` (16), `mailpit` (correo de pruebas), `pgadmin`, `backend` (FastAPI, build multi-stage `dev`/`prod`), `frontend` (Vite dev server), `redis` (cache, añadido recientemente según el historial de commits). Todo corre en la red `alecktours_network`.

La separación de capas se respeta de forma consistente en los módulos revisados (`hotel_route.py`, `reserva_route.py`, `auth_route.py`): las rutas no contienen lógica de negocio, delegan en repositories/services, y los repositories son los únicos que tocan SQLAlchemy directamente.

---

## 3. Backend

**Stack real (`requirements.txt`):** FastAPI 0.141, SQLAlchemy 2.0, Alembic 1.13, Pydantic 2.9, passlib+bcrypt, python-jose (JWT), fastapi-mail, redis.

**Routers montados en `app/main.py`:** auth, hotel, cliente, reserva (incluye paquetes, pagos y métodos de pago), preferencias, promociones, contacto, resena, usuario (+roles), destino, servicio, solicitud_cancelacion. Prefijo real: la mayoría vive bajo `/api/...` y `/auth/...` (**no** `/api/v1/...`).

**Autenticación (ya cumple el punto 6 del brief):**
- `UsuarioLogin.username` está tipado como `EmailStr` en `schemas/user_schema.py`, con un comentario explícito: *"El login es siempre por correo electrónico (nunca por username)"*.
- `auth_service.login_user()` solo busca por `correo_electronico`; nunca consulta por `username`.
- El modal de login en frontend (`LoginModal.tsx`) ya tiene el label "Correo electrónico", placeholder tipo email, validación de formato, y el texto "Inicia sesión con el correo de tu cuenta, no con tu nombre de usuario."
- **Conclusión: el requisito de login solo-por-correo ya está implementado en backend y frontend.** El único detalle cosmético es que el campo interno sigue llamándose `username` (por compatibilidad), lo cual no afecta el comportamiento pero puede confundir a quien lea el código.

**Seguridad de precios/pagos (ya cumple parte de los puntos 21-27):**
- `Reserva.precio_total` es una `@property` calculada en el backend a partir de `reserva_habitaciones`/`reserva_servicios` reales en BD — el frontend nunca puede inventar un total.
- `POST /api/reservas` verifica disponibilidad real cruzando fechas (`reserva_repository.py`, función `_verificar_disponibilidad`): dos rangos se solapan si `fecha_checkin_nueva < checkout_existente` y `checkin_existente < checkout_nueva`. Esta es la lógica de solapamiento correcta.
- `POST /api/reservas/{id}/pagar` recalcula el monto siempre desde `reserva.precio_total` (nunca acepta un monto propuesto por el cliente) y mueve la reserva de `pendiente` a `confirmada`, dejando registro en `historial_reservas`.

**Gaps detectados en backend:**
- Los métodos de pago existen como catálogo (`metodos_pago`: Tarjeta Crédito/Débito, Efectivo, Transferencia, PayPal, Cripto, Nequi, Daviplata, PSE, Cheque) pero el endpoint de pago (`/pagar`) trata todos los métodos igual — no hay lógica ni endpoints diferenciados por tipo de método (esperado para simular PSE/Nequi/PayPal con sus propios pasos).
- No existe todavía un middleware/endpoint de "estado de pago" tipo `PENDING → PROCESSING → APPROVED/REJECTED` (punto 25 del brief); hoy el pago simulado siempre resulta en `pagado` inmediato.
- Documentación desalineada: `docs/referencia-tecnica/api-endpoints.md` y `design-system.md` describen un proyecto **distinto** ("NN Auth System", serie educativa con acentos de color por stack tipo emerald/blue/violet). No reflejan las rutas, campos ni colores reales de AlekTours. Esto es ruido documental que puede inducir a error si se usa como referencia.

---

## 4. Base de datos

**29 tablas confirmadas** en `db_schema.sql` y en los modelos SQLAlchemy (coinciden): `hoteles`, `caracteristicas_hotel`, `hotel_caracteristicas`, `tipo_habitacion`, `habitaciones`, `clientes`, `preferencias_cliente`, `empleados`, `roles`, `usuarios`, `usuarios_roles`, `sesiones_usuario`, `recuperacion_password`, `destinos`, `categoria_servicio`, `servicios`, `proveedores`, `servicio_proveedor`, `paquetes`, `paquete_servicios`, `paquete_hotel`, `reservas`, `reserva_habitaciones`, `reserva_servicios`, `metodos_pago`, `pagos`, `historial_reservas`, `resenas`, `solicitudes_cancelacion`.

Existe además una vista `vista_paquetes_populares` (usada por `GET /api/paquetes/populares`).

**Migraciones Alembic (orden real):** `49b74c185f93` (esquema inicial) → `2b118189cd9d` (seed roles) → `523e6283e58b` (seed datos demo) → `83731da37b5e` (tabla resenas) → `f4a9c1d8b2e3` (foto_perfil) → `a7c3e9f21b04` (fix password_hash + roles + admin de prueba).

**Usuarios de prueba (ya cumple los puntos 7 y 8 del brief), sembrados vía Alembic:**
- Admin: `admin@alektours.com` / `Admin1234!` (creado en `a7c3e9f21b04`, rol `admin` asignado).
- Cliente: `maria.gomez@email.com` / `Cliente1234!` (usuario semilla `mariag`, cuyo `password_hash` placeholder `hash12345` es reemplazado por el hash bcrypt real de `Cliente1234!` en la misma migración; rol `cliente` asignado).
- **Importante:** esto solo es válido si `alembic upgrade head` se ejecutó contra la base de datos actual. Si el contenedor de Postgres se levantó únicamente desde `db_schema.sql` (que inserta `password_hash = 'hash12345'` sin bcrypt real), el login de estos dos usuarios fallará hasta correr las migraciones. Se recomienda confirmarlo en Fase 2 antes de dar por buena la Fase 8 (QA).

**Riesgo — doble fuente de verdad:** el proyecto mantiene **dos** definiciones de esquema: `db_schema.sql` (para arranque rápido) y las migraciones Alembic (fuente de verdad real, incremental). Si evolucionamos el esquema solo por Alembic (como pide el brief) sin actualizar `db_schema.sql`, ese archivo queda obsoleto y puede inducir a levantar una BD desincronizada. Recomendación: regenerar `db_schema.sql` a partir de `pg_dump --schema-only` después de cada migración nueva, o documentar que Alembic es la única fuente y `db_schema.sql` es solo un snapshot histórico.

---

## 5. Frontend

**Stack real (`package.json`):** React 18 + TypeScript + Vite 6, Tailwind CSS 4 (vía `@tailwindcss/vite`), Radix UI (base de ~35 componentes ya construidos en `components/ui/`: accordion, alert-dialog, avatar, badge, breadcrumb, calendar, card, carousel, chart, checkbox, command, dialog, drawer, dropdown-menu, form, pagination, popover, progress, radio-group, select, sheet, sidebar, skeleton, slider, switch, table, tabs, toggle, tooltip, etc.), `recharts` para gráficos, `motion` (Framer Motion) para animaciones, `react-router` 7, `react-hook-form`, `sonner` para toasts, `jspdf` para comprobantes en PDF.

**Design tokens ya definidos en `theme.css`:** `--primary #7B1E3A` (granate marca), `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--sidebar-*`, con bloque `.dark` completo y equivalencia Tailwind vía `@theme inline`. Esto ya cubre gran parte del punto 44 del brief (faltan tokens explícitos de `success`/`warning`, hoy solo existe `destructive`).

**Páginas existentes (`src/app/pages/`):** Home, SearchResults, HotelDetail, PackageDetail, Checkout, Confirmation, Reservas ("Mis viajes"), Profile (+ PreferencesForm, Personalization), Login/Register (vía modales + redirects), ResetPassword, VerifyEmail, Contact, FAQ, Benefits, Corporate, TravelInfo, Testimonios, Admindashboard, NotFound.

**Admin (`components/admin/`):** ya tiene layout sidebar + header, 7 módulos (`ModuleDashboard` con KPIs e ingresos/reservas por estado/paquete/método de pago vía recharts, `ModuleReservas`, `ModuleCrearReserva`, `ModuleHoteles`, `ModulePaquetes`, `ModuleClientes`, `ModuleUsuarios`), modo oscuro persistido en `localStorage`, y llamadas reales a la API (no mockeadas).

**Checkout (`pages/Checkout.tsx`, 51 KB):** ya es un wizard real de 4 pasos (Datos del viajero → Fechas y huéspedes → Revisar reserva → Pago), con validación de tarjeta (Luhn-like length, vencimiento, CVV) y un PIN de seguridad demo. **Es un archivo monolítico**: toda la lógica de tarjeta vive inline en el componente; no hay componentes separados por método de pago, y solo tarjeta tiene UI dedicada — PSE, Nequi y PayPal existen en el catálogo de BD pero no tienen flujo visual propio en este archivo.

**SearchBar (`components/SearchBar.tsx`):** tiene campos `origin` (por defecto "Bogotá, Colombia"), `destination`, fechas, huéspedes y `tripType` (oneway/roundtrip/multi) — es decir, está modelado como buscador de **vuelos**, no el buscador de **hoteles** simple (Destino / Check-in / Check-out / Huéspedes / Buscar) que pide el brief en el punto 10. Esto es una desalineación conceptual a resolver en Fase 5, no solo visual.

**Riesgo de documentación:** igual que en backend, `docs/referencia-tecnica/design-system.md` describe un sistema de temas por color-de-stack (emerald/blue/violet) de otro proyecto educativo ("NN Auth System"), completamente ajeno a la paleta granate real de AlekTours. No debe usarse como referencia de diseño.

---

## 6. Cobertura del brief (53 puntos) — vista rápida

| Área | Estado | Detalle |
|---|---|---|
| Auditar antes de modificar (pts 2-5) | ✅ Hecho | Esta auditoría, sin tocar código |
| Login solo por correo (pt 6) | ✅ Ya implementado | Backend y frontend ya lo exigen |
| Admin de prueba (pt 7) | ✅ Ya sembrado | Vía Alembic `a7c3e9f21b04` |
| Cliente de prueba (pt 8) | ✅ Ya sembrado | Vía Alembic `a7c3e9f21b04` |
| Homepage / Hero (pt 9) | ⚠️ Parcial | Existe Home.tsx; falta confirmar copy exacto del hero pedido |
| SearchBox de hoteles (pts 10) | ❌ Desalineado | El actual es de vuelos (origin/tripType), no de hoteles |
| Resultados + filtros (pts 11, 13) | ⚠️ Parcial | SearchResults ya filtra por calificación/país/ciudad; faltan precio, servicios, desayuno/piscina/wifi/parqueadero |
| HotelCard (pt 12) | ⚠️ Por verificar a fondo | Componente existe (20 KB), pendiente comparar campo a campo con el spec |
| Hotel Detail + Galería (pts 14-15) | ⚠️ Por verificar | Página existe (26 KB) |
| Habitaciones (pt 16) | ⚠️ Por verificar | Repositorio/modelo soportan todos los campos pedidos |
| Flujo de reserva + progreso (pt 17) | ✅ Ya implementado | Wizard de 4 pasos con stepper visual |
| Checkout (pt 18) | ✅ Ya implementado | Layout de 2 columnas (datos + resumen) |
| Pagos simulados: Tarjeta (pts 19, 21) | ✅ Ya implementado | Con validación y "Procesando..." |
| PSE / Nequi (pts 22-23) | ❌ Falta | Sin flujo propio, catálogo de BD sí los contempla |
| PayPal desacoplado (pt 24) | ❌ Falta | No existe `PaymentSelector`/`PayPalPayment.tsx` |
| Arquitectura `payment/` separada (pt 20) | ❌ Falta | Todo vive en `Checkout.tsx` |
| Estados de pago PENDING→APPROVED (pt 25) | ⚠️ Parcial | BD soporta `pendiente/pagado/rechazado`; falta estado `processing` intermedio en UI |
| Reserva ligada a entidades reales (pt 26) | ✅ Ya implementado | Sin tabla paralela |
| Disponibilidad sin duplicados (pt 27) | ✅ Ya implementado | Verificación de solapamiento de fechas correcta |
| Confirmación con código (pt 28) | ⚠️ Por verificar | Página `Confirmation.tsx` existe |
| Mis reservas (pt 29) | ✅ Ya implementado | `Reservas.tsx` |
| Admin layout + dashboard (pts 30-32) | ✅ Ya implementado | Sidebar + 7 módulos + KPIs con recharts |
| CRUD admin mejorado (pts 33-34) | ⚠️ Por verificar | Existen, falta confirmar paginación/orden/búsqueda en todas las tablas |
| Formularios/modales admin (pts 35-36) | ⚠️ Por verificar | Base de componentes (dialog, drawer, form) ya existe |
| Responsive admin (pt 37) | ⚠️ Sin probar | Pendiente de QA visual en los breakpoints pedidos |
| `sql/admin_queries.sql` (pt 38) | ❌ Falta | No existe el archivo |
| Estados UX (loading/empty/error) (pt 39) | ⚠️ Parcial | `Loader.tsx` y `Skeleton` existen; falta confirmar cobertura completa |
| Design tokens (pt 44) | ✅ Casi completo | Faltan tokens explícitos de success/warning |
| Design system / componentes base (pt 43) | ✅ Ya existe | ~35 componentes Radix ya construidos |
| Iconografía Lucide (pt 45) | ✅ Ya en uso | `lucide-react` en todo el frontend |
| Docker (pt 48) | ✅ Funcional | CI valida `docker compose build` |
| Documentación técnica coherente | ❌ Desalineada | `docs/referencia-tecnica/*` describe otro proyecto |

---

## 7. Problemas y riesgos detectados

1. **Documentación de referencia obsoleta/ajena** (`docs/referencia-tecnica/design-system.md` y `api-endpoints.md`) describe un proyecto educativo distinto. Riesgo: si se usa como fuente durante el rediseño, se introducirán colores y endpoints que no existen en AlekTours.
2. **`Checkout.tsx` monolítico (51 KB)** mezcla wizard, validación de tarjeta y resumen en un solo archivo. Riesgo de mantenibilidad alto al añadir PSE/Nequi/PayPal si no se descompone primero.
3. **Doble fuente de verdad de esquema** (`db_schema.sql` vs Alembic). Riesgo de que un desarrollador levante una BD desincronizada (contraseñas seed sin hash real, por ejemplo).
4. **SearchBar conceptualmente es de vuelos**, no de hoteles (campo `origin`, `tripType`). Cambiarlo no es solo estético: hay que decidir si se elimina `origin`/`tripType` o se reinterpreta.
5. **Sin distinción de estados de pago intermedios** (`processing`) — hoy el pago simulado resuelve instantáneo a `pagado`, lo que no permite mostrar el estado "Procesando..." de forma realista más allá del frontend.
6. **No se confirmó si `alembic upgrade head` ya corrió** contra la base de datos que el usuario tiene levantada actualmente — esto determina si el login de admin/cliente de prueba funciona hoy mismo o requiere un paso previo.
7. **Sin archivo `sql/admin_queries.sql`** todavía (pedido explícitamente en el punto 38).
8. **Tests automatizados limitados**: CI solo corre `test_delete_exceptions.py`; existe también `test_email_verification.py` pero no se ejecuta en CI. No hay tests de frontend.

---

## 8. Fortalezas a preservar (no tocar/rehacer)

- Arquitectura por capas ya limpia: routes nunca acceden a SQLAlchemy directamente.
- Cálculo de precios y montos de pago **siempre en backend**, nunca confiando en el frontend — ya implementado correctamente y debe mantenerse como principio en todo lo nuevo que se construya.
- Verificación de disponibilidad con cruce de fechas correcto (evita reservas duplicadas).
- Login exclusivamente por correo electrónico, ya validado en schema y en servicio.
- Sistema de tokens de marca (granate + modo oscuro) ya coherente en `theme.css`.
- Librería de ~35 componentes UI reutilizables ya construida sobre Radix.
- Admin dashboard con gráficos reales conectados a la API (no data mockeada).
- CI que valida build de Docker y corre pruebas de backend en cada push.

---

## 9. Recomendación de orden de trabajo (Fase 2 en adelante)

Dado que gran parte de auth, reservas y disponibilidad ya cumple el objetivo, propongo ajustar el foco de las fases restantes a lo que realmente falta, en este orden:

1. **Fase 2 (DB):** confirmar estado real de las migraciones contra la BD del usuario; decidir política para `db_schema.sql` vs Alembic; no se anticipan cambios estructurales grandes salvo los que pida el flujo de pagos con estados intermedios.
2. **Fase 3 (Backend pagos):** diseñar endpoints/estados diferenciados por método de pago (PSE, Nequi, PayPal) manteniendo `precio_total` calculado en backend.
3. **Fase 4 (Design system):** completar tokens `success`/`warning` faltantes; el resto de componentes base ya existe.
4. **Fase 5 (Cliente):** (a) descomponer `Checkout.tsx` en `components/payment/{PaymentSelector,CardPayment,PSEPayment,NequiPayment,PayPalPayment,PaymentStatus}.tsx`; (b) rediseñar `SearchBar` como buscador de hoteles; (c) verificar HotelCard/HotelDetail/RoomCard campo a campo contra el spec.
5. **Fase 6 (Admin):** verificar paginación/búsqueda/filtros en todas las tablas CRUD y responsive en los breakpoints pedidos.
6. **Fase 7 (SQL):** crear `sql/admin_queries.sql` contra el esquema real (29 tablas confirmadas arriba).
7. **Fase 8 (QA):** probar login admin/cliente reales, flujo completo de reserva + los 4 métodos de pago, y responsive en los 9 breakpoints pedidos.

---

## 10. Decisiones que necesito antes de tocar código

1. ¿El Docker Compose del usuario ya está levantado con `alembic upgrade head` aplicado, o arrancó solo desde `db_schema.sql`? Esto determina si el login de admin/cliente de prueba funciona ya mismo.
2. ¿Se pueden corregir/eliminar los documentos `docs/referencia-tecnica/design-system.md` y `api-endpoints.md` (son de otro proyecto), o hay una razón para conservarlos?
3. Para el SearchBar: ¿eliminar por completo el concepto de "origen"/tipo de viaje (vuelos), o mantenerlo oculto por si se planea añadir vuelos más adelante?
4. Prioridad de fases: ¿arrancamos por pagos (PSE/Nequi/PayPal + arquitectura `payment/`), por el rediseño de Home/Search/HotelCard, o por el admin? El brief pide ese orden exacto, pero dado que auth/checkout/admin base ya existen, puede convenir invertir el orden.
