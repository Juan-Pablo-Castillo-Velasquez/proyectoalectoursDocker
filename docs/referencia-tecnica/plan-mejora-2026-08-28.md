# Plan de mejora — AlekTours

Auditoría técnica levantada directamente del código el 28 de agosto de 2026, mediante 5 investigaciones paralelas e independientes (admin, backend, sitio público, seguridad, infraestructura). Cada hallazgo cita archivo y línea real; nada fue inventado. Ver también `docs/referencia-tecnica/auditoria-fase1-alektours2.md` (auditoría anterior, Fase 1).

## Resumen

El hallazgo que atraviesa todo lo demás: **el sitio ya desplegado en Vercel no puede hablar con ningún backend real** — `BASE_URL` está fijo a `http://localhost:8000` en `alecktourfrondend/src/app/api/v1/api.ts:1` (importado por 32 archivos), y el CORS del backend (`main.py`) solo acepta orígenes `localhost`. En paralelo, **la gran mayoría de rutas del backend que tocan clientes, reservas y pagos no exigen sesión** — confirmado de forma independiente por dos auditorías distintas — y un endpoint (`PUT /usuarios/{usuario_id}/vincular-cliente`, `cliente_route.py:82-89`) permite vincular cualquier usuario a cualquier cliente sin autenticación.

Ninguno de estos tres puntos es un problema de pulido: son la diferencia entre "funciona en mi máquina" y "está listo para clientes reales". El plan abajo empieza ahí.

---

## 1. Seguridad y autenticación

- 🔴 **Crítico** — La mayoría del backend no exige sesión para leer o modificar datos sensibles. `cliente_route.py` (13 endpoints, ninguno protegido), `reserva_route.py` (32 endpoints, solo 1–2 protegidos — incluye crear/pagar/confirmar/borrar reserva), más `hotel_route.py` (escritura), `configuracion_route.py`, `notificacion_route.py` y `dashboard_route.py`. *Peor caso: cualquiera en internet lee o borra clientes/reservas/pagos y ve los ingresos del negocio, sin credencial.*
- 🔴 **Crítico** — Vincular usuario↔cliente sin verificación (`cliente_route.py:82-89`): toma de identidad real.
- 🔴 **Crítico** — `SECRET_KEY` del JWT de un solo carácter en `backend/.env` local. Con HS256 se fuerza en segundos y permite falsificar tokens de admin.
- 🟠 **Alto** — Verificación de email decorativa: `POST /auth/register` (`auth_route.py:63`) devuelve el propio `verification_token` en la respuesta.
- 🟠 **Alto** — IDOR confirmado en `GET /preferencias/{cliente_id}` (`preferencias_route.py:99-110`) — inconsistente con las líneas 78 y 196 del mismo archivo, que sí protegen.
- 🟡 **Medio** — Credenciales hardcodeadas en `docker-compose.yml:9-11,39` (`admin123`/`admin1234`), puertos expuestos al host.
- 🟡 **Medio** — Rate limiting "fail-open": si Redis falla, el `except Exception: pass` deja pasar todo el tráfico de login sin registrar el evento.
- 🔵 **Bajo** — URLs de verificación/reset con `localhost:5173` hardcodeado (`auth_route.py:21,97`).
- ✅ **Ya está bien** — Hash bcrypt real en contraseñas y PIN de pago; SQL raw con parámetros bindeados en todos los casos revisados; CORS sin wildcard; JWT con secret/algoritmo desde variables de entorno y access+refresh tokens; `.env` fuera de git; headers de seguridad ya configurados; dependencias en versiones razonables.

## 2. Backend, API y despliegue

- 🔴 **Crítico** — El frontend en Vercel no puede alcanzar ningún backend real (ver Resumen).
- 🟠 **Alto** — Cero tests automatizados de lógica de negocio real; solo 8 tests de excepciones de borrado por FK (`.github/workflows/ci.yml:39`). El bug real de cobrar una sola noche en reservas de varias noches (ya corregido esta sesión, `reserva_repository.py:227-245`) es evidencia directa del costo.
- 🟠 **Alto** — `db_schema.sql` desincronizado: faltan 4 tablas de las últimas 4 migraciones de Alembic (métodos de pago guardados, configuración, notificaciones, solicitudes corporativas). Ya señalado antes, sin resolver.
- 🟠 **Alto** — Sin estrategia de backup de base de datos (TODO abierto en `.github/project_tasks.md:42`, nunca implementado).
- 🟡 **Medio** — Manejo de errores inconsistente: solo 3 de +12 archivos de rutas usan las excepciones custom del proyecto; el resto cae al handler genérico de `main.py:185-198`, que devuelve `str(exc)` y filtra detalles internos de la BD.
- 🟡 **Medio** — Idempotencia de pagos rota para PSE/Nequi: `pagar_reserva` (`reserva_route.py:386-455`) no bloquea un segundo intento mientras el pago async sigue "procesando" — riesgo de cobro duplicado.
- 🟡 **Medio** — Zonas horarias inconsistentes: columnas `TIMESTAMP` sin `timezone=True` pero el código escribe datetimes UTC-aware.
- 🟡 **Medio** — Solo hard-delete, sin bandera de baja ni auditoría de quién borró qué.
- 🟡 **Medio** — Índices faltantes en columnas de filtro frecuente (`Reserva.id_cliente/estado/fecha_*`, `Pago.estado/fecha_pago`, `HistorialReserva.fecha_cambio`).
- 🔵 **Bajo** — `get_current_usuario` duplicado idéntico en 6 archivos de rutas.
- 🔵 **Bajo** — El stage `prod` del Dockerfile (bien construido: usuario no-root, sin `--reload`, healthcheck) nunca se usa — `docker-compose.yml` siempre apunta a `target: dev`.

## 3. Panel de administración

- 🟠 **Alto** — Sin exportar reportes (CSV/Excel) ni filtros de rango de fechas en Reservas/Pagos/Cancelaciones.
- 🟡 **Medio** — Listas con tope fijo (100–300) sin aviso cuando se llega al límite — no hay ningún "mostrando X de Y".
- 🟡 **Medio** — Errores de carga inicial silenciados: 10 `.catch` vacíos en `Admindashboard.tsx` muestran "sin datos" en vez de un error real.
- 🟡 **Medio** — Misma tabla HTML duplicada en 8 módulos, sin `DataTable` reutilizable.
- 🟡 **Medio** — Sin acciones masivas (aprobar/resolver varios a la vez) ni permisos granulares por módulo (solo admin/empleado).
- 🔵 **Bajo** — Cero `aria-label` en los 15 archivos de `components/admin`; buscadores sin `<label>`.

## 4. Sitio público y checkout

- 🟠 **Alto** — SEO real (`useSeoMeta`) solo en 4 de 12 páginas; 8 páginas muestran siempre el mismo título/descripción genéricos.
- 🟠 **Alto** — Imagen de Open Graph rota: `index.html:43,49` apunta a `/og-image.jpg`, que no existe.
- 🟠 **Alto** — El progreso del checkout se pierde por completo al recargar (`Checkout.tsx:33-95`) — riesgo de reservas duplicadas/huérfanas.
- 🟠 **Alto** — "Confirmación por correo" prometida (`Checkout.tsx:561-563`) sin infraestructura de envío para reservas (sí existe para verificación/reset de contraseña).
- 🟠 **Alto** — PIN de pago demo (`1234`) expuesto en el propio mensaje de error (`Checkout.tsx:89,299`).
- 🟠 **Alto** — Formulario de registro (`Register.tsx:159-277`, `RegisterModal.tsx`) prácticamente sin `<label>` en 10 campos.
- 🟡 **Medio** — Menús del Navbar solo se abren con `onMouseEnter`, sin soporte de teclado.
- 🔵 **Bajo** — `QuickAccessCards.tsx` (código muerto, no importado) tiene links rotos y contenido de otro país/programa de lealtad inexistente.
- 🔵 **Bajo** — Sin comparador de hoteles, mapa ni chat en vivo; favoritos no compartibles (sí se puede compartir un hotel individual).

---

## Ruta sugerida — 6 fases, en orden de riesgo

**Fase 0 — Seguridad crítica y producción funcional.** Sin esto nada más importa.
- Proteger todos los endpoints listados arriba con autenticación/autorización real
- Corregir `vincular-cliente`
- `BASE_URL` por variable de entorno + CORS ajustado al dominio real de Vercel
- `SECRET_KEY` fuerte para el entorno real
- Corregir el IDOR de preferencias

**Fase 1 — Confiabilidad de los datos.**
- Tests sobre lo que ya causó un bug real: precios, disponibilidad, pagos
- Backups automáticos de la base de datos
- Sincronizar `db_schema.sql` con Alembic
- Idempotencia de pagos async
- Manejo de errores consistente

**Fase 2 — Producción y correo real.**
- Correo transaccional real de confirmación de reserva (o retirar la promesa)
- Reemplazar el PIN demo por un flujo real
- Usar el stage `prod` del Dockerfile en el despliegue real
- Arreglar links con `localhost` en correos reales

**Fase 3 — Operación diaria del admin.**
- Exportar a CSV + filtros de fecha
- Errores de carga visibles
- Aviso de límite de paginación
- `DataTable` reutilizable

**Fase 4 — Checkout y SEO del sitio público.**
- `useSeoMeta` en las 8 páginas restantes + imagen OG real
- Persistir el progreso del checkout
- Accesibilidad del formulario de registro
- Navegación por teclado en el menú principal

**Fase 5 — Pulido general.**
- Accesibilidad del admin, índices de BD, deduplicar `get_current_usuario`, logging con monitoreo externo, retirar/arreglar `QuickAccessCards.tsx`, explorar comparador/mapa/chat en vivo.

---

*Metodología: 5 agentes de investigación revisaron el repositorio real de forma independiente y en paralelo, cada uno citando archivo y línea. No se generó, ejecutó ni desplegó ningún cambio — este documento es un diagnóstico para decidir, no una lista de cambios ya hechos.*
