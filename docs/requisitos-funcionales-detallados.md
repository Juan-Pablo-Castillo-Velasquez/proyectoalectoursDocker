# Requisitos Funcionales Detallados - AlecTours

**Versión:** 2.0  
**Fecha:** Agosto 30, 2026  
**Proyecto:** Sistema de Gestión Turística AlecTours  
**Estado:** Documento Actualizado

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Alcance y Contexto](#alcance-y-contexto)
3. [Módulos del Sistema](#módulos-del-sistema)
4. [Requisitos por Módulo](#requisitos-por-módulo)
5. [Matriz de Trazabilidad](#matriz-de-trazabilidad)
6. [Validación y Verificación](#validación-y-verificación)

---

## Introducción

### Propósito del Documento

Este documento define de forma exhaustiva y técnica todos los requisitos funcionales del sistema AlecTours, estableciendo qué debe hacer el sistema desde la perspectiva del usuario y del negocio.

### Audiencia

- **Product Owner y Stakeholders:** Para validar que el sistema cumple con las necesidades del negocio
- **Equipo de Desarrollo:** Como especificación técnica para implementación
- **QA/Testing:** Como base para casos de prueba
- **Arquitectos:** Para diseño de soluciones

### Definiciones y Acrónimos

| Término | Definición |
|---------|------------|
| JWT | JSON Web Token - Mecanismo de autenticación basado en tokens |
| ORM | Object-Relational Mapping - Mapeo objeto-relacional |
| API | Application Programming Interface - Interfaz de programación |
| CRUD | Create, Read, Update, Delete - Operaciones básicas |
| RTO | Recovery Time Objective - Tiempo objetivo de recuperación |
| RPO | Recovery Point Objective - Punto objetivo de recuperación |

---

## Alcance y Contexto

### Descripción del Sistema

AlecTours es una plataforma web integral para la gestión de servicios turísticos que permite:

- **A clientes:** Buscar, reservar y gestionar estadías en hoteles
- **A empleados:** Administrar inventario, reservas y atención al cliente
- **A administradores:** Supervisar operaciones, analizar métricas y configurar el sistema

### Contexto de Operación

El sistema opera en un entorno de producción con las siguientes características:

- **Arquitectura:** Microservicios con frontend React y backend FastAPI
- **Base de datos:** PostgreSQL con replicación
- **Caché:** Redis para sesiones y datos temporales
- **Infraestructura:** Contenedores Docker orquestados
- **Monitoreo:** Prometheus + Grafana

### Módulos Principales

1. **Autenticación y Usuarios** - Gestión de identidad y acceso
2. **Hoteles y Habitaciones** - Catálogo de alojamiento
3. **Reservas** - Motor de reservaciones
4. **Clientes** - Gestión de información de clientes
5. **Paquetes Turísticos** - Ofertas combinadas
6. **Pagos** - Procesamiento de transacciones
7. **Notificaciones** - Comunicación con usuarios
8. **Reseñas** - Retroalimentación de clientes
9. **Favoritos** - Lista de deseos
10. **Destinos** - Catálogo de ubicaciones
11. **Empresas** - Gestión de proveedores
12. **Cancelaciones** - Proceso de cancelación y reembolsos
13. **Dashboard** - Análisis y reportes
14. **Banners** - Promoción visual
15. **Configuración** - Parámetros del sistema

---

## Requisitos por Módulo

## 1. Módulo de Autenticación y Usuarios

### RF-AUTH-001: Registro de Usuario

**ID:** RF-AUTH-001  
**Nombre:** Registro de nuevos usuarios  
**Prioridad:** Crítica (Must Have)  
**Complejidad:** Media  
**Épica:** EP-01 Autenticación y Registro

#### Descripción Detallada

El sistema debe permitir que cualquier visitante cree una cuenta de usuario proporcionando información básica personal. Este es el punto de entrada principal para nuevos clientes.

#### Actores

- **Principal:** Usuario anónimo (visitante)
- **Secundario:** Sistema de email

#### Precondiciones

- Usuario no tiene cuenta existente
- Sistema de email está operativo
- Base de datos está disponible

#### Postcondiciones Exitosas

- Cuenta de usuario creada en estado "no verificado"
- Email de verificación enviado
- Usuario puede iniciar sesión después de verificar

#### Postcondiciones de Fallo

- No se crea cuenta
- Usuario recibe mensaje de error específico

#### Flujo Principal

1. Usuario accede a la página de registro
2. Usuario completa formulario con:
   - Nombre completo (validación: 2-100 caracteres)
   - Email (validación: formato RFC 5322)
   - Contraseña (validación: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número)
   - Confirmación de contraseña (debe coincidir)
3. Usuario acepta términos y condiciones
4. Usuario envía formulario
5. Sistema valida datos del formulario
6. Sistema verifica que el email no esté registrado
7. Sistema hashea la contraseña con bcrypt (cost factor 12)
8. Sistema crea registro de usuario en BD
9. Sistema genera token de verificación único
10. Sistema envía email con enlace de verificación
11. Sistema muestra mensaje: "Cuenta creada. Verifica tu email"
12. Usuario hace clic en enlace del email
13. Sistema valida token de verificación
14. Sistema marca cuenta como "verificada"
15. Sistema muestra confirmación de activación

#### Flujos Alternativos

**FA-001: Email ya registrado**
- En paso 6, si email existe:
  - Sistema retorna error 409 Conflict
  - Mensaje: "Este email ya está registrado. ¿Olvidaste tu contraseña?"
  - Flujo termina

**FA-002: Contraseña débil**
- En paso 5, si contraseña no cumple requisitos:
  - Sistema retorna error 400 Bad Request
  - Mensaje específico sobre requisito no cumplido
  - Flujo termina

**FA-003: Token de verificación expirado**
- En paso 13, si token expiró (> 24 horas):
  - Sistema ofrece reenviar email
  - Flujo retorna a paso 10

#### Reglas de Negocio

| ID | Regla | Justificación |
|----|-------|---------------|
| RN-001 | Email único por cuenta | Prevenir duplicados y usar email como identificador |
| RN-002 | Contraseña mínimo 8 caracteres | Balance entre seguridad y usabilidad |
| RN-003 | Verificación obligatoria | Confirmar propiedad del email |
| RN-004 | Token expira en 24 horas | Límite de seguridad razonable |

#### Criterios de Aceptación

```gherkin
Scenario: Registro exitoso de nuevo usuario
  Given un visitante en la página de registro
  When completa el formulario con datos válidos
  And acepta términos y condiciones
  And envía el formulario
  Then se crea una cuenta en estado "no verificado"
  And recibe un email de verificación
  And ve mensaje de confirmación

Scenario: Intento de registro con email existente
  Given un visitante en la página de registro
  When intenta registrarse con email ya usado
  Then ve error "Email ya registrado"
  And no se crea nueva cuenta

Scenario: Registro con contraseña débil
  Given un visitante en la página de registro
  When ingresa contraseña con menos de 8 caracteres
  Then ve error "Contraseña debe tener al menos 8 caracteres"
  And no puede enviar formulario
```

#### Validaciones Técnicas

| Campo | Validaciones |
|-------|--------------|
| Nombre | • Requerido<br>• Mínimo 2 caracteres<br>• Máximo 100 caracteres<br>• Solo letras, espacios, tildes<br>• Trim de espacios |
| Email | • Requerido<br>• Formato válido (regex RFC 5322)<br>• Máximo 255 caracteres<br>• Normalizado a lowercase<br>• Único en sistema |
| Contraseña | • Requerido<br>• Mínimo 8 caracteres<br>• Al menos 1 mayúscula<br>• Al menos 1 minúscula<br>• Al menos 1 número<br>• Permitir caracteres especiales |

#### Seguridad

- **Protección:** Rate limiting de 5 intentos/minuto por IP
- **Hashing:** bcrypt con cost factor 12
- **Token:** UUID v4 aleatorio para verificación
- **HTTPS:** Obligatorio para transmisión de contraseña

#### Dependencias

- Servicio de email (SMTP configurado)
- Base de datos PostgreSQL
- Redis para rate limiting

#### Estimación

- **Story Points:** 5
- **Tiempo estimado:** 1-2 días de desarrollo

---

### RF-AUTH-002: Inicio de Sesión

**ID:** RF-AUTH-002  
**Nombre:** Autenticación de usuarios registrados  
**Prioridad:** Crítica (Must Have)  
**Complejidad:** Media  
**Épica:** EP-01 Autenticación y Registro

#### Descripción Detallada

Permite a usuarios con cuenta verificada autenticarse en el sistema mediante credenciales (email y contraseña), obteniendo acceso a funcionalidades protegidas.

#### Actores

- **Principal:** Usuario registrado y verificado
- **Secundario:** Sistema de autenticación JWT

#### Precondiciones

- Usuario tiene cuenta creada y verificada
- Credenciales son correctas
- Cuenta no está bloqueada

#### Postcondiciones Exitosas

- Usuario autenticado en el sistema
- Token JWT generado y retornado
- Sesión activa por 30 minutos

#### Flujo Principal

1. Usuario accede a página de login
2. Usuario ingresa email y contraseña
3. Usuario hace clic en "Iniciar sesión"
4. Sistema valida formato de datos
5. Sistema busca usuario por email
6. Sistema verifica hash de contraseña
7. Sistema verifica que cuenta esté verificada y activa
8. Sistema genera token JWT con:
   - user_id
   - role (admin/empleado/cliente)
   - exp (expiración 30 minutos)
9. Sistema registra fecha/hora de último login
10. Sistema retorna:
    - Token JWT
    - Datos básicos de usuario (nombre, email, rol)
11. Frontend almacena token en memoria
12. Usuario redirigido al dashboard correspondiente

#### Flujos Alternativos

**FA-001: Credenciales incorrectas**
- En paso 6, si contraseña no coincide:
  - Sistema incrementa contador de intentos fallidos
  - Sistema retorna error 401 Unauthorized
  - Mensaje: "Email o contraseña incorrectos"
  - No revelar qué dato es incorrecto (seguridad)

**FA-002: Cuenta no verificada**
- En paso 7, si cuenta no verificada:
  - Sistema retorna error 403 Forbidden
  - Mensaje: "Debes verificar tu email antes de iniciar sesión"
  - Opción de reenviar email de verificación

**FA-003: Cuenta bloqueada por intentos**
- En paso 5, si cuenta tiene > 5 intentos fallidos en última hora:
  - Sistema retorna error 429 Too Many Requests
  - Mensaje: "Cuenta temporalmente bloqueada. Intenta en 1 hora"
  - Opción de recuperar contraseña

#### Reglas de Negocio

| ID | Regla | Justificación |
|----|-------|---------------|
| RN-005 | Token JWT expira en 30 min | Balance entre seguridad y UX |
| RN-006 | Máximo 5 intentos/hora | Protección contra fuerza bruta |
| RN-007 | Solo cuentas verificadas | Asegurar email válido |
| RN-008 | Mensajes genéricos en error | No revelar info sobre usuarios |

#### Criterios de Aceptación

```gherkin
Scenario: Login exitoso
  Given un usuario con cuenta verificada
  When ingresa email y contraseña correctos
  Then obtiene token JWT válido
  And ve su dashboard personalizado
  And la sesión dura 30 minutos

Scenario: Login con credenciales incorrectas
  Given un usuario en la página de login
  When ingresa contraseña incorrecta
  Then ve error genérico "Email o contraseña incorrectos"
  And no obtiene acceso

Scenario: Login de cuenta no verificada
  Given un usuario que no verificó su email
  When intenta iniciar sesión
  Then ve error "Debes verificar tu email"
  And puede reenviar email de verificación
```

#### Seguridad

- **Rate Limiting:** 5 intentos/minuto por IP
- **Bloqueo temporal:** 1 hora después de 5 fallos
- **Token seguro:** JWT firmado con SECRET_KEY
- **HTTPS obligatorio:** Para proteger credenciales en tránsito
- **Sin cookies:** Token solo en memoria (no localStorage por XSS)

---

### RF-AUTH-003: Recuperación de Contraseña

**ID:** RF-AUTH-003  
**Nombre:** Proceso de restablecimiento de contraseña olvidada  
**Prioridad:** Alta (Must Have)  
**Complejidad:** Media  
**Épica:** EP-01 Autenticación y Registro

#### Descripción Detallada

Permite a usuarios que olvidaron su contraseña restablecerla de forma segura mediante un enlace enviado a su email registrado.

#### Flujo Principal

1. Usuario hace clic en "¿Olvidaste tu contraseña?" en login
2. Usuario ingresa su email registrado
3. Sistema valida formato de email
4. Sistema busca usuario por email (sin revelar si existe)
5. Si existe: Sistema genera token único de recuperación
6. Sistema almacena token con expiración de 1 hora
7. Sistema envía email con enlace de recuperación
8. Sistema muestra: "Si el email existe, recibirás instrucciones"
9. Usuario hace clic en enlace del email
10. Sistema valida token de recuperación
11. Sistema muestra formulario de nueva contraseña
12. Usuario ingresa y confirma nueva contraseña
13. Sistema valida requisitos de contraseña
14. Sistema hashea nueva contraseña
15. Sistema actualiza contraseña en BD
16. Sistema invalida token de recuperación
17. Sistema invalida todos los tokens JWT activos del usuario
18. Sistema muestra: "Contraseña actualizada exitosamente"
19. Usuario redirigido a login

#### Flujos Alternativos

**FA-001: Email no registrado**
- En paso 4, si email no existe:
  - Sistema NO revela que email no existe (seguridad)
  - Muestra mismo mensaje de confirmación
  - No envía email
  - Flujo termina exitosamente (aparentemente)

**FA-002: Token expirado**
- En paso 10, si token expiró (> 1 hora):
  - Sistema muestra: "Este enlace expiró. Solicita uno nuevo"
  - Opción de volver a solicitar recuperación

**FA-003: Token ya usado**
- En paso 10, si token ya fue utilizado:
  - Sistema muestra: "Este enlace ya fue usado"
  - Flujo termina

#### Reglas de Negocio

| ID | Regla | Justificación |
|----|-------|---------------|
| RN-009 | Token expira en 1 hora | Ventana de tiempo razonable |
| RN-010 | Token de un solo uso | Prevenir reutilización |
| RN-011 | Máximo 3 solicitudes/hora | Prevenir abuso |
| RN-012 | No revelar usuarios existentes | Seguridad contra enumeración |

---

## 2. Módulo de Hoteles

### RF-HOT-001: Catálogo de Hoteles

**ID:** RF-HOT-001  
**Nombre:** Gestión completa del catálogo de hoteles  
**Prioridad:** Alta (Must Have)  
**Complejidad:** Alta  
**Épica:** EP-09 Gestión de Hoteles

#### Descripción Detallada

El sistema debe mantener un catálogo completo y actualizado de todos los hoteles disponibles, permitiendo operaciones CRUD completas con validaciones de integridad.

#### Modelo de Datos - Hotel

```python
class Hotel:
    id: UUID
    nombre: str  # 3-200 caracteres
    direccion: str  # 10-500 caracteres
    ciudad: str  # 2-100 caracteres
    pais: str  # 2-100 caracteres
    codigo_postal: str?  # opcional
    latitud: float?  # -90 a 90
    longitud: float?  # -180 a 180
    categoria: int  # 1-5 estrellas
    descripcion: str  # 50-5000 caracteres
    destino_id: UUID  # FK a Destino
    empresa_id: UUID?  # FK a Empresa
    telefono: str  # formato internacional
    email: str  # formato válido
    sitio_web: str?  # URL válida
    check_in_hora: time  # ej: 14:00
    check_out_hora: time  # ej: 12:00
    politicas_cancelacion: str
    imagenes: List[str]  # URLs de imágenes
    servicios: List[str]  # wifi, piscina, etc
    estado: enum  # activo, inactivo, mantenimiento
    calificacion_promedio: float  # calculado
    numero_resenas: int  # calculado
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    updated_by: UUID
```

#### Operaciones CRUD

**CREATE - Crear Hotel**

- **Actor:** Administrador o Empleado
- **Endpoint:** `POST /api/v1/hoteles`
- **Validaciones:**
  - Todos los campos requeridos presentes
  - Nombre único por ciudad
  - Coordenadas válidas si se proporcionan
  - Al menos 1 imagen
  - Destino existe
  - Email único entre hoteles
- **Proceso:**
  1. Validar permisos del usuario
  2. Validar datos del hotel
  3. Verificar unicidad de nombre en ciudad
  4. Validar que destino existe
  5. Crear registro en BD
  6. Procesar y optimizar imágenes
  7. Almacenar imágenes en storage
  8. Retornar hotel creado

**READ - Listar/Buscar Hoteles**

- **Actor:** Cualquier usuario (público)
- **Endpoint:** `GET /api/v1/hoteles`
- **Filtros disponibles:**
  - `destino_id`: Filtrar por destino
  - `categoria`: Filtrar por estrellas
  - `servicios`: Filtrar por servicios (AND logic)
  - `precio_min`, `precio_max`: Rango de precio
  - `disponible`: Solo hoteles con habitaciones disponibles
  - `check_in`, `check_out`: Fechas de disponibilidad
- **Ordenamiento:**
  - `orden`: precio_asc, precio_desc, calificacion, popularidad
- **Paginación:**
  - `pagina`: número de página (default 1)
  - `por_pagina`: items por página (default 20, max 100)

**READ - Detalle de Hotel**

- **Actor:** Cualquier usuario
- **Endpoint:** `GET /api/v1/hoteles/{hotel_id}`
- **Retorna:**
  - Información completa del hotel
  - Lista de habitaciones disponibles
  - Reseñas recientes (últimas 10)
  - Hoteles cercanos similares

**UPDATE - Actualizar Hotel**

- **Actor:** Administrador o Empleado
- **Endpoint:** `PUT /api/v1/hoteles/{hotel_id}`
- **Validaciones:**
  - Hotel existe
  - Usuario tiene permisos
  - Datos válidos
  - No hay reservas activas si se desactiva
- **Proceso:**
  1. Validar permisos
  2. Verificar existencia del hotel
  3. Validar datos actualizados
  4. Actualizar registro en BD
  5. Registrar cambio en auditoría
  6. Invalidar caché relacionado

**DELETE - Eliminar Hotel (Soft Delete)**

- **Actor:** Solo Administrador
- **Endpoint:** `DELETE /api/v1/hoteles/{hotel_id}`
- **Validaciones:**
  - Hotel existe
  - No tiene reservas activas o futuras
  - Usuario es administrador
- **Proceso:**
  1. Validar permisos (solo admin)
  2. Verificar no tenga reservas activas
  3. Marcar como `estado='inactivo'`
  4. No eliminar físicamente (historial)
  5. Excluir de búsquedas públicas

#### Reglas de Negocio

| ID | Regla | Justificación |
|----|-------|---------------|
| RN-013 | Hotel requiere al menos 1 imagen | Calidad de presentación |
| RN-014 | Nombre único por ciudad | Evitar confusión |
| RN-015 | Soft delete obligatorio | Mantener historial de reservas |
| RN-016 | Check-out debe ser después de check-in | Lógica temporal |
| RN-017 | Categoría entre 1-5 estrellas | Estándar de la industria |

#### Criterios de Aceptación

```gherkin
Scenario: Crear hotel exitosamente
  Given un administrador autenticado
  When envía datos válidos de nuevo hotel
  Then el hotel se crea en la base de datos
  And aparece en búsquedas públicas
  And las imágenes están optimizadas

Scenario: Búsqueda de hoteles con filtros
  Given un usuario en la búsqueda de hoteles
  When aplica filtros de precio y servicios
  Then ve solo hoteles que cumplen criterios
  And los resultados están ordenados correctamente

Scenario: Intento de eliminar hotel con reservas activas
  Given un administrador intenta eliminar hotel
  When el hotel tiene reservas activas
  Then ve error "No se puede eliminar hotel con reservas activas"
  And el hotel no se elimina
```

---

### RF-HOT-002: Gestión de Habitaciones

**ID:** RF-HOT-002  
**Nombre:** Administración de habitaciones por hotel  
**Prioridad:** Alta (Must Have)  
**Complejidad:** Alta  
**Épica:** EP-09 Gestión de Hoteles

#### Modelo de Datos - Habitación

```python
class Habitacion:
    id: UUID
    hotel_id: UUID  # FK a Hotel
    numero: str  # ej: "101", "Suite Presidencial"
    tipo: enum  # individual, doble, suite, familiar
    capacidad_adultos: int  # 1-10
    capacidad_ninos: int  # 0-5
    precio_noche: Decimal  # precio base
    descripcion: str
    metros_cuadrados: int?
    imagenes: List[str]
    servicios: List[str]  # tv, minibar, balcon, etc
    estado: enum  # disponible, ocupada, mantenimiento
    cantidad: int  # número de habitaciones de este tipo
    created_at: datetime
    updated_at: datetime
```

#### Funcionalidades

**1. Crear Habitación**

- Validar que hotel existe
- Validar que número de habitación es único en hotel
- Validar capacidad mayor a 0
- Validar precio mayor a 0
- Al menos 1 imagen

**2. Calcular Disponibilidad**

```python
def calcular_disponibilidad(
    habitacion_id: UUID,
    fecha_inicio: date,
    fecha_fin: date
) -> int:
    """
    Retorna número de habitaciones disponibles
    en el rango de fechas dado.
    
    Lógica:
    - Obtener cantidad total de habitaciones
    - Contar reservas confirmadas que se solapan con rango
    - Retornar: total - reservadas
    """
    total = habitacion.cantidad
    reservadas = contar_reservas_solapadas(
        habitacion_id, 
        fecha_inicio, 
        fecha_fin
    )
    return max(0, total - reservadas)
```

**3. Actualizar Precios**

- Permitir definir precio base
- Soportar precios dinámicos por fecha (temporada alta/baja)
- Aplicar descuentos por estadía larga
- Calcular precio total automáticamente

---

## 3. Módulo de Reservas

### RF-RES-001: Motor de Reservas

**ID:** RF-RES-001  
**Nombre:** Sistema completo de gestión de reservas  
**Prioridad:** Crítica (Must Have)  
**Complejidad:** Muy Alta  
**Épica:** EP-03 Reservas

#### Descripción Detallada

El módulo de reservas es el core del sistema. Gestiona todo el ciclo de vida de una reserva desde su creación hasta su finalización, pasando por confirmación, modificación y posible cancelación.

#### Modelo de Datos - Reserva

```python
class Reserva:
    id: UUID
    codigo: str  # único, ej: "RES-2026-001234"
    cliente_id: UUID  # FK a Cliente
    hotel_id: UUID  # FK a Hotel
    habitacion_id: UUID  # FK a Habitacion
    fecha_checkin: date
    fecha_checkout: date
    numero_noches: int  # calculado
    numero_adultos: int
    numero_ninos: int
    precio_noche: Decimal
    precio_total: Decimal  # calculado
    descuento: Decimal  # 0 por defecto
    precio_final: Decimal  # total - descuento
    estado: enum  # pendiente, confirmada, en_curso, completada, cancelada
    metodo_pago: enum  # tarjeta, transferencia, efectivo
    pagado: bool
    observaciones: str?
    solicitud_especial: str?  # cama extra, piso alto, etc
    created_at: datetime
    updated_at: datetime
    cancelada_at: datetime?
    motivo_cancelacion: str?
```

#### Estados de Reserva

```
Flujo normal:
pendiente -> confirmada -> en_curso -> completada

Con cancelación:
pendiente -> cancelada
confirmada -> cancelada
```

#### RF-RES-001-A: Crear Reserva

**Precondiciones:**
- Cliente autenticado o información proporcionada
- Hotel y habitación existen
- Fechas válidas (checkout > checkin)
- Disponibilidad confirmada

**Proceso:**

```python
def crear_reserva(datos: ReservaCreate) -> Reserva:
    # 1. Validar fechas
    validar_fechas(datos.fecha_checkin, datos.fecha_checkout)
    
    # 2. Verificar disponibilidad (con lock para evitar race condition)
    with db.begin():
        disponible = verificar_disponibilidad(
            datos.habitacion_id,
            datos.fecha_checkin,
            datos.fecha_checkout
        )
        if not disponible:
            raise HTTPException(409, "Habitación no disponible")
        
        # 3. Calcular precios
        precio_noche = obtener_precio(datos.habitacion_id, datos.fecha_checkin)
        numero_noches = (datos.fecha_checkout - datos.fecha_checkin).days
        precio_total = precio_noche * numero_noches
        
        # 4. Aplicar descuentos si hay promoción activa
        descuento = calcular_descuento(datos.habitacion_id, numero_noches)
        precio_final = precio_total - descuento
        
        # 5. Generar código único
        codigo = generar_codigo_reserva()
        
        # 6. Crear registro de reserva
        reserva = Reserva(
            codigo=codigo,
            cliente_id=datos.cliente_id,
            hotel_id=datos.hotel_id,
            habitacion_id=datos.habitacion_id,
            fecha_checkin=datos.fecha_checkin,
            fecha_checkout=datos.fecha_checkout,
            numero_noches=numero_noches,
            precio_noche=precio_noche,
            precio_total=precio_total,
            descuento=descuento,
            precio_final=precio_final,
            estado="pendiente",
            pagado=False
        )
        db.add(reserva)
        db.commit()
        
        # 7. Enviar notificación
        enviar_email_confirmacion_reserva(reserva)
        
        return reserva
```

**Validaciones Críticas:**

1. **Validación de Fechas:**
```python
def validar_fechas(checkin: date, checkout: date):
    hoy = date.today()
    
    # Check-in no puede ser en el pasado
    if checkin < hoy:
        raise ValueError("Check-in no puede ser en el pasado")
    
    # Check-out debe ser después de check-in
    if checkout <= checkin:
        raise ValueError("Check-out debe ser después de check-in")
    
    # Estadía máxima: 30 noches
    if (checkout - checkin).days > 30:
        raise ValueError("Estadía máxima: 30 noches")
    
    # Check-in máximo 365 días en futuro
    if (checkin - hoy).days > 365:
        raise ValueError("No se puede reservar con más de 1 año de anticipación")
```

2. **Validación de Disponibilidad:**
```python
def verificar_disponibilidad(
    habitacion_id: UUID,
    checkin: date,
    checkout: date
) -> bool:
    """
    Verifica si hay al menos 1 habitación disponible.
    
    Se considera ocupada si hay solapamiento:
    - Reserva empieza antes del checkout
    - Reserva termina después del checkin
    """
    habitacion = db.query(Habitacion).get(habitacion_id)
    total = habitacion.cantidad
    
    reservadas = db.query(Reserva).filter(
        Reserva.habitacion_id == habitacion_id,
        Reserva.estado.in_(["confirmada", "en_curso"]),
        Reserva.fecha_checkin < checkout,
        Reserva.fecha_checkout > checkin
    ).count()
    
    return (total - reservadas) > 0
```

3. **Cálculo de Precio:**
```python
def calcular_precio(
    habitacion_id: UUID,
    checkin: date,
    checkout: date
) -> Dict[str, Decimal]:
    """
    Calcula precio total considerando:
    - Precio base de habitación
    - Precios dinámicos por fecha (temporada alta/baja)
    - Descuentos por estadía larga
    - Promociones activas
    """
    habitacion = db.query(Habitacion).get(habitacion_id)
    numero_noches = (checkout - checkin).days
    
    # Precio base
    precio_base = habitacion.precio_noche * numero_noches
    
    # Ajustes de temporada
    ajuste_temporada = calcular_ajuste_temporada(checkin, checkout)
    precio_con_temporada = precio_base + ajuste_temporada
    
    # Descuentos
    descuento = 0
    if numero_noches >= 7:  # Descuento por semana
        descuento += precio_con_temporada * Decimal('0.10')  # 10%
    
    promocion = obtener_promocion_activa(habitacion.hotel_id)
    if promocion:
        descuento += precio_con_temporada * (promocion.porcentaje / 100)
    
    return {
        "precio_base": precio_base,
        "ajuste_temporada": ajuste_temporada,
        "subtotal": precio_con_temporada,
        "descuento": descuento,
        "total": precio_con_temporada - descuento
    }
```

#### RF-RES-001-B: Confirmar Reserva

**Trigger:** Pago exitoso

**Proceso:**
1. Validar que reserva está en estado "pendiente"
2. Validar que pago fue procesado
3. Actualizar estado a "confirmada"
4. Marcar como `pagado=True`
5. Actualizar disponibilidad (decrementar)
6. Generar comprobante PDF
7. Enviar email de confirmación con:
   - Código de reserva
   - Detalles de hotel
   - Fechas
   - Instrucciones de check-in
   - Comprobante adjunto
8. Crear notificación en la plataforma
9. Programar emails de recordatorio:
   - 7 días antes
   - 1 día antes

#### RF-RES-001-C: Check-in Digital

**Precondiciones:**
- Reserva en estado "confirmada"
- Fecha actual es el día de check-in o después
- Fecha actual es antes de checkout

**Proceso:**
1. Validar código de reserva
2. Validar estado y fechas
3. Actualizar estado a "en_curso"
4. Registrar timestamp de check-in real
5. Notificar al hotel
6. Generar código QR para servicios del hotel
7. Enviar confirmación al cliente

#### RF-RES-001-D: Check-out

**Precondiciones:**
- Reserva en estado "en_curso"
- Fecha actual >= fecha de checkout

**Proceso:**
1. Validar reserva
2. Calcular cargos adicionales si aplican
3. Procesar pago adicional si hay
4. Actualizar estado a "completada"
5. Registrar timestamp de checkout real
6. Liberar habitación (incrementar disponibilidad)
7. Solicitar reseña al cliente
8. Generar factura final

#### RF-RES-001-E: Modificar Reserva

**Campos Modificables:**
- Fechas (check-in, check-out)
- Número de huéspedes (dentro de capacidad)
- Solicitudes especiales

**No Modificables:**
- Hotel
- Habitación (debe cancelar y crear nueva)
- Cliente

**Restricciones:**
- Solo reservas en estado "pendiente" o "confirmada"
- No modificar si check-in es en menos de 24 horas
- Verificar disponibilidad en nuevas fechas
- Recalcular precio si cambian fechas

**Proceso:**
1. Validar permisos (solo cliente dueño o empleado)
2. Validar restricciones
3. Si cambian fechas: verificar disponibilidad
4. Calcular diferencia de precio
5. Procesar pago adicional o reembolso parcial si aplica
6. Actualizar reserva
7. Registrar en historial de cambios
8. Enviar email con reserva actualizada

#### RF-RES-001-F: Cancelar Reserva

Ver módulo de Cancelaciones (RF-CAN-001)

#### Reglas de Negocio

| ID | Regla | Justificación |
|----|-------|---------------|
| RN-018 | Check-in mínimo 1 noche | Operación del negocio |
| RN-019 | Estadía máxima 30 noches | Prevenir acaparación |
| RN-020 | Reserva máxima 365 días adelantado | Límite razonable |
| RN-021 | Código de reserva único y legible | Facilitar soporte |
| RN-022 | Reserva pendiente expira en 24h sin pago | Liberar inventario |

#### Criterios de Aceptación

```gherkin
Scenario: Crear reserva con disponibilidad
  Given un cliente autenticado
  And una habitación con disponibilidad
  When crea una reserva con fechas válidas
  Then la reserva se crea en estado "pendiente"
  And recibe código de reserva único
  And recibe email de confirmación
  And la disponibilidad se reserva temporalmente

Scenario: Intento de reserva sin disponibilidad
  Given una habitación sin disponibilidad
  When un cliente intenta reservar
  Then ve error "Habitación no disponible"
  And no se crea reserva

Scenario: Modificación de fechas exitosa
  Given una reserva confirmada
  When el cliente cambia las fechas
  And hay disponibilidad en nuevas fechas
  Then la reserva se actualiza
  And se recalcula el precio
  And recibe email con cambios
```

---

## 4. Módulo de Clientes

### RF-CLI-001: Perfil Completo de Cliente

**ID:** RF-CLI-001  
**Nombre:** Gestión integral de datos de cliente  
**Prioridad:** Alta (Must Have)  
**Complejidad:** Media  
**Épica:** EP-10 Gestión de Clientes

#### Modelo de Datos - Cliente

```python
class Cliente:
    id: UUID
    usuario_id: UUID?  # FK a Usuario (opcional para clientes walk-in)
    nombre: str
    apellido: str
    tipo_documento: enum  # dni, pasaporte, cedula
    numero_documento: str  # único
    nacionalidad: str
    fecha_nacimiento: date
    genero: enum?  # masculino, femenino, otro, prefiero_no_decir
    telefono: str
    email: str  # único
    direccion: str?
    ciudad: str?
    pais: str?
    codigo_postal: str?
    preferencias: JSONB  # {tipo_habitacion, servicios_preferidos, etc}
    es_vip: bool  # calculado automáticamente
    puntos_fidelidad: int
    notas_internas: str?  # Solo visible para empleados
    acepta_marketing: bool
    created_at: datetime
    updated_at: datetime
```

#### Funcionalidades

**1. Crear Cliente**

- Por usuario al registrarse
- Por empleado al crear reserva

**2. Ver Perfil de Cliente**

```gherkin
Scenario: Cliente ve su propio perfil
  Given un cliente autenticado
  When accede a su perfil
  Then ve su información personal
  And ve su historial de reservas
  And ve sus preferencias
  And ve sus métodos de pago guardados
  And puede editar su información

Scenario: Empleado ve perfil de cliente
  Given un empleado autenticado
  When busca un cliente
  Then ve información completa del cliente
  And ve historial de reservas
  And ve notas internas
  And puede agregar notas
```

**3. Actualizar Perfil**

- Cliente puede actualizar: nombre, teléfono, dirección, preferencias
- Cliente NO puede cambiar: documento, fecha nacimiento
- Empleado puede actualizar: todo excepto usuario_id

**4. Preferencias de Cliente**

```json
{
  "tipo_habitacion_preferida": "suite",
  "piso_preferido": "alto",
  "vista_preferida": "mar",
  "cama": "king",
  "almohadas_extra": true,
  "restricciones_alimentarias": ["vegetariano"],
  "alergias": ["cacahuate"],
  "idioma_preferido": "es",
  "solicitudes_frecuentes": "checkout tardío"
}
```

**5. Sistema de Fidelidad**

- **Acumulación:** 1 punto por cada $1 gastado
- **Niveles:**
  - Bronce: 0-999 puntos
  - Plata: 1,000-4,999 puntos (5% descuento)
  - Oro: 5,000-9,999 puntos (10% descuento)
  - Platino: 10,000+ puntos (15% descuento + upgrades)
- **VIP automático:** Clientes con 5+ reservas o $10,000+ gastados

---

## 5. Módulo de Paquetes Turísticos

### RF-PAQ-001: Paquetes Combinados

**ID:** RF-PAQ-001  
**Nombre:** Sistema de paquetes turísticos  
**Prioridad:** Media (Should Have)  
**Complejidad:** Alta  
**Épica:** EP-12 Paquetes Turísticos

#### Modelo de Datos

```python
class PaqueteTuristico:
    id: UUID
    nombre: str
    descripcion: str
    destino_id: UUID
    duracion_noches: int
    precio_base: Decimal
    descuento_paquete: Decimal  # % de descuento vs servicios individuales
    incluye_hotel: bool
    incluye_transporte: bool
    incluye_tours: bool
    incluye_comidas: bool
    itinerario: JSONB  # Día a día
    hotel_id: UUID?
    tours: List[UUID]  # FK a Tours
    restricciones: str
    imagenes: List[str]
    activo: bool
    created_at: datetime
```

#### Funcionalidades

**1. Crear Paquete**

- Solo administradores
- Validar que todos los servicios existan
- Calcular precio base sumando componentes
- Aplicar descuento de paquete

**2. Reservar Paquete**

```python
def reservar_paquete(paquete_id: UUID, datos: PaqueteReservaCreate) -> Reserva:
    # 1. Validar disponibilidad de todos los componentes
    paquete = obtener_paquete(paquete_id)
    
    disponible = verificar_disponibilidad_paquete(
        paquete,
        datos.fecha_inicio
    )
    
    if not disponible:
        raise HTTPException(409, "Paquete no disponible para esas fechas")
    
    # 2. Crear reservas individuales para cada componente
    reserva_hotel = crear_reserva_hotel(paquete.hotel_id, datos)
    reservas_tours = [crear_reserva_tour(tour_id, datos) for tour_id in paquete.tours]
    
    # 3. Crear reserva de paquete que agrupa todo
    reserva_paquete = crear_reserva_paquete(
        paquete_id=paquete_id,
        cliente_id=datos.cliente_id,
        fecha_inicio=datos.fecha_inicio,
        reserva_hotel_id=reserva_hotel.id,
        reservas_tours_ids=[r.id for r in reservas_tours],
        precio_total=calcular_precio_paquete(paquete, datos)
    )
    
    return reserva_paquete
```

---

## 6. Módulo de Pagos

### RF-PAG-001: Procesamiento de Pagos

**ID:** RF-PAG-001  
**Nombre:** Sistema de procesamiento de transacciones  
**Prioridad:** Crítica (Must Have)  
**Complejidad:** Muy Alta  
**Épica:** EP-04 Pagos

#### Métodos de Pago Soportados

1. **Tarjeta de Crédito/Débito** (en línea)
2. **Transferencia Bancaria** (con comprobante)
3. **Efectivo** (en hotel, solo empleado)

#### Modelo de Datos

```python
class Pago:
    id: UUID
    reserva_id: UUID  # FK a Reserva
    monto: Decimal
    metodo_pago: enum
    estado: enum  # pendiente, procesando, exitoso, fallido, reembolsado
    referencia_externa: str?  # ID de gateway de pago
    numero_tarjeta_ultimos4: str?  # Solo últimos 4 dígitos
    marca_tarjeta: str?  # Visa, Mastercard, etc
    comprobante_url: str?  # Para transferencias
    comprobante_verificado: bool
    error_mensaje: str?
    procesado_at: datetime?
    procesado_por: UUID?  # Usuario que verificó
    created_at: datetime
```

#### RF-PAG-001-A: Pago con Tarjeta

**Proceso:**

```python
def procesar_pago_tarjeta(reserva_id: UUID, datos_tarjeta: TarjetaData) -> Pago:
    # 1. Validar reserva
    reserva = obtener_reserva(reserva_id)
    if reserva.pagado:
        raise HTTPException(400, "Reserva ya está pagada")
    
    # 2. Crear registro de pago
    pago = Pago(
        reserva_id=reserva_id,
        monto=reserva.precio_final,
        metodo_pago="tarjeta",
        estado="procesando"
    )
    db.add(pago)
    db.commit()
    
    try:
        # 3. Llamar a gateway de pago (ej: Stripe)
        cargo = stripe.Charge.create(
            amount=int(pago.monto * 100),  # Centavos
            currency="usd",
            source=datos_tarjeta.token,
            description=f"Reserva {reserva.codigo}"
        )
        
        # 4. Actualizar pago como exitoso
        pago.estado = "exitoso"
        pago.referencia_externa = cargo.id
        pago.numero_tarjeta_ultimos4 = datos_tarjeta.ultimos_4
        pago.marca_tarjeta = datos_tarjeta.marca
        pago.procesado_at = datetime.now()
        
        # 5. Confirmar reserva
        confirmar_reserva(reserva_id)
        
        db.commit()
        return pago
        
    except StripeError as e:
        # 6. Manejar error
        pago.estado = "fallido"
        pago.error_mensaje = str(e)
        db.commit()
        raise HTTPException(402, "Error al procesar pago")
```

#### RF-PAG-001-B: Pago con Transferencia

**Proceso:**

1. Cliente selecciona "Transferencia bancaria"
2. Sistema muestra datos bancarios
3. Cliente realiza transferencia
4. Cliente sube comprobante en la plataforma
5. Sistema crea pago en estado "pendiente"
6. Empleado verifica comprobante
7. Empleado marca como verificado
8. Sistema confirma reserva

**Código:**

```python
def subir_comprobante(reserva_id: UUID, archivo: UploadFile) -> Pago:
    # 1. Validar archivo
    validar_archivo_comprobante(archivo)
    
    # 2. Subir a storage
    url = subir_a_storage(archivo, f"comprobantes/{reserva_id}")
    
    # 3. Crear pago pendiente
    pago = Pago(
        reserva_id=reserva_id,
        monto=reserva.precio_final,
        metodo_pago="transferencia",
        estado="pendiente",
        comprobante_url=url,
        comprobante_verificado=False
    )
    db.add(pago)
    db.commit()
    
    # 4. Notificar a empleados para verificación
    notificar_verificacion_pendiente(pago.id)
    
    return pago

def verificar_comprobante(pago_id: UUID, empleado_id: UUID, aprobado: bool):
    pago = obtener_pago(pago_id)
    
    if aprobado:
        pago.estado = "exitoso"
        pago.comprobante_verificado = True
        pago.procesado_por = empleado_id
        pago.procesado_at = datetime.now()
        
        # Confirmar reserva
        confirmar_reserva(pago.reserva_id)
    else:
        pago.estado = "fallido"
        pago.error_mensaje = "Comprobante rechazado"
        
        # Notificar al cliente
        notificar_comprobante_rechazado(pago.reserva_id)
    
    db.commit()
```

#### RF-PAG-001-C: Reembolsos

```python
def procesar_reembolso(pago_id: UUID, monto_reembolso: Decimal) -> Pago:
    pago_original = obtener_pago(pago_id)
    
    if pago_original.estado != "exitoso":
        raise HTTPException(400, "Solo se pueden reembolsar pagos exitosos")
    
    if monto_reembolso > pago_original.monto:
        raise HTTPException(400, "Monto de reembolso excede pago original")
    
    # Crear registro de reembolso
    reembolso = Pago(
        reserva_id=pago_original.reserva_id,
        monto=-monto_reembolso,  # Negativo para indicar reembolso
        metodo_pago=pago_original.metodo_pago,
        estado="procesando",
        referencia_externa=pago_original.id  # Relacionar con pago original
    )
    db.add(reembolso)
    
    if pago_original.metodo_pago == "tarjeta":
        # Reembolso automático vía gateway
        stripe.Refund.create(
            charge=pago_original.referencia_externa,
            amount=int(monto_reembolso * 100)
        )
        reembolso.estado = "exitoso"
    else:
        # Reembolso manual (transferencia, efectivo)
        reembolso.estado = "pendiente"
        # Notificar a empleado para procesar manualmente
    
    db.commit()
    return reembolso
```

---

## 7. Módulo de Notificaciones

### RF-NOT-001: Sistema de Notificaciones

**ID:** RF-NOT-001  
**Nombre:** Comunicación multicanal con usuarios  
**Prioridad:** Alta (Must Have)  
**Complejidad:** Media  
**Épica:** EP-08 Notificaciones

#### Canales de Notificación

1. **Email** (crítico)
2. **In-app** (secundario)
3. **SMS** (futuro - no implementado aún)

#### Modelo de Datos

```python
class Notificacion:
    id: UUID
    usuario_id: UUID
    tipo: enum  # reserva, pago, cancelacion, recordatorio, sistema
    titulo: str
    mensaje: str
    leida: bool
    email_enviado: bool
    email_enviado_at: datetime?
    data: JSONB  # Datos adicionales para la notificación
    link: str?  # URL dentro de la app
    created_at: datetime
```

#### Eventos que Generan Notificaciones

| Evento | Email | In-app | Contenido |
|--------|-------|--------|-----------|
| Registro exitoso | ✅ | ❌ | Bienvenida + verificación |
| Verificación de email | ✅ | ✅ | Cuenta activada |
| Reserva creada | ✅ | ✅ | Detalles de reserva |
| Reserva confirmada | ✅ | ✅ | Confirmación + comprobante |
| Pago exitoso | ✅ | ✅ | Recibo de pago |
| Pago fallido | ✅ | ✅ | Error + reintento |
| Recordatorio 7 días antes | ✅ | ✅ | Recordatorio de viaje |
| Recordatorio 1 día antes | ✅ | ✅ | Recordatorio + instrucciones |
| Modificación de reserva | ✅ | ✅ | Cambios realizados |
| Cancelación | ✅ | ✅ | Confirmación + reembolso |
| Reseña solicitada | ✅ | ✅ | Solicitud de opinión |

#### Funcionalidades

**1. Crear Notificación**

```python
def crear_notificacion(
    usuario_id: UUID,
    tipo: str,
    titulo: str,
    mensaje: str,
    enviar_email: bool = True,
    data: dict = None,
    link: str = None
):
    # 1. Crear notificación in-app
    notif = Notificacion(
        usuario_id=usuario_id,
        tipo=tipo,
        titulo=titulo,
        mensaje=mensaje,
        leida=False,
        data=data,
        link=link
    )
    db.add(notif)
    db.commit()
    
    # 2. Enviar email si está habilitado
    if enviar_email:
        usuario = obtener_usuario(usuario_id)
        if usuario.notificaciones_email:  # Preferencia del usuario
            enviar_email_async(
                destinatario=usuario.email,
                asunto=titulo,
                cuerpo=mensaje,
                template=f"notificacion_{tipo}",
                data=data
            )
            notif.email_enviado = True
            notif.email_enviado_at = datetime.now()
            db.commit()
    
    return notif
```

**2. Listar Notificaciones**

```python
GET /api/v1/notificaciones
Query params:
  - leidas: bool (filtrar por leídas/no leídas)
  - tipo: str (filtrar por tipo)
  - pagina: int
  - por_pagina: int

Response:
{
  "notificaciones": [
    {
      "id": "uuid",
      "tipo": "reserva",
      "titulo": "Reserva confirmada",
      "mensaje": "Tu reserva RES-2026-001234 fue confirmada",
      "leida": false,
      "link": "/reservas/uuid",
      "created_at": "2026-08-30T10:00:00Z"
    }
  ],
  "total": 45,
  "no_leidas": 5,
  "pagina": 1,
  "total_paginas": 3
}
```

**3. Marcar como Leída**

```python
def marcar_como_leida(notificacion_id: UUID, usuario_id: UUID):
    notif = db.query(Notificacion).filter(
        Notificacion.id == notificacion_id,
        Notificacion.usuario_id == usuario_id
    ).first()
    
    if not notif:
        raise HTTPException(404, "Notificación no encontrada")
    
    notif.leida = True
    db.commit()
```

**4. Recordatorios Automáticos**

```python
# Tarea programada (cron job) que se ejecuta diariamente
def enviar_recordatorios_diarios():
    hoy = date.today()
    
    # Recordatorios 7 días antes
    reservas_7_dias = db.query(Reserva).filter(
        Reserva.estado == "confirmada",
        Reserva.fecha_checkin == hoy + timedelta(days=7)
    ).all()
    
    for reserva in reservas_7_dias:
        crear_notificacion(
            usuario_id=reserva.cliente.usuario_id,
            tipo="recordatorio",
            titulo="Tu viaje se acerca",
            mensaje=f"Tu check-in en {reserva.hotel.nombre} es en 7 días",
            data={"reserva_id": str(reserva.id)},
            link=f"/reservas/{reserva.id}"
        )
    
    # Recordatorios 1 día antes
    reservas_1_dia = db.query(Reserva).filter(
        Reserva.estado == "confirmada",
        Reserva.fecha_checkin == hoy + timedelta(days=1)
    ).all()
    
    for reserva in reservas_1_dia:
        crear_notificacion(
            usuario_id=reserva.cliente.usuario_id,
            tipo="recordatorio",
            titulo="Tu check-in es mañana",
            mensaje=f"Recuerda que tu check-in en {reserva.hotel.nombre} es mañana a las {reserva.hotel.check_in_hora}",
            data={"reserva_id": str(reserva.id)},
            link=f"/reservas/{reserva.id}"
        )
```

---

## 8. Módulo de Reseñas

### RF-REW-001: Sistema de Reseñas

**ID:** RF-REW-001  
**Nombre:** Reseñas y calificaciones de hoteles  
**Prioridad:** Media (Should Have)  
**Complejidad:** Media  
**Épica:** EP-06 Reseñas y Valoraciones

#### Modelo de Datos

```python
class Resena:
    id: UUID
    hotel_id: UUID
    cliente_id: UUID
    reserva_id: UUID  # Para validar que realmente se hospedó
    calificacion: int  # 1-5 estrellas
    titulo: str  # 10-100 caracteres
    comentario: str  # 20-2000 caracteres
    calificaciones_detalladas: JSONB  # {limpieza: 5, ubicacion: 4, etc}
    estado: enum  # pendiente, aprobada, rechazada
    moderada_por: UUID?
    motivo_rechazo: str?
    respuesta_hotel: str?  # Respuesta del hotel a la reseña
    fecha_estancia: date  # Cuando se hospedó
    util_count: int  # Cuántos marcaron como útil
    created_at: datetime
    updated_at: datetime
```

#### Funcionalidades

**1. Crear Reseña**

**Precondiciones:**
- Cliente completó una reserva en el hotel
- No ha escrito reseña para esa reserva
- Reserva fue completada hace menos de 90 días

```python
def crear_resena(datos: ResenaCreate, cliente_id: UUID) -> Resena:
    # 1. Validar que cliente se hospedó en hotel
    reserva = db.query(Reserva).filter(
        Reserva.id == datos.reserva_id,
        Reserva.cliente_id == cliente_id,
        Reserva.estado == "completada"
    ).first()
    
    if not reserva:
        raise HTTPException(403, "No puedes reseñar este hotel")
    
    # 2. Validar que no haya reseña existente para esa reserva
    resena_existente = db.query(Resena).filter(
        Resena.reserva_id == datos.reserva_id
    ).first()
    
    if resena_existente:
        raise HTTPException(409, "Ya escribiste una reseña para esta reserva")
    
    # 3. Validar que reserva sea reciente (< 90 días)
    dias_desde_checkout = (date.today() - reserva.fecha_checkout).days
    if dias_desde_checkout > 90:
        raise HTTPException(400, "Solo puedes reseñar estadías de los últimos 90 días")
    
    # 4. Validar contenido
    if len(datos.comentario) < 20:
        raise HTTPException(400, "Comentario debe tener al menos 20 caracteres")
    
    # 5. Crear reseña
    resena = Resena(
        hotel_id=reserva.hotel_id,
        cliente_id=cliente_id,
        reserva_id=reserva.id,
        calificacion=datos.calificacion,
        titulo=datos.titulo,
        comentario=datos.comentario,
        calificaciones_detalladas=datos.calificaciones_detalladas,
        estado="pendiente",  # Requiere moderación
        fecha_estancia=reserva.fecha_checkout
    )
    db.add(resena)
    db.commit()
    
    # 6. Notificar a moderadores
    notificar_resena_pendiente(resena.id)
    
    return resena
```

**2. Moderar Reseña**

```python
def moderar_resena(
    resena_id: UUID,
    moderador_id: UUID,
    aprobar: bool,
    motivo_rechazo: str = None
):
    resena = obtener_resena(resena_id)
    
    if aprobar:
        resena.estado = "aprobada"
        resena.moderada_por = moderador_id
        
        # Actualizar calificación promedio del hotel
        actualizar_calificacion_hotel(resena.hotel_id)
        
        # Notificar al cliente
        notificar_resena_aprobada(resena.cliente_id, resena.id)
    else:
        resena.estado = "rechazada"
        resena.moderada_por = moderador_id
        resena.motivo_rechazo = motivo_rechazo
        
        # Notificar al cliente del rechazo
        notificar_resena_rechazada(resena.cliente_id, motivo_rechazo)
    
    db.commit()
```

**3. Actualizar Calificación del Hotel**

```python
def actualizar_calificacion_hotel(hotel_id: UUID):
    # Calcular promedio de todas las reseñas aprobadas
    resultado = db.query(
        func.avg(Resena.calificacion).label("promedio"),
        func.count(Resena.id).label("total")
    ).filter(
        Resena.hotel_id == hotel_id,
        Resena.estado == "aprobada"
    ).first()
    
    hotel = db.query(Hotel).get(hotel_id)
    hotel.calificacion_promedio = round(resultado.promedio, 1)
    hotel.numero_resenas = resultado.total
    db.commit()
```

**4. Listar Reseñas de Hotel**

```python
GET /api/v1/hoteles/{hotel_id}/resenas
Query params:
  - ordenar: recientes, calificacion_alta, calificacion_baja, utiles
  - calificacion: 1-5 (filtrar por estrellas)
  - pagina: int
  - por_pagina: int (default 10)

Response:
{
  "resenas": [...],
  "total": 150,
  "promedio": 4.3,
  "distribucion": {
    "5": 80,
    "4": 40,
    "3": 20,
    "2": 7,
    "1": 3
  },
  "pagina": 1,
  "total_paginas": 15
}
```

---

## 9. Módulo de Favoritos

### RF-FAV-001: Lista de Favoritos

**ID:** RF-FAV-001  
**Nombre:** Guardar hoteles favoritos  
**Prioridad:** Baja (Could Have)  
**Complejidad:** Baja  
**Épica:** EP-07 Favoritos

#### Modelo de Datos

```python
class Favorito:
    id: UUID
    usuario_id: UUID
    hotel_id: UUID
    notas: str?  # Notas personales del usuario
    created_at: datetime
    
    # Constraint único: (usuario_id, hotel_id)
```

#### Funcionalidades

```python
# Agregar a favoritos
POST /api/v1/favoritos
Body: {"hotel_id": "uuid"}

# Listar favoritos
GET /api/v1/favoritos
Response: [
  {
    "id": "uuid",
    "hotel": {
      "id": "uuid",
      "nombre": "Hotel Paradise",
      "ciudad": "Cancún",
      "calificacion": 4.5,
      "precio_desde": 150.00,
      "imagen_principal": "url"
    },
    "notas": "Para aniversario 2027",
    "created_at": "2026-08-30T10:00:00Z"
  }
]

# Eliminar de favoritos
DELETE /api/v1/favoritos/{favorito_id}
```

---

## 10. Módulo de Cancelaciones

### RF-CAN-001: Proceso de Cancelación

**ID:** RF-CAN-001  
**Nombre:** Cancelación de reservas con políticas  
**Prioridad:** Alta (Must Have)  
**Complejidad:** Alta  
**Épica:** EP-13 Cancelaciones

#### Modelo de Datos

```python
class SolicitudCancelacion:
    id: UUID
    reserva_id: UUID
    solicitante_id: UUID  # Cliente o empleado que solicita
    motivo: str
    tipo_motivo: enum  # cambio_planes, emergencia, insatisfaccion, otro
    fecha_solicitud: datetime
    dias_anticipacion: int  # calculado
    politica_aplicada: str  # texto de la política
    porcentaje_reembolso: Decimal  # 0-100
    cargo_cancelacion: Decimal
    monto_reembolso: Decimal
    estado: enum  # pendiente, aprobada, rechazada, procesada
    aprobada_por: UUID?
    motivo_rechazo: str?
    fecha_resolucion: datetime?
    reembolso_procesado: bool
    created_at: datetime
```

#### Políticas de Cancelación

```python
# Configuración de políticas por hotel (ejemplo)
POLITICAS_CANCELACION = {
    "flexible": {
        ">7_dias": {"reembolso": 100, "cargo": 0},
        "3-7_dias": {"reembolso": 50, "cargo": 50},
        "<3_dias": {"reembolso": 0, "cargo": 100}
    },
    "moderada": {
        ">14_dias": {"reembolso": 100, "cargo": 0},
        "7-14_dias": {"reembolso": 50, "cargo": 50},
        "<7_dias": {"reembolso": 0, "cargo": 100}
    },
    "estricta": {
        ">30_dias": {"reembolso": 90, "cargo": 10},
        "14-30_dias": {"reembolso": 50, "cargo": 50},
        "<14_dias": {"reembolso": 0, "cargo": 100}
    }
}
```

#### Flujo de Cancelación

```python
def solicitar_cancelacion(
    reserva_id: UUID,
    cliente_id: UUID,
    motivo: str,
    tipo_motivo: str
) -> SolicitudCancelacion:
    # 1. Validar reserva
    reserva = obtener_reserva(reserva_id)
    
    if reserva.cliente_id != cliente_id:
        raise HTTPException(403, "No puedes cancelar esta reserva")
    
    if reserva.estado not in ["pendiente", "confirmada"]:
        raise HTTPException(400, "Esta reserva no puede cancelarse")
    
    # 2. Calcular días de anticipación
    dias_anticipacion = (reserva.fecha_checkin - date.today()).days
    
    if dias_anticipacion < 0:
        raise HTTPException(400, "No puedes cancelar una reserva que ya comenzó")
    
    # 3. Obtener política aplicable
    hotel = obtener_hotel(reserva.hotel_id)
    politica = POLITICAS_CANCELACION[hotel.politica_cancelacion]
    
    # 4. Calcular reembolso
    if dias_anticipacion > 14:
        porcentaje_reembolso = politica[">14_dias"]["reembolso"]
    elif dias_anticipacion >= 7:
        porcentaje_reembolso = politica["7-14_dias"]["reembolso"]
    else:
        porcentaje_reembolso = politica["<7_dias"]["reembolso"]
    
    monto_reembolso = reserva.precio_final * (porcentaje_reembolso / 100)
    cargo_cancelacion = reserva.precio_final - monto_reembolso
    
    # 5. Crear solicitud
    solicitud = SolicitudCancelacion(
        reserva_id=reserva_id,
        solicitante_id=cliente_id,
        motivo=motivo,
        tipo_motivo=tipo_motivo,
        dias_anticipacion=dias_anticipacion,
        politica_aplicada=f"Política {hotel.politica_cancelacion}",
        porcentaje_reembolso=porcentaje_reembolso,
        cargo_cancelacion=cargo_cancelacion,
        monto_reembolso=monto_reembolso,
        estado="pendiente"
    )
    db.add(solicitud)
    db.commit()
    
    # 6. Si reembolso >= 50%, auto-aprobar
    # Si reembolso < 50%, requiere aprobación manual
    if porcentaje_reembolso >= 50:
        aprobar_cancelacion(solicitud.id, auto_aprobado=True)
    else:
        notificar_solicitud_cancelacion_pendiente(solicitud.id)
    
    return solicitud
```

```python
def aprobar_cancelacion(
    solicitud_id: UUID,
    empleado_id: UUID = None,
    auto_aprobado: bool = False
):
    solicitud = obtener_solicitud(solicitud_id)
    reserva = obtener_reserva(solicitud.reserva_id)
    
    # 1. Aprobar solicitud
    solicitud.estado = "aprobada"
    solicitud.aprobada_por = empleado_id
    solicitud.fecha_resolucion = datetime.now()
    
    # 2. Cancelar reserva
    reserva.estado = "cancelada"
    reserva.cancelada_at = datetime.now()
    reserva.motivo_cancelacion = solicitud.motivo
    
    # 3. Liberar disponibilidad
    liberar_habitacion(reserva.habitacion_id, reserva.fecha_checkin, reserva.fecha_checkout)
    
    # 4. Procesar reembolso si aplica
    if solicitud.monto_reembolso > 0:
        pago_original = obtener_pago_de_reserva(reserva.id)
        procesar_reembolso(pago_original.id, solicitud.monto_reembolso)
        solicitud.reembolso_procesado = True
    
    db.commit()
    
    # 5. Notificar al cliente
    notificar_cancelacion_aprobada(solicitud)
```

---

## 11. Módulo de Dashboard

### RF-DAS-001: Panel de Control Administrativo

**ID:** RF-DAS-001  
**Nombre:** Dashboard con métricas de negocio  
**Prioridad:** Media (Should Have)  
**Complejidad:** Alta  
**Épica:** EP-11 Reportes y Analytics

#### Métricas Principales

**1. Métricas del Día**

```python
GET /api/v1/dashboard/hoy
Response:
{
  "fecha": "2026-08-30",
  "reservas_hoy": {
    "total": 45,
    "confirmadas": 38,
    "pendientes": 7,
    "canceladas": 2
  },
  "ingresos_hoy": {
    "total": 12500.00,
    "por_confirmar": 1800.00
  },
  "checkins_hoy": 23,
  "checkouts_hoy": 19,
  "ocupacion_actual": {
    "habitaciones_ocupadas": 234,
    "habitaciones_disponibles": 66,
    "porcentaje": 78.0
  },
  "nuevos_clientes": 12
}
```

**2. Métricas del Mes**

```python
GET /api/v1/dashboard/mes?mes=8&anio=2026
Response:
{
  "periodo": "Agosto 2026",
  "reservas": {
    "total": 1234,
    "confirmadas": 1100,
    "canceladas": 134,
    "tasa_cancelacion": 10.9
  },
  "ingresos": {
    "total": 345000.00,
    "promedio_por_reserva": 313.64,
    "comparacion_mes_anterior": {
      "diferencia": 23000.00,
      "porcentaje": 7.1
    }
  },
  "ocupacion_promedio": 72.5,
  "duracion_estancia_promedio": 3.2,
  "top_hoteles": [
    {
      "hotel_id": "uuid",
      "nombre": "Hotel Paradise",
      "reservas": 89,
      "ingresos": 28900.00
    }
  ],
  "top_destinos": [
    {
      "destino_id": "uuid",
      "nombre": "Cancún",
      "reservas": 234
    }
  ]
}
```

**3. Gráficos y Tendencias**

```python
GET /api/v1/dashboard/tendencias?periodo=30dias
Response:
{
  "ingresos_diarios": [
    {"fecha": "2026-08-01", "monto": 12000},
    {"fecha": "2026-08-02", "monto": 15000},
    ...
  ],
  "reservas_por_dia": [...],
  "ocupacion_por_dia": [...],
  "cancelaciones_por_motivo": {
    "cambio_planes": 45,
    "emergencia": 12,
    "insatisfaccion": 5,
    "otro": 8
  }
}
```

**4. Alertas y Notificaciones**

```python
GET /api/v1/dashboard/alertas
Response:
{
  "alertas": [
    {
      "tipo": "ocupacion_baja",
      "severidad": "warning",
      "mensaje": "Hotel Beach Resort tiene solo 45% de ocupación este fin de semana",
      "hotel_id": "uuid"
    },
    {
      "tipo": "pagos_pendientes",
      "severidad": "info",
      "mensaje": "7 comprobantes de transferencia pendientes de verificación",
      "link": "/admin/pagos/pendientes"
    },
    {
      "tipo": "resenas_pendientes",
      "severidad": "info",
      "mensaje": "12 reseñas esperando moderación",
      "link": "/admin/resenas/pendientes"
    }
  ]
}
```

---

## Matriz de Trazabilidad

### Requisitos Funcionales vs Historias de Usuario

| RF ID | HU ID | Nombre | Prioridad | Estado |
|-------|-------|--------|-----------|--------|
| RF-AUTH-001 | HU-001 | Registro de Cuenta | Must Have | ✅ Implementado |
| RF-AUTH-002 | HU-003 | Inicio de Sesión | Must Have | ✅ Implementado |
| RF-AUTH-003 | HU-004 | Recuperación de Contraseña | Must Have | ✅ Implementado |
| RF-HOT-001 | HU-027, HU-028 | Catálogo de Hoteles | Must Have | ✅ Implementado |
| RF-HOT-002 | HU-028 | Gestión de Habitaciones | Must Have | ✅ Implementado |
| RF-RES-001 | HU-010 | Crear Reserva | Must Have | ✅ Implementado |
| RF-RES-002 | HU-011 | Consultar Reservas | Must Have | ✅ Implementado |
| RF-RES-003 | HU-012 | Cancelar Reserva | Must Have | ✅ Implementado |
| RF-PAG-001 | HU-014 | Procesar Pagos | Must Have | ✅ Implementado |
| RF-NOT-001 | HU-023 | Notificaciones Email | Must Have | ✅ Implementado |
| RF-REW-001 | HU-019 | Crear Reseña | Should Have | ✅ Implementado |
| RF-FAV-001 | HU-021 | Favoritos | Could Have | ✅ Implementado |
| RF-CAN-001 | HU-012, HU-033 | Cancelaciones | Must Have | ✅ Implementado |
| RF-DAS-001 | HU-035 | Dashboard | Should Have | ✅ Implementado |

---

## Validación y Verificación

### Criterios de Verificación

Para cada requisito funcional implementado:

1. **Código implementado:** ✅ Endpoint o función existe
2. **Pruebas unitarias:** ✅ Cobertura >= 70%
3. **Pruebas de integración:** ✅ Flujos principales validados
4. **Documentación API:** ✅ En Swagger/OpenAPI
5. **Validación QA:** ✅ Casos de prueba ejecutados
6. **Aceptación usuario:** ✅ Product Owner aprueba

### Checklist de Aceptación

```markdown
## RF-XXX-NNN: [Nombre del Requisito]

- [ ] Implementación completada
- [ ] Tests unitarios (>70% cobertura)
- [ ] Tests de integración
- [ ] Documentación API actualizada
- [ ] Validaciones de seguridad
- [ ] Manejo de errores
- [ ] Logs apropiados
- [ ] Revisión de código aprobada
- [ ] QA testing completado
- [ ] Product Owner aprobó
- [ ] Desplegado a producción
```

---

## Control de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Agosto 2026 | Equipo AlecTours | Versión inicial |
| 2.0 | Agosto 30, 2026 | Kiro AI | Versión detallada con especificaciones técnicas |

---

**Fin del Documento**
