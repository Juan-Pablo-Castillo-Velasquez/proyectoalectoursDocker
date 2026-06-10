# 📚 Documentación API AlecTours

# RESTRICCIONES DEL SISTEMA ALECTOURS

#### Restricción 1: Acceso condicionado a la verificación de correo
Un usuario registrado no podrá iniciar sesión ni acceder a funcionalidades protegidas hasta que haya verificado su dirección de correo electrónico mediante el enlace de activación enviado por el sistema.

#### Restricción 2: Gestión exclusiva por roles autorizados
Solo los usuarios con rol de Agente de Viajes podrán consultar catálogos de servicios turísticos, construir itinerarios, generar cotizaciones y gestionar reservas. Los clientes únicamente podrán acceder a las funcionalidades definidas para su perfil.

#### Restricción 3: Disponibilidad obligatoria antes de reservar
El sistema no permitirá confirmar una reserva ni generar una cotización final si alguno de los servicios incluidos (vuelos, hoteles, transportes o actividades) no cuenta con disponibilidad vigente al momento de la validación.

#### Restricción 4: Fechas coherentes en todos los procesos de viaje
No se podrán registrar búsquedas, itinerarios o reservas con fechas inconsistentes. Las fechas de salida o inicio deben ser iguales o posteriores a la fecha actual, y las fechas de finalización deben ser posteriores a las fechas de inicio correspondientes.

#### Restricción 5: Protección obligatoria de información sensible
Las contraseñas, tokens, credenciales y demás datos sensibles nunca podrán almacenarse ni transmitirse en texto plano. Toda la información crítica deberá protegerse mediante mecanismos de cifrado, hashing y gestión segura de credenciales definidos por la arquitectura del sistema.


**Base URL:** `http://localhost:8000`

---

## 🔐 AUTENTICACIÓN (Auth)

### 1️⃣ Registro de Usuario
- **Método:** `POST`
- **URL:** `/auth/register`
- **Status:** 201 Created

**Request Body:**
```json
{
  "username": "juan_perez",
  "correo_electronico": "juan@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "message": "Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.",
  "user_id": 1,
  "email": "juan@example.com",
  "verification_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notas:**
- Se envía email de verificación automáticamente
- El usuario NO puede iniciar sesión hasta verificar el email
- Username debe tener 3-50 caracteres

---

### 2️⃣ Verificar Email
- **Método:** `POST`
- **URL:** `/auth/verify-email`
- **Status:** 200 OK

**Query Parameters:**
```
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "message": "Email verificado exitosamente",
  "user_id": 1
}
```

---

### 3️⃣ Iniciar Sesión
- **Método:** `POST`
- **URL:** `/auth/login`
- **Status:** 200 OK

**Request Body:**
```json
{
  "username": "juan_perez",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1
}
```

**Errores Comunes:**
- `401`: Credenciales inválidas
- `403`: Email no verificado

---

## 👥 CLIENTES

### 1️⃣ Crear Cliente
- **Método:** `POST`
- **URL:** `/api/clientes`
- **Status:** 201 Created

**Request Body:**
```json
{
  "nombre": "Carlos García",
  "cedula": "1234567890",
  "telefono": "+57 3001234567",
  "correo": "carlos.garcia@example.com",
  "direccion": "Calle 5 #10-20, Bogotá"
}
```

**Response:**
```json
{
  "id": 1,
  "nombre": "Carlos García",
  "cedula": "1234567890",
  "telefono": "+57 3001234567",
  "correo": "carlos.garcia@example.com",
  "direccion": "Calle 5 #10-20, Bogotá",
  "fecha_creacion": "2026-06-05T21:20:00"
}
```

---

### 2️⃣ Obtener Todos los Clientes
- **Método:** `GET`
- **URL:** `/api/clientes`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Carlos García",
    "cedula": "1234567890",
    "telefono": "+57 3001234567",
    "correo": "carlos.garcia@example.com",
    "direccion": "Calle 5 #10-20, Bogotá"
  }
]
```

---

### 3️⃣ Obtener Cliente por ID
- **Método:** `GET`
- **URL:** `/api/clientes/{cliente_id}`
- **Status:** 200 OK

**Example:**
```
GET /api/clientes/1
```

---

### 4️⃣ Actualizar Cliente
- **Método:** `PUT`
- **URL:** `/api/clientes/{cliente_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "nombre": "Carlos García Actualizado",
  "telefono": "+57 3009876543"
}
```

---

### 5️⃣ Eliminar Cliente
- **Método:** `DELETE`
- **URL:** `/api/clientes/{cliente_id}`
- **Status:** 200 OK

**Response:**
```json
{
  "message": "Cliente eliminado exitosamente"
}
```

---

## 👨‍💼 EMPLEADOS

### 1️⃣ Crear Empleado
- **Método:** `POST`
- **URL:** `/api/empleados`
- **Status:** 201 Created

**Request Body:**
```json
{
  "nombre": "Ana Rodríguez",
  "cedula": "9876543210",
  "cargo": "Gerente de Reservas",
  "correo_electronico": "ana.rodriguez@alectours.com",
  "telefono": "+57 3002468135",
  "salario": 3500000,
  "activo": true
}
```

---

### 2️⃣ Obtener Todos los Empleados
- **Método:** `GET`
- **URL:** `/api/empleados`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 3️⃣ Obtener Empleados Activos
- **Método:** `GET`
- **URL:** `/api/empleados/activos/lista`
- **Status:** 200 OK

---

### 4️⃣ Obtener Empleado por ID
- **Método:** `GET`
- **URL:** `/api/empleados/{empleado_id}`
- **Status:** 200 OK

---

### 5️⃣ Actualizar Empleado
- **Método:** `PUT`
- **URL:** `/api/empleados/{empleado_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "cargo": "Gerente General",
  "salario": 4000000
}
```

---

### 6️⃣ Eliminar Empleado
- **Método:** `DELETE`
- **URL:** `/api/empleados/{empleado_id}`
- **Status:** 200 OK

---

## 🏨 HOTELES

### 1️⃣ Crear Hotel
- **Método:** `POST`
- **URL:** `/api/hoteles/`
- **Status:** 201 Created

**Request Body:**
```json
{
  "nombre": "Hotel Resort Paradise",
  "ciudad": "Cartagena",
  "ubicacion": "Avenida Costanera, Cartagena",
  "clasificacion": 5,
  "total_habitaciones": 150,
  "descripcion": "Hermoso resort frente al mar con piscinas y spa"
}
```

**Response:**
```json
{
  "id": 1,
  "nombre": "Hotel Resort Paradise",
  "ciudad": "Cartagena",
  "ubicacion": "Avenida Costanera, Cartagena",
  "clasificacion": 5,
  "total_habitaciones": 150,
  "descripcion": "Hermoso resort frente al mar con piscinas y spa"
}
```

---

### 2️⃣ Obtener Todos los Hoteles
- **Método:** `GET`
- **URL:** `/api/hoteles/`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 3️⃣ Obtener Hotel con Detalles Completos
- **Método:** `GET`
- **URL:** `/api/hoteles/{hotel_id}`
- **Status:** 200 OK

**Response:**
```json
{
  "id": 1,
  "nombre": "Hotel Resort Paradise",
  "ciudad": "Cartagena",
  "ubicacion": "Avenida Costanera, Cartagena",
  "clasificacion": 5,
  "total_habitaciones": 150,
  "descripcion": "Hermoso resort frente al mar",
  "habitaciones": [
    {
      "id": 1,
      "numero_habitacion": "101",
      "tipo": "Suite",
      "capacidad": 2,
      "precio_noche": 250000,
      "disponible": true
    }
  ],
  "caracteristicas": [
    {
      "nombre": "Piscina",
      "disponible": true
    }
  ]
}
```

---

### 4️⃣ Actualizar Hotel
- **Método:** `PUT`
- **URL:** `/api/hoteles/{hotel_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "descripcion": "Resort 5 estrellas actualizado",
  "clasificacion": 5
}
```

---

### 5️⃣ Eliminar Hotel
- **Método:** `DELETE`
- **URL:** `/api/hoteles/{hotel_id}`
- **Status:** 200 OK

---

## 🛏️ HABITACIONES

### 1️⃣ Crear Habitación
- **Método:** `POST`
- **URL:** `/api/hoteles/{hotel_id}/habitaciones`
- **Status:** 201 Created

**Request Body:**
```json
{
  "numero_habitacion": "202",
  "tipo": "Suite Deluxe",
  "capacidad": 3,
  "precio_noche": 350000,
  "disponible": true,
  "descripcion": "Suite con vista al mar"
}
```

---

### 2️⃣ Obtener Habitaciones de un Hotel
- **Método:** `GET`
- **URL:** `/api/hoteles/{hotel_id}/habitaciones`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 3️⃣ Obtener Habitaciones Disponibles
- **Método:** `GET`
- **URL:** `/api/hoteles/{hotel_id}/habitaciones/disponibles`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 4️⃣ Obtener Habitación por ID
- **Método:** `GET`
- **URL:** `/api/hoteles/habitaciones/{habitacion_id}`
- **Status:** 200 OK

---

### 5️⃣ Actualizar Habitación
- **Método:** `PUT`
- **URL:** `/api/hoteles/habitaciones/{habitacion_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "precio_noche": 400000,
  "disponible": false
}
```

---

### 6️⃣ Eliminar Habitación
- **Método:** `DELETE`
- **URL:** `/api/hoteles/habitaciones/{habitacion_id}`
- **Status:** 200 OK

---

## ✨ CARACTERÍSTICAS DE HOTELES

### 1️⃣ Obtener Todas las Características
- **Método:** `GET`
- **URL:** `/api/hoteles/caracteristicas/`
- **Status:** 200 OK

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Piscina"
  },
  {
    "id": 2,
    "nombre": "Spa"
  }
]
```

---

### 2️⃣ Crear Característica
- **Método:** `POST`
- **URL:** `/api/hoteles/caracteristicas/`
- **Status:** 201 Created

**Request Body:**
```json
{
  "nombre": "WiFi Gratis"
}
```

---

### 3️⃣ Añadir Característica a Hotel
- **Método:** `POST`
- **URL:** `/api/hoteles/{hotel_id}/caracteristicas/{caracteristica_id}`
- **Status:** 200 OK

**Query Parameters:**
```
disponible=true
```

---

### 4️⃣ Eliminar Característica de Hotel
- **Método:** `DELETE`
- **URL:** `/api/hoteles/{hotel_id}/caracteristicas/{caracteristica_id}`
- **Status:** 200 OK

---

## 📦 PAQUETES TURÍSTICOS

### 1️⃣ Crear Paquete
- **Método:** `POST`
- **URL:** `/api/paquetes`
- **Status:** 201 Created

**Request Body:**
```json
{
  "nombre": "Escapada Caribeña 3 Noches",
  "descripcion": "Disfruta de playas paradisíacas en Cartagena",
  "precio": 1500000,
  "duracion_dias": 3,
  "destino": "Cartagena",
  "incluye": "Hotel 5 estrellas, desayuno diario, tour ciudad"
}
```

---

### 2️⃣ Obtener Todos los Paquetes
- **Método:** `GET`
- **URL:** `/api/paquetes`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 3️⃣ Obtener Paquete por ID
- **Método:** `GET`
- **URL:** `/api/paquetes/{paquete_id}`
- **Status:** 200 OK

---

### 4️⃣ Actualizar Paquete
- **Método:** `PUT`
- **URL:** `/api/paquetes/{paquete_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "precio": 1600000,
  "descripcion": "Escapada mejorada con tours incluidos"
}
```

---

### 5️⃣ Eliminar Paquete
- **Método:** `DELETE`
- **URL:** `/api/paquetes/{paquete_id}`
- **Status:** 200 OK

---

## 🎟️ RESERVAS

### 1️⃣ Crear Reserva
- **Método:** `POST`
- **URL:** `/api/reservas`
- **Status:** 201 Created

**Request Body:**
```json
{
  "id_cliente": 1,
  "id_paquete": 1,
  "fecha_inicio": "2026-07-15",
  "fecha_fin": "2026-07-18",
  "numero_personas": 2,
  "estado": "pendiente"
}
```

**Response:**
```json
{
  "id": 1,
  "id_cliente": 1,
  "id_paquete": 1,
  "fecha_inicio": "2026-07-15",
  "fecha_fin": "2026-07-18",
  "numero_personas": 2,
  "estado": "pendiente",
  "fecha_creacion": "2026-06-05T21:20:00"
}
```

---

### 2️⃣ Obtener Todas las Reservas
- **Método:** `GET`
- **URL:** `/api/reservas`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 3️⃣ Obtener Reservas de un Cliente
- **Método:** `GET`
- **URL:** `/api/reservas/cliente/{cliente_id}`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 4️⃣ Obtener Reservas por Estado
- **Método:** `GET`
- **URL:** `/api/reservas/estado/{estado}`
- **Status:** 200 OK

**Estados válidos:**
- `pendiente`
- `confirmada`
- `cancelada`
- `finalizada`

**Query Parameters:**
```
skip=0
limit=10
```

---

### 5️⃣ Obtener Detalles Completos de Reserva
- **Método:** `GET`
- **URL:** `/api/reservas/{reserva_id}`
- **Status:** 200 OK

**Response:**
```json
{
  "id": 1,
  "id_cliente": 1,
  "id_paquete": 1,
  "fecha_inicio": "2026-07-15",
  "fecha_fin": "2026-07-18",
  "numero_personas": 2,
  "estado": "pendiente",
  "paquete": {
    "id": 1,
    "nombre": "Escapada Caribeña 3 Noches",
    "precio": 1500000
  },
  "pagos": [
    {
      "id": 1,
      "monto": 500000,
      "estado": "pagado"
    }
  ]
}
```

---

### 6️⃣ Actualizar Reserva
- **Método:** `PUT`
- **URL:** `/api/reservas/{reserva_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "estado": "confirmada",
  "numero_personas": 3
}
```

---

### 7️⃣ Eliminar Reserva
- **Método:** `DELETE`
- **URL:** `/api/reservas/{reserva_id}`
- **Status:** 200 OK

---

## 💳 MÉTODOS DE PAGO

### 1️⃣ Obtener Métodos de Pago
- **Método:** `GET`
- **URL:** `/api/metodos-pago`
- **Status:** 200 OK

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Tarjeta de Crédito"
  },
  {
    "id": 2,
    "nombre": "Transferencia Bancaria"
  },
  {
    "id": 3,
    "nombre": "PayPal"
  }
]
```

---

### 2️⃣ Crear Método de Pago
- **Método:** `POST`
- **URL:** `/api/metodos-pago`
- **Status:** 201 Created

**Request Body:**
```json
{
  "nombre": "Criptomonedas"
}
```

---

## 💰 PAGOS

### 1️⃣ Crear Pago
- **Método:** `POST`
- **URL:** `/api/pagos`
- **Status:** 201 Created

**Request Body:**
```json
{
  "id_reserva": 1,
  "monto": 500000,
  "id_metodo_pago": 1,
  "estado": "pagado",
  "fecha_pago": "2026-06-05"
}
```

**Response:**
```json
{
  "id": 1,
  "id_reserva": 1,
  "monto": 500000,
  "id_metodo_pago": 1,
  "estado": "pagado",
  "fecha_pago": "2026-06-05",
  "fecha_creacion": "2026-06-05T21:20:00"
}
```

---

### 2️⃣ Obtener Todos los Pagos
- **Método:** `GET`
- **URL:** `/api/pagos`
- **Status:** 200 OK

**Query Parameters:**
```
skip=0
limit=10
```

---

### 3️⃣ Obtener Pagos de una Reserva
- **Método:** `GET`
- **URL:** `/api/pagos/reserva/{reserva_id}`
- **Status:** 200 OK

---

### 4️⃣ Obtener Pagos por Estado
- **Método:** `GET`
- **URL:** `/api/pagos/estado/{estado}`
- **Status:** 200 OK

**Estados válidos:**
- `pendiente`
- `pagado`
- `rechazado`

---

### 5️⃣ Obtener Pago por ID
- **Método:** `GET`
- **URL:** `/api/pagos/{pago_id}`
- **Status:** 200 OK

---

### 6️⃣ Actualizar Pago
- **Método:** `PUT`
- **URL:** `/api/pagos/{pago_id}`
- **Status:** 200 OK

**Request Body:**
```json
{
  "estado": "pagado",
  "monto": 550000
}
```

---

### 7️⃣ Eliminar Pago
- **Método:** `DELETE`
- **URL:** `/api/pagos/{pago_id}`
- **Status:** 200 OK

---

## ⚠️ CÓDIGOS DE ERROR COMUNES

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Credenciales inválidas |
| 403 | Forbidden - Acceso denegado (ej: email no verificado) |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: dependencias, ya existe) |
| 500 | Server Error - Error interno del servidor |

---

## 📝 NOTAS IMPORTANTES

1. **Base URL:** Todos los endpoints comienzan con `http://localhost:8000`
2. **Content-Type:** Usa `application/json` en todos los requests POST/PUT
3. **Validación de Email:** Los usuarios deben verificar su email después de registrarse
4. **Estados válidos:**
   - Reservas: `pendiente`, `confirmada`, `cancelada`, `finalizada`
   - Pagos: `pendiente`, `pagado`, `rechazado`
5. **Paginación:** Usa `skip` y `limit` en los GET (máximo 100 por página)
6. **Formato de Fechas:** `YYYY-MM-DD`

---

## 🚀 FLUJO TÍPICO DE UNA RESERVA

1. **Registrar cliente** → POST `/api/clientes`
2. **Ver hoteles disponibles** → GET `/api/hoteles/`
3. **Ver habitaciones del hotel** → GET `/api/hoteles/{hotel_id}/habitaciones/disponibles`
4. **Crear paquete** → POST `/api/paquetes`
5. **Crear reserva** → POST `/api/reservas`
6. **Crear pago** → POST `/api/pagos`
7. **Confirmar reserva** → PUT `/api/reservas/{reserva_id}` (estado: confirmada)

---

**Última actualización:** 2026-06-05
