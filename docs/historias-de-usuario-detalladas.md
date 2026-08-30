# Historias de Usuario Detalladas - AlecTours

**Versión:** 2.0  
**Fecha:** Agosto 30, 2026  
**Proyecto:** Sistema de Gestión Turística AlecTours  
**Estado:** Documento Actualizado

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Metodología](#metodología)
3. [Épicas del Proyecto](#épicas-del-proyecto)
4. [Historias por Épica](#historias-por-épica)
5. [Product Backlog Priorizado](#product-backlog-priorizado)
6. [Criterios de Definición de Listo (DoR)](#criterios-de-definición-de-listo-dor)
7. [Criterios de Definición de Hecho (DoD)](#criterios-de-definición-de-hecho-dod)

---

## Introducción

### Propósito del Documento

Este documento contiene las historias de usuario del sistema AlecTours, escritas desde la perspectiva del usuario final. Cada historia describe una funcionalidad del sistema en términos de valor para el usuario.

### ¿Qué es una Historia de Usuario?

Una historia de usuario es una descripción breve y simple de una funcionalidad, escrita desde la perspectiva del usuario que la necesita.

**Formato:**
```
Como [tipo de usuario]
Quiero [realizar una acción]
Para [obtener un beneficio]
```

### Audiencia

- **Product Owner:** Validar que las historias representen el valor del negocio
- **Equipo Scrum:** Estimar, planificar y desarrollar
- **Stakeholders:** Entender el progreso y las funcionalidades
- **QA:** Crear casos de prueba basados en criterios de aceptación

---

## Metodología

### Scrum Framework

El proyecto AlecTours sigue metodología Scrum:

- **Sprints:** 2 semanas
- **Planning:** Lunes inicio de sprint
- **Daily Standup:** Diario 9:00 AM
- **Review:** Viernes semana 2
- **Retrospective:** Viernes semana 2

### Estimación: Planning Poker

Utilizamos la secuencia de Fibonacci modificada:

| Story Points | Días | Descripción |
|--------------|------|-------------|
| 1 | 0.5 | Trivial: cambio menor, configuración |
| 2 | 1 | Pequeña: CRUD simple sin lógica compleja |
| 3 | 1.5 | Simple: CRUD con validaciones básicas |
| 5 | 2-3 | Mediana: lógica de negocio, integraciones simples |
| 8 | 3-5 | Grande: múltiples componentes, lógica compleja |
| 13 | 5-8 | Muy grande: considerar dividir en historias más pequeñas |
| 20 | 8+ | Épica: debe dividirse obligatoriamente |

### Priorización: MoSCoW

- **Must Have:** Crítico, sin esto el sistema no funciona
- **Should Have:** Importante, agrega valor significativo
- **Could Have:** Deseable, mejora la experiencia
- **Won't Have:** No se implementará en este release

---

## Épicas del Proyecto

### EP-01: Autenticación y Gestión de Usuarios

**Descripción:** Sistema completo de gestión de identidad, acceso y perfiles de usuario.

**Valor de Negocio:** Permitir que usuarios creen cuentas, accedan de forma segura y gestionen su información personal.

**Historias:** HU-001, HU-002, HU-003, HU-004, HU-017, HU-038

**Story Points Total:** 31  
**Prioridad:** Must Have  
**Sprint Target:** Sprint 1

---

### EP-02: Búsqueda y Descubrimiento de Hoteles

**Descripción:** Funcionalidades para que usuarios encuentren hoteles según sus preferencias.

**Valor de Negocio:** Facilitar el descubrimiento de opciones de alojamiento, aumentar conversión.

**Historias:** HU-005, HU-006, HU-007, HU-008, HU-009

**Story Points Total:** 23  
**Prioridad:** Must Have / Should Have  
**Sprint Target:** Sprint 2

---

### EP-03: Gestión de Reservas

**Descripción:** Core del sistema, permite crear, consultar, modificar y cancelar reservas.

**Valor de Negocio:** Generar ingresos a través de reservas de hotel.

**Historias:** HU-010, HU-011, HU-012, HU-013

**Story Points Total:** 34  
**Prioridad:** Must Have  
**Sprint Target:** Sprint 3

---

### EP-04: Procesamiento de Pagos

**Descripción:** Sistema de pagos seguro y multi-método.

**Valor de Negocio:** Permitir completar transacciones y generar ingresos.

**Historias:** HU-014, HU-015, HU-016

**Story Points Total:** 23  
**Prioridad:** Must Have / Could Have  
**Sprint Target:** Sprint 3

---

### EP-05: Perfil y Preferencias

**Descripción:** Gestión de información personal y preferencias del cliente.

**Valor de Negocio:** Personalizar experiencia, aumentar retención.

**Historias:** HU-017, HU-018

**Story Points Total:** 8  
**Prioridad:** Should Have / Could Have  
**Sprint Target:** Sprint 6

---

### EP-06: Reseñas y Valoraciones

**Descripción:** Sistema de reseñas de hoteles por clientes.

**Valor de Negocio:** Generar confianza, mejorar calidad del servicio.

**Historias:** HU-019, HU-020, HU-039

**Story Points Total:** 12  
**Prioridad:** Should Have  
**Sprint Target:** Sprint 6

---

### EP-07: Lista de Favoritos

**Descripción:** Permitir guardar hoteles de interés.

**Valor de Negocio:** Mejorar experiencia, facilitar re-compra.

**Historias:** HU-021, HU-022

**Story Points Total:** 5  
**Prioridad:** Could Have  
**Sprint Target:** Backlog

---

### EP-08: Sistema de Notificaciones

**Descripción:** Comunicación proactiva con usuarios.

**Valor de Negocio:** Mantener usuarios informados, reducir no-shows.

**Historias:** HU-023, HU-024

**Story Points Total:** 10  
**Prioridad:** Must Have / Should Have  
**Sprint Target:** Sprint 3

---

### EP-09: Gestión de Hoteles (Admin)

**Descripción:** Herramientas para que empleados gestionen catálogo de hoteles.

**Valor de Negocio:** Mantener inventario actualizado.

**Historias:** HU-027, HU-028, HU-029

**Story Points Total:** 21  
**Prioridad:** Must Have / Should Have  
**Sprint Target:** Sprint 1

---

### EP-10: Gestión de Clientes (Admin)

**Descripción:** Herramientas CRM para empleados.

**Valor de Negocio:** Mejorar atención al cliente, asistir en ventas.

**Historias:** HU-030, HU-031, HU-032

**Story Points Total:** 14  
**Prioridad:** Must Have / Should Have  
**Sprint Target:** Sprint 2

---

### EP-11: Reportes y Analytics (Admin)

**Descripción:** Dashboards y reportes para toma de decisiones.

**Valor de Negocio:** Insights de negocio, optimización de operaciones.

**Historias:** HU-035, HU-036, HU-037, HU-041, HU-042

**Story Points Total:** 31  
**Prioridad:** Must Have / Should Have  
**Sprint Target:** Sprint 4, 7

---

### EP-12: Paquetes Turísticos

**Descripción:** Ofertas combinadas de servicios turísticos.

**Valor de Negocio:** Aumentar ticket promedio, diferenciar oferta.

**Historias:** HU-025, HU-026

**Story Points Total:** 16  
**Prioridad:** Should Have  
**Sprint Target:** Sprint 8

---

### EP-13: Cancelaciones y Reembolsos

**Descripción:** Proceso de cancelación con políticas y reembolsos.

**Valor de Negocio:** Cumplir regulaciones, mantener satisfacción del cliente.

**Historias:** HU-012, HU-033, HU-034, HU-042

**Story Points Total:** 18  
**Prioridad:** Must Have / Should Have  
**Sprint Target:** Sprint 4

---

## Historias por Épica

## EP-01: Autenticación y Gestión de Usuarios

### HU-001: Registro de Nueva Cuenta

**ID:** HU-001  
**Nombre:** Como nuevo usuario quiero crear una cuenta  
**Épica:** EP-01  
**Prioridad:** Must Have  
**Story Points:** 5  
**Sprint:** 1

#### Historia

```
Como nuevo usuario
Quiero crear una cuenta en AlecTours
Para poder hacer reservas y acceder a servicios personalizados
```

#### Contexto

Los visitantes del sitio necesitan crear una cuenta para poder realizar reservas. El registro debe ser simple y rápido para no generar fricción.

#### Criterios de Aceptación

```gherkin
Scenario: Registro exitoso con datos válidos
  Given un visitante en la página de registro
  When completa el formulario con:
    | nombre    | Juan Pérez                |
    | email     | juan@example.com          |
    | contraseña| Password123!              |
  And acepta términos y condiciones
  And hace clic en "Registrarse"
  Then se crea una cuenta en estado "no verificado"
  And recibe un email de verificación en juan@example.com
  And ve mensaje "Cuenta creada. Revisa tu email para verificar"
  And NO puede iniciar sesión hasta verificar

Scenario: Email ya registrado
  Given un visitante en la página de registro
  When intenta registrarse con email existente@example.com
  Then ve error "Este email ya está registrado"
  And ve enlace "¿Olvidaste tu contraseña?"
  And NO se crea cuenta duplicada

Scenario: Contraseña no cumple requisitos
  Given un visitante en la página de registro
  When ingresa contraseña "123"
  Then ve error "Contraseña debe tener al menos 8 caracteres"
  And ve lista de requisitos de contraseña
  And el botón "Registrarse" está deshabilitado

Scenario: Verificación de email exitosa
  Given un usuario registrado no verificado
  When hace clic en el enlace del email de verificación
  Then su cuenta cambia a estado "verificado"
  And ve mensaje "Cuenta activada exitosamente"
  And es redirigido a página de login
  And puede iniciar sesión

Scenario: Enlace de verificación expirado
  Given un enlace de verificación generado hace > 24 horas
  When un usuario hace clic en el enlace
  Then ve mensaje "Este enlace ha expirado"
  And ve botón "Reenviar email de verificación"
  And puede solicitar nuevo enlace
```

#### Notas Técnicas

- Validación de email en frontend Y backend
- Contraseña hasheada con bcrypt (cost factor 12)
- Token de verificación: UUID v4 con TTL 24 horas
- Rate limiting: máximo 5 registros por IP/hora
- Email template responsive con branding AlecTours

#### Definición de Hecho (DoD)

- [ ] Endpoint POST /api/v1/auth/register implementado
- [ ] Validaciones frontend y backend funcionando
- [ ] Email de verificación enviándose correctamente
- [ ] Tests unitarios (cobertura >= 80%)
- [ ] Tests de integración E2E
- [ ] Documentación API actualizada
- [ ] Revisión de código aprobada
- [ ] QA testing completado
- [ ] Product Owner aceptó la funcionalidad

#### Dependencias

- Servicio SMTP configurado
- Template de email de verificación diseñado
- Página de verificación exitosa/fallida en frontend

#### Riesgos

- Emails caen en spam → Configurar SPF, DKIM, DMARC
- Bots creando cuentas masivamente → Implementar reCAPTCHA

---

### HU-002: Verificación de Email

**ID:** HU-002  
**Nombre:** Como usuario registrado quiero verificar mi email  
**Épica:** EP-01  
**Prioridad:** Must Have  
**Story Points:** 3  
**Sprint:** 1

#### Historia

```
Como usuario recién registrado
Quiero verificar mi dirección de email
Para activar mi cuenta y poder iniciar sesión
```

#### Criterios de Aceptación

```gherkin
Scenario: Verificación exitosa
  Given un usuario con cuenta no verificada
  When hace clic en el enlace de verificación del email
  Then su cuenta se marca como verificada
  And puede iniciar sesión
  And ve página de confirmación
  And recibe email de bienvenida

Scenario: Reenvío de email de verificación
  Given un usuario no verificado
  When hace clic en "Reenviar email de verificación"
  Then recibe nuevo email con enlace válido
  And el enlace anterior se invalida
  And ve mensaje "Email reenviado"

Scenario: Intento de login sin verificar
  Given un usuario no verificado
  When intenta iniciar sesión con credenciales correctas
  Then ve error "Debes verificar tu email antes de iniciar sesión"
  And ve botón "Reenviar email de verificación"
  And NO se genera token de sesión
```

---

### HU-003: Inicio de Sesión

**ID:** HU-003  
**Nombre:** Como usuario registrado quiero iniciar sesión  
**Épica:** EP-01  
**Prioridad:** Must Have  
**Story Points:** 3  
**Sprint:** 1

#### Historia

```
Como usuario registrado y verificado
Quiero iniciar sesión con mi email y contraseña
Para acceder a mi cuenta y sus funcionalidades
```

#### Criterios de Aceptación

```gherkin
Scenario: Login exitoso
  Given un usuario verificado con credenciales correctas
  When ingresa email y contraseña
  And hace clic en "Iniciar sesión"
  Then obtiene token JWT válido
  And es redirigido a su dashboard
  And ve su nombre en el header
  And la sesión dura 30 minutos

Scenario: Credenciales incorrectas
  Given un usuario en la página de login
  When ingresa contraseña incorrecta
  Then ve error "Email o contraseña incorrectos"
  And NO se revela si el email existe
  And NO se genera token
  And se registra intento fallido

Scenario: Cuenta bloqueada por múltiples intentos
  Given un usuario con 5 intentos fallidos en la última hora
  When intenta iniciar sesión nuevamente
  Then ve error "Cuenta temporalmente bloqueada por seguridad"
  And ve mensaje "Intenta nuevamente en 60 minutos"
  And ve enlace "¿Olvidaste tu contraseña?"

Scenario: Token expira después de 30 minutos
  Given un usuario con sesión activa
  When pasan 30 minutos sin actividad
  And intenta realizar una acción
  Then su token es rechazado
  And es redirigido a login
  And ve mensaje "Tu sesión expiró. Por favor inicia sesión nuevamente"
```

#### Notas Técnicas

- JWT con payload: {user_id, email, rol, exp}
- Secret key mínimo 48 caracteres
- Algoritmo HS256
- Token en header Authorization: Bearer {token}
- No almacenar token en localStorage (XSS risk) → memoria o httpOnly cookie

---

### HU-004: Recuperación de Contraseña

**ID:** HU-004  
**Nombre:** Como usuario quiero recuperar mi contraseña olvidada  
**Épica:** EP-01  
**Prioridad:** Must Have  
**Story Points:** 5  
**Sprint:** 1

#### Historia

```
Como usuario que olvidó su contraseña
Quiero poder restablecerla de forma segura
Para recuperar el acceso a mi cuenta
```

#### Criterios de Aceptación

```gherkin
Scenario: Solicitud de recuperación exitosa
  Given un usuario en la página "Olvidé mi contraseña"
  When ingresa su email registrado
  And hace clic en "Enviar enlace de recuperación"
  Then recibe email con enlace de recuperación
  And ve mensaje "Si el email existe, recibirás instrucciones"
  And el enlace expira en 1 hora

Scenario: Restablecer contraseña exitosamente
  Given un usuario con enlace de recuperación válido
  When hace clic en el enlace
  And ingresa nueva contraseña que cumple requisitos
  And confirma la nueva contraseña
  And hace clic en "Restablecer contraseña"
  Then su contraseña se actualiza
  And todos sus tokens JWT activos se invalidan
  And ve mensaje "Contraseña actualizada exitosamente"
  And es redirigido a login
  And puede iniciar sesión con nueva contraseña

Scenario: Enlace de recuperación expirado
  Given un enlace de recuperación generado hace > 1 hora
  When el usuario hace clic en el enlace
  Then ve mensaje "Este enlace expiró"
  And ve botón "Solicitar nuevo enlace"

Scenario: Email no registrado
  Given un usuario ingresa email no registrado
  When solicita recuperación
  Then ve MISMO mensaje "Si el email existe, recibirás instrucciones"
  And NO se envía email
  And NO se revela que el email no existe

Scenario: Rate limiting en recuperación
  Given un usuario que ha solicitado 3 recuperaciones en 1 hora
  When intenta solicitar otra
  Then ve error "Has excedido el límite de solicitudes"
  And ve mensaje "Intenta nuevamente en 1 hora"
```

---

## EP-02: Búsqueda y Descubrimiento

### HU-005: Búsqueda Básica de Hoteles

**ID:** HU-005  
**Nombre:** Como viajero quiero buscar hoteles por destino y fechas  
**Épica:** EP-02  
**Prioridad:** Must Have  
**Story Points:** 8  
**Sprint:** 2

#### Historia

```
Como viajero planificando un viaje
Quiero buscar hoteles en un destino específico para ciertas fechas
Para encontrar opciones de alojamiento disponibles
```

#### Criterios de Aceptación

```gherkin
Scenario: Búsqueda exitosa con resultados
  Given un viajero en la página principal
  When selecciona destino "Cancún, México"
  And selecciona fechas check-in "2026-12-01" y check-out "2026-12-05"
  And selecciona 2 adultos, 0 niños
  And hace clic en "Buscar"
  Then ve lista de hoteles disponibles en Cancún
  And cada resultado muestra:
    | Elemento              | Requerido |
    | Imagen principal      | Sí        |
    | Nombre del hotel      | Sí        |
    | Categoría (estrellas) | Sí        |
    | Calificación promedio | Sí        |
    | Precio por noche      | Sí        |
    | Ubicación             | Sí        |
    | Botón "Ver detalles"  | Sí        |
  And los resultados están ordenados por relevancia
  And ve contador "45 hoteles encontrados"

Scenario: Búsqueda sin resultados
  Given un viajero buscando hoteles
  When busca en "Destino Remoto" para fechas "2026-12-24" a "2026-12-26"
  Then ve mensaje "No encontramos hoteles disponibles"
  And ve sugerencias:
    | "Intenta con fechas diferentes"           |
    | "Explora destinos cercanos"               |
    | "Contacta con nosotros para asistencia"   |

Scenario: Validación de fechas
  Given un viajero en el formulario de búsqueda
  When intenta buscar con check-out antes de check-in
  Then ve error "La fecha de salida debe ser después de la entrada"
  And el botón "Buscar" está deshabilitado

Scenario: Fechas en el pasado
  Given un viajero ingresa fecha check-in en el pasado
  Then ve error "No puedes reservar fechas pasadas"
  And el campo de fecha se resetea a mañana

Scenario: Autocompletar destino
  Given un viajero escribiendo en el campo destino
  When escribe "can"
  Then ve sugerencias:
    | Cancún, México           |
    | Canggu, Bali             |
    | Cannes, Francia          |
  And puede seleccionar con teclado (flechas + Enter)
  And puede seleccionar con mouse
```

#### Wireframe / Mockup

```
┌─────────────────────────────────────────────────────────┐
│  [Logo AlecTours]                    [Login] [Registro]  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   ┌─────────────────────────────────────────────────┐   │
│   │  ¿A dónde viajas?                               │   │
│   │  [_______________________________________]       │   │
│   │   Destino, ciudad o hotel                       │   │
│   │                                                  │   │
│   │  Fechas                    Huéspedes            │   │
│   │  [__________] [__________] [____]               │   │
│   │  Check-in     Check-out    2 adultos            │   │
│   │                                                  │   │
│   │             [ Buscar Hoteles ]                  │   │
│   └─────────────────────────────────────────────────┘   │
│                                                           │
│   Destinos Populares                                     │
│   [Cancún] [Miami] [Barcelona] [Tokio]                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### HU-006: Filtros de Búsqueda Avanzada

**ID:** HU-006  
**Nombre:** Como viajero quiero filtrar resultados de búsqueda  
**Épica:** EP-02  
**Prioridad:** Should Have  
**Story Points:** 5  
**Sprint:** 5

#### Historia

```
Como viajero viendo resultados de búsqueda
Quiero aplicar filtros adicionales
Para encontrar el hotel que mejor se ajuste a mis preferencias
```

#### Criterios de Aceptación

```gherkin
Scenario: Filtrar por rango de precio
  Given un viajero viendo resultados de hoteles
  When selecciona rango de precio "$100 - $200"
  Then los resultados se actualizan automáticamente
  And solo muestra hoteles en ese rango
  And ve contador actualizado "23 hoteles encontrados"
  And puede limpiar filtro con [X]

Scenario: Filtrar por categoría (estrellas)
  Given un viajero en resultados
  When selecciona "5 estrellas"
  Then solo muestra hoteles de 5 estrellas
  And puede seleccionar múltiples categorías

Scenario: Filtrar por servicios
  Given un viajero viendo resultados
  When selecciona servicios:
    | WiFi gratis    |
    | Piscina        |
    | Desayuno       |
  Then muestra solo hoteles con TODOS esos servicios (AND logic)
  And ve badge en cada resultado indicando servicios

Scenario: Múltiples filtros combinados
  Given un viajero aplica:
    | Precio:      | $150 - $250     |
    | Categoría:   | 4-5 estrellas   |
    | Servicios:   | WiFi, Piscina   |
  Then ve resultados que cumplen TODOS los criterios
  And puede ver/ocultar panel de filtros en móvil

Scenario: Limpiar todos los filtros
  Given un viajero con múltiples filtros aplicados
  When hace clic en "Limpiar filtros"
  Then todos los filtros se desmarcan
  And ve resultados originales sin filtrar
```

---

## EP-03: Gestión de Reservas

### HU-010: Crear Reserva

**ID:** HU-010  
**Nombre:** Como viajero quiero reservar una habitación  
**Épica:** EP-03  
**Prioridad:** Must Have  
**Story Points:** 13  
**Sprint:** 3

#### Historia

```
Como viajero que encontró un hotel adecuado
Quiero reservar una habitación para mis fechas
Para asegurar mi alojamiento
```

#### Criterios de Aceptación

```gherkin
Scenario: Reserva exitosa paso a paso
  Given un viajero autenticado en detalle de hotel
  When selecciona habitación "Suite Deluxe"
  And selecciona fechas check-in "2026-12-10" check-out "2026-12-15"
  And ingresa datos de huéspedes:
    | Adultos | Niños |
    | 2       | 1     |
  And hace clic en "Continuar"
  Then ve resumen de reserva con:
    | Hotel           | Hotel Paradise              |
    | Habitación      | Suite Deluxe                |
    | Fechas          | 10/12/2026 - 15/12/2026     |
    | Noches          | 5                           |
    | Precio/noche    | $180.00                     |
    | Subtotal        | $900.00                     |
    | Descuento       | -$45.00 (5% descuento)      |
    | Total           | $855.00                     |
  And ve políticas de cancelación
  And puede agregar solicitudes especiales (opcional)

  When hace clic en "Confirmar y Pagar"
  Then es redirigido a página de pago
  And la reserva se crea en estado "pendiente"
  And obtiene código de reserva "RES-2026-001234"

Scenario: Habitación no disponible (race condition)
  Given 2 viajeros intentan reservar la última habitación disponible
  When ambos hacen clic en "Reservar" simultáneamente
  Then solo UNO obtiene la reserva
  And el otro ve mensaje "Esta habitación ya no está disponible"
  And se le sugieren alternativas similares

Scenario: Validación de capacidad
  Given un viajero selecciona habitación para 2 personas
  When intenta agregar 4 adultos
  Then ve error "Esta habitación tiene capacidad para máximo 2 adultos"
  And ve sugerencia de habitación con mayor capacidad

Scenario: Descuentos automáticos aplicados
  Given un viajero reserva por 7+ noches
  When ve resumen de reserva
  Then ve descuento aplicado "10% por estadía larga"
  And el precio final refleja el descuento

  Given un cliente VIP (5+ reservas previas)
  When crea nueva reserva
  Then ve descuento "15% descuento VIP"
  And ve badge "Cliente VIP" en resumen

Scenario: Reserva sin cuenta (checkout como invitado)
  Given un viajero NO autenticado
  When intenta crear reserva
  Then debe ingresar:
    | Nombre completo    |
    | Email              |
    | Teléfono           |
  And opcionalmente puede crear cuenta
  And puede completar reserva sin cuenta
  And recibe email con código de reserva

Scenario: Políticas de cancelación visibles
  Given un viajero en resumen de reserva
  Then ve claramente:
    """
    Política de Cancelación Flexible:
    - Cancelación gratuita hasta 7 días antes
    - 50% de reembolso entre 3-7 días antes  
    - Sin reembolso menos de 3 días antes
    """
  And debe marcar checkbox "He leído y acepto las políticas"
  And no puede proceder sin aceptar
```

#### Flujo de Pantallas

```
1. [Detalle de Hotel]
   ↓ Seleccionar habitación
2. [Selección de Fechas y Huéspedes]
   ↓ Continuar
3. [Resumen de Reserva]
   ↓ Confirmar y Pagar
4. [Pago]
   ↓ Procesar pago
5. [Confirmación]
```

#### Notas Técnicas

- Uso de transacciones de BD para evitar race conditions
- Lock optimista en tabla de disponibilidad
- Código de reserva: formato RES-{YEAR}-{SEQUENTIAL}
- Enviar email de confirmación asíncrono (cola)
- Reserva expira en 24h si no se paga

---

### HU-011: Ver Mis Reservas

**ID:** HU-011  
**Nombre:** Como cliente quiero ver todas mis reservas  
**Épica:** EP-03  
**Prioridad:** Must Have  
**Story Points:** 5  
**Sprint:** 3

#### Historia

```
Como cliente con reservas
Quiero ver mi historial completo de reservas
Para gestionar mis viajes y ver detalles
```

#### Criterios de Aceptación

```gherkin
Scenario: Ver lista de reservas
  Given un cliente autenticado con 5 reservas
  When accede a "Mis Reservas"
  Then ve lista de sus 5 reservas
  And cada reserva muestra:
    | Código reserva     |
    | Hotel              |
    | Fechas             |
    | Estado             |
    | Precio             |
    | Botón de acciones  |
  And ve tabs para filtrar:
    | Próximas    | (check-in futuro)    |
    | En curso    | (actualmente en hotel)|
    | Pasadas     | (check-out pasado)   |
    | Canceladas  | (canceladas)         |

Scenario: Ver detalle de reserva
  Given un cliente en lista de reservas
  When hace clic en una reserva específica
  Then ve página de detalle con:
    - Código de reserva QR (para check-in móvil)
    - Información completa del hotel
    - Fechas y número de noches
    - Información de huéspedes
    - Precio detallado
    - Estado de pago
    - Política de cancelación
    - Opciones: Modificar, Cancelar, Descargar comprobante

Scenario: Descargar comprobante PDF
  Given un cliente en detalle de reserva confirmada
  When hace clic en "Descargar comprobante"
  Then descarga PDF con:
    - Logo AlecTours
    - Código de reserva y QR
    - Detalles completos
    - Información de contacto hotel
    - Instrucciones de check-in

Scenario: Reservas vacías
  Given un nuevo cliente sin reservas
  When accede a "Mis Reservas"
  Then ve mensaje amigable "Aún no tienes reservas"
  And ve botón "Buscar hoteles"
  And ve imagen ilustrativa
```

---

## EP-04: Procesamiento de Pagos

### HU-014: Pagar Reserva con Tarjeta

**ID:** HU-014  
**Nombre:** Como cliente quiero pagar mi reserva con tarjeta  
**Épica:** EP-04  
**Prioridad:** Must Have  
**Story Points:** 13  
**Sprint:** 3

#### Historia

```
Como cliente con reserva pendiente
Quiero pagar con tarjeta de crédito/débito
Para confirmar mi reserva de forma inmediata
```

#### Criterios de Aceptación

```gherkin
Scenario: Pago exitoso con tarjeta
  Given un cliente en página de pago de reserva RES-2026-001234
  When selecciona "Pagar con tarjeta"
  And ingresa datos de tarjeta:
    | Número          | 4242 4242 4242 4242       |
    | Nombre          | JUAN PEREZ                |
    | Vencimiento     | 12/2028                   |
    | CVV             | 123                       |
  And hace clic en "Pagar $855.00"
  Then ve indicador de "Procesando pago..."
  And el pago se procesa a través de Stripe
  And la reserva cambia a estado "confirmada"
  And ve página de confirmación:
    """
    ¡Pago exitoso! ✅
    Tu reserva RES-2026-001234 está confirmada
    Hemos enviado los detalles a tu email
    """
  And recibe email con:
    - Confirmación de pago
    - Comprobante PDF adjunto
    - Instrucciones de check-in

Scenario: Tarjeta rechazada
  Given un cliente intentando pagar
  When ingresa tarjeta con fondos insuficientes
  Then el pago falla
  And ve mensaje "Tu tarjeta fue rechazada"
  And ve razón específica si está disponible
  And puede reintentar con otra tarjeta
  And la reserva permanece en estado "pendiente"
  And se registra intento fallido

Scenario: Información de tarjeta inválida
  Given un cliente ingresa CVV de 2 dígitos
  Then ve error en tiempo real "CVV debe tener 3 dígitos"
  And el botón "Pagar" está deshabilitado

  Given un cliente ingresa tarjeta expirada
  Then ve error "Tarjeta expirada"
  And no se permite enviar

Scenario: Seguridad de datos de tarjeta
  Given el sistema procesa un pago
  Then NUNCA almacena número completo de tarjeta
  And solo guarda:
    - Últimos 4 dígitos
    - Marca (Visa, Mastercard)
    - Token de Stripe (para reembolsos)
  And los datos de tarjeta NO pasan por servidor backend
  And se usa iFrame de Stripe para captura segura

Scenario: Comprobante de pago
  Given un pago exitoso
  Then se genera registro de pago con:
    | ID transacción (Stripe)  |
    | Monto                    |
    | Fecha/hora               |
    | Últimos 4 dígitos tarjeta|
    | Estado: exitoso          |
  And cliente puede descargar comprobante en cualquier momento
```

#### Integración con Stripe

```javascript
// Frontend - React
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const handlePay = async () => {
  const stripe = useStripe();
  const elements = useElements();
  
  // 1. Crear intención de pago en backend
  const { clientSecret } = await api.post('/api/v1/pagos/intent', {
    reserva_id: reservaId,
    monto: 855.00
  });
  
  // 2. Confirmar pago con Stripe
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Juan Perez'
        }
      }
    }
  );
  
  if (error) {
    // Manejar error
    setError(error.message);
  } else if (paymentIntent.status === 'succeeded') {
    // Pago exitoso
    navigate(`/reservas/${reservaId}/confirmacion`);
  }
};
```

---

## EP-06: Reseñas y Valoraciones

### HU-019: Escribir Reseña de Hotel

**ID:** HU-019  
**Nombre:** Como cliente quiero dejar una reseña de mi estadía  
**Épica:** EP-06  
**Prioridad:** Should Have  
**Story Points:** 5  
**Sprint:** 6

#### Historia

```
Como cliente que completó una estadía
Quiero compartir mi experiencia del hotel
Para ayudar a otros viajeros a tomar decisiones informadas
```

#### Criterios de Aceptación

```gherkin
Scenario: Escribir reseña completa
  Given un cliente con reserva completada hace 2 días
  When recibe email solicitando reseña
  And hace clic en "Escribir reseña"
  Then ve formulario con:
    | Calificación general (1-5 estrellas) | Requerido |
    | Título de reseña                     | Requerido |
    | Comentario (20-2000 caracteres)      | Requerido |
    | Calificaciones detalladas:           | Opcional  |
    |   - Limpieza                         |           |
    |   - Ubicación                        |           |
    |   - Servicios                        |           |
    |   - Personal                         |           |
    |   - Relación calidad-precio          |           |
  
  When completa todos los campos:
    | General:       | 5 estrellas                    |
    | Título:        | "Excelente experiencia"        |
    | Comentario:    | "Hotel increíble, personal..." |
    | Limpieza:      | 5                              |
    | Ubicación:     | 4                              |
  And hace clic en "Publicar reseña"
  Then la reseña se guarda en estado "pendiente moderación"
  And ve mensaje "Gracias por tu reseña. La publicaremos en 24-48 horas"
  And NO puede escribir otra reseña para la misma reserva

Scenario: Validaciones de reseña
  Given un cliente escribiendo reseña
  When intenta publicar sin calificación
  Then ve error "Debes seleccionar una calificación"

  When escribe comentario de 10 caracteres
  Then ve error "El comentario debe tener al menos 20 caracteres"
  And ve contador "10 / 20 caracteres mínimo"

Scenario: Solo clientes verificados pueden reseñar
  Given un usuario que NO tiene reserva en ese hotel
  When intenta escribir reseña
  Then ve mensaje "Solo puedes reseñar hoteles donde te has hospedado"

  Given un usuario con reserva NO completada
  When intenta reseñar
  Then ve mensaje "Podrás reseñar después de tu check-out"

Scenario: Límite de tiempo para reseñar
  Given una reserva completada hace 91 días
  When intenta escribir reseña
  Then ve mensaje "Solo puedes reseñar estadías de los últimos 90 días"

Scenario: Reseña incluye badge "Reserva verificada"
  Given una reseña aprobada de cliente real
  When otros usuarios ven la reseña
  Then ven badge "✓ Reserva verificada"
  And aumenta credibilidad
```

---

## EP-11: Reportes y Analytics

### HU-035: Ver Dashboard Administrativo

**ID:** HU-035  
**Nombre:** Como administrador quiero ver métricas clave del negocio  
**Épica:** EP-11  
**Prioridad:** Must Have  
**Story Points:** 8  
**Sprint:** 4

#### Historia

```
Como administrador
Quiero ver un dashboard con métricas clave del negocio
Para monitorear el desempeño y tomar decisiones informadas
```

#### Criterios de Aceptación

```gherkin
Scenario: Dashboard con métricas en tiempo real
  Given un administrador autenticado
  When accede al dashboard administrativo
  Then ve sección "Hoy" con:
    | Métrica                 | Ejemplo  |
    | Reservas hoy            | 45       |
    | Ingresos hoy            | $12,500  |
    | Check-ins hoy           | 23       |
    | Check-outs hoy          | 19       |
    | Ocupación actual        | 78%      |
    | Nuevos clientes         | 12       |
  
  And ve sección "Este Mes" con:
    | Reservas totales        | 1,234    |
    | Ingresos totales        | $345,000 |
    | Tasa de cancelación     | 10.9%    |
    | Ocupación promedio      | 72.5%    |
  
  And ve gráficos:
    | Ingresos últimos 30 días (línea)          |
    | Reservas por día (barras)                 |
    | Top 5 hoteles por ingresos (barras horiz) |
    | Distribución por origen de reserva (pie)  |

Scenario: Filtrar por rango de fechas
  Given un admin en el dashboard
  When selecciona rango "Último trimestre"
  Then todas las métricas se actualizan
  And los gráficos reflejan el nuevo período
  And puede exportar datos a Excel

Scenario: Alertas y notificaciones
  Given un admin en el dashboard
  Then ve sección de "Alertas" con:
    | ⚠️ Hotel Beach Resort con 45% ocupación este fin de semana |
    | ℹ️ 7 comprobantes pendientes de verificación                |
    | ℹ️ 12 reseñas esperando moderación                          |
  And puede hacer clic para actuar sobre cada alerta

Scenario: Comparación con período anterior
  Given un admin viendo métricas del mes actual
  Then ve comparación con mes anterior:
    | Ingresos:      | $345,000 | ▲ +7.1% vs mes anterior |
    | Reservas:      | 1,234    | ▲ +3.2% vs mes anterior |
    | Cancelaciones: | 134      | ▼ -2.1% vs mes anterior |
  And íconos visuales indican tendencia (▲ verde, ▼ rojo)
```

---

## Product Backlog Priorizado

### Sprint 1: Fundamentos (Semanas 1-2)

**Objetivo:** Establecer autenticación y catálogo básico

| HU | Nombre | SP | Prioridad | Asignado |
|----|--------|----|-----------|-----------| 
| HU-001 | Registro de Cuenta | 5 | Must Have | Backend Team |
| HU-002 | Verificación Email | 3 | Must Have | Backend Team |
| HU-003 | Inicio de Sesión | 3 | Must Have | Backend Team |
| HU-004 | Recuperación Contraseña | 5 | Must Have | Backend Team |
| HU-027 | Registrar Hotel | 8 | Must Have | Backend Team |
| HU-028 | Gestionar Habitaciones | 8 | Must Have | Backend Team |

**Total SP:** 32  
**Velocidad estimada:** 30-35 SP por sprint

---

### Sprint 2: Búsqueda y Descubrimiento (Semanas 3-4)

**Objetivo:** Permitir a usuarios encontrar hoteles

| HU | Nombre | SP | Prioridad |
|----|--------|----|-----------|
| HU-005 | Búsqueda Básica | 8 | Must Have |
| HU-008 | Detalle de Hotel | 5 | Must Have |
| HU-030 | Buscar Cliente | 3 | Must Have |
| HU-031 | Crear Reserva (Empleado) | 8 | Must Have |
| HU-009 | Destinos Populares | 3 | Should Have |

**Total SP:** 27

---

### Sprint 3: Core de Reservas (Semanas 5-6)

**Objetivo:** Implementar flujo completo de reserva y pago

| HU | Nombre | SP | Prioridad |
|----|--------|----|-----------|
| HU-010 | Crear Reserva | 13 | Must Have |
| HU-011 | Ver Mis Reservas | 5 | Must Have |
| HU-014 | Pagar con Tarjeta | 13 | Must Have |
| HU-023 | Notificaciones Email | 5 | Must Have |

**Total SP:** 36  
**Nota:** Sprint más pesado, considerar extender o dividir HU-014

---

### Sprint 4: Gestión Avanzada (Semanas 7-8)

**Objetivo:** Cancelaciones, reportes y gestión administrativa

| HU | Nombre | SP | Prioridad |
|----|--------|----|-----------|
| HU-012 | Cancelar Reserva | 8 | Must Have |
| HU-033 | Aprobar Cancelación | 5 | Must Have |
| HU-035 | Dashboard Admin | 8 | Must Have |
| HU-038 | Gestionar Usuarios | 8 | Must Have |

**Total SP:** 29

---

### Sprint 5-8: Funcionalidades Adicionales

**Sprints posteriores incluyen:**
- Filtros avanzados de búsqueda
- Modificación de reservas
- Sistema de reseñas
- Paquetes turísticos
- Reportes avanzados
- Favoritos

---

## Criterios de Definición de Listo (DoR)

Una historia está **lista para desarrollo** cuando cumple:

- [ ] Historia escrita en formato estándar (Como... Quiero... Para...)
- [ ] Criterios de aceptación claros en formato Gherkin
- [ ] Wireframes o mockups para historias de UI
- [ ] Dependencias técnicas identificadas
- [ ] Story points estimados por el equipo
- [ ] Sin dependencias bloqueantes
- [ ] Product Owner disponible para aclaraciones
- [ ] Reglas de negocio documentadas

---

## Criterios de Definición de Hecho (DoD)

Una historia está **completa** cuando cumple:

### Código
- [ ] Código implementado según criterios de aceptación
- [ ] Código revisado y aprobado (peer review)
- [ ] Sin deuda técnica crítica introducida
- [ ] Código cumple estándares de estilo (linter pasa)

### Testing
- [ ] Tests unitarios escritos (cobertura >= 70%)
- [ ] Tests de integración para flujos principales
- [ ] Tests E2E para historias de usuario críticas
- [ ] Tests manuales de QA completados

### Documentación
- [ ] Documentación API actualizada (Swagger)
- [ ] README actualizado si aplica
- [ ] Comentarios en código complejo

### Calidad
- [ ] Sin bugs críticos conocidos
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Responsive en móvil, tablet, desktop
- [ ] Cumple requisitos de accesibilidad (WCAG AA)

### Despliegue
- [ ] Desplegado en ambiente de staging
- [ ] Product Owner aceptó la funcionalidad
- [ ] Métricas de monitoreo configuradas

---

## Velocity Tracking

### Velocidad Histórica del Equipo

| Sprint | SP Comprometidos | SP Completados | Velocity | Notas |
|--------|------------------|----------------|----------|-------|
| Sprint 1 | 32 | 30 | 30 | Buena estimación inicial |
| Sprint 2 | 27 | 27 | 27 | 100% completado |
| Sprint 3 | 36 | 31 | 31 | HU-014 más compleja de lo estimado |
| Sprint 4 | 29 | 29 | 29 | En progreso |

**Velocidad Promedio:** 29 SP/sprint  
**Desviación Estándar:** 1.7 SP

### Burn-down Chart Example

```
Story Points Remaining
│
80│ ╲
  │   ╲
60│     ╲        Línea ideal
  │       ╲      
40│         ○----╲       
  │           ○---○--╲   Progreso real
20│                 ○--○
  │                     ╲
 0└──────────────────────○───> Días
  0  2  4  6  8  10 12 14
```

---

## Retrospectivas y Mejoras

### Template de Retrospectiva

**¿Qué salió bien?**
- [Ejemplo] Colaboración entre frontend y backend fue excelente
- [Ejemplo] Tests automatizados ayudaron a detectar bugs temprano

**¿Qué puede mejorar?**
- [Ejemplo] Estimaciones de HU complejas necesitan más análisis
- [Ejemplo] Reuniones de refinamiento muy largas

**Acciones para siguiente sprint:**
- [ ] Hacer spike técnico para HU >8 SP
- [ ] Limitar refinamiento a 1 hora máximo

---

## Glosario

| Término | Definición |
|---------|------------|
| Story Point (SP) | Unidad de estimación relativa de complejidad |
| Sprint | Iteración de 2 semanas de desarrollo |
| Épica | Conjunto de historias relacionadas funcionalmente |
| DoR | Definition of Ready - cuándo una historia está lista para desarrollo |
| DoD | Definition of Done - cuándo una historia está completada |
| Velocity | Story Points completados por sprint (promedio) |
| Spike | Investigación técnica time-boxed |
| Backlog | Lista priorizada de trabajo pendiente |

---

## Control de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Agosto 2026 | Product Owner | Versión inicial con 42 historias |
| 2.0 | Agosto 30, 2026 | Kiro AI | Versión detallada con criterios Gherkin y mejores prácticas |

---

**Fin del Documento**
