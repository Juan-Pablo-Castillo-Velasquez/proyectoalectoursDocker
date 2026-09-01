# API Endpoints — AlecTours

> **Base URL**: `http://localhost:8000`
> **Formato**: JSON en request y response
> **Autenticación**: JWT Bearer Token — `Authorization: Bearer <access_token>`

---

## Resumen de Routers

| Router | Prefijo | Descripción |
|---|---|---|
| Auth | `/auth` | Registro, login, verificación email, recuperación contraseña |
| Hoteles | `/api/hoteles` | CRUD hoteles, habitaciones, tipos, características |
| Clientes | `/api/clientes` | CRUD clientes, métodos de pago, cambio contraseña |
| Empleados | `/api/empleados` | CRUD empleados, lista activos |
| Reservas | `/api/reservas` | CRUD reservas, pagar, historial, habitaciones/servicios |
| Paquetes | `/api/paquetes` | CRUD paquetes turísticos, populares, detalle |
| Pagos | `/api/pagos` | Métodos de pago, CRUD pagos, comprobantes |
| Servicios | `/api/servicios` | CRUD servicios, categorías |
| Destinos | `/api/destinos` | CRUD destinos, sugerencias |
| Preferencias | `/api/preferencias-cliente` | Preferencias de viaje, sugerencias IA |
| Promociones | `/api/promociones` | Destacados, selección para home |
| Contacto | `/api/contacto` | Formulario de contacto |
| Reseñas | `/api/resenas` | Crear reseñas, obtener por hotel, destacadas |
| Usuarios | `/api/usuarios` | CRUD usuarios, admin, perfil, foto |
| Roles | `/api/roles` | Consultar roles |
| Favoritos | `/api/favoritos` | Lista, agregar, eliminar favoritos |
| MétosPagoGuardados | `/api/metodos-pago-guardados` | CRUD métodos de pago guardados |
| Configuración | `/api/configuracion` | CRUD configuración del sistema |
| Notificaciones | `/api/notificaciones` | Lista, conteo no leídas, marcar leídas |
| SolicitudesCancelación | `/api/solicitudes-cancelacion` | Crear, resolver solicitudes |
| SolicitudesCorporativas | `/api/solicitudes-corporativas` | Crear, gestionar solicitudes empresa |
| Dashboard | `/api/dashboard` | Resumen KPIs, métricas, gráficas |
| Banners | `/api/banners` | CRUD banners publicitarios |

---

## Autenticación — `/auth`

### POST /auth/register

Registra un nuevo usuario con rol `cliente` por defecto.

**Rate limit**: 5 peticiones/minuto por IP

**Request body:**

```json
{
  "username": "juanp",
  "correo_electronico": "juan@example.com",
  "password": "MiContrasena1"
}
```

**Respuesta (201 Created):**

```json
{
  "id_usuario": 1,
  "username": "juanp",
  "correo_electronico": "juan@example.com",
  "activo": true,
  "verificado": false
}
```

### POST /auth/login

Autentica al usuario y retorna tokens JWT.

**Rate limit**: 5 peticiones/minuto por IP

**Request body (OAuth2 form-encoded):**

```
username=juanp&password=MiContrasena1
```

**Respuesta (200 OK):**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user_id": 1,
  "username": "juanp",
  "id_cliente": 1,
  "roles": ["cliente"]
}
```

### POST /auth/verify-email

Verifica la dirección de email del usuario.

**Query param**: `?token=<token>`

### POST /auth/forgot-password

Solicita email de recuperación de contraseña.

**Rate limit**: 3 peticiones/minuto por IP

**Request body:**

```json
{
  "email": "juan@example.com"
}
```

### POST /auth/reset-password

Restablece contraseña con token.

**Rate limit**: 5 peticiones/minuto por IP

**Request body:**

```json
{
  "token": "...",
  "new_password": "NuevaContrasena1"
}
```

---

## Hoteles — `/api/hoteles`

### Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/hoteles/` | No | Listar hoteles (cached, con filtros) |
| `GET` | `/api/hoteles/{id}` | No | Obtener hotel con reseñas y características |
| `POST` | `/api/hoteles/` | Admin | Crear hotel |
| `PUT` | `/api/hoteles/{id}` | Admin | Actualizar hotel |
| `DELETE` | `/api/hoteles/{id}` | Admin | Eliminar hotel (dependency-safe) |
| `GET` | `/api/hoteles/{id}/fechas-ocupadas` | No | Fechas ocupadas del hotel |

### Tipos de habitación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/hoteles/tipos-habitacion` | No | Listar tipos de habitación |
| `POST` | `/api/hoteles/tipos-habitacion` | Admin | Crear tipo |

### Características

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/hoteles/caracteristicas` | No | Listar características |
| `POST` | `/api/hoteles/caracteristicas` | Admin | Crear característica |
| `POST` | `/api/hoteles/{id}/caracteristicas` | Admin | Agregar característica a hotel |
| `DELETE` | `/api/hoteles/{id}/caracteristicas/{id_car}` | Admin | Quitar característica |

### Habitaciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/hoteles/{id}/habitaciones` | No | Listar habitaciones del hotel |
| `POST` | `/api/hoteles/{id}/habitaciones` | Admin | Crear habitación |
| `PUT` | `/api/hoteles/{id}/habitaciones/{id_hab}` | Admin | Actualizar habitación |
| `DELETE` | `/api/hoteles/{id}/habitaciones/{id_hab}` | Admin | Eliminar habitación |
| `GET` | `/api/hoteles/habitaciones/disponibles` | No | Habitaciones disponibles por fechas |

---

## Clientes — `/api/clientes`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/clientes/` | Admin | Listar clientes |
| `GET` | `/api/clientes/{id}` | Admin/Propietario | Obtener cliente |
| `POST` | `/api/clientes/` | No | Crear cliente |
| `PUT` | `/api/clientes/{id}` | Admin/Propietario | Actualizar cliente |
| `DELETE` | `/api/clientes/{id}` | Admin | Eliminar cliente |
| `GET` | `/api/clientes/buscar/{term}` | Admin | Buscar por término |
| `GET` | `/api/clientes/{id}/metodos-pago` | Admin/Propietario | Métodos de pago guardados |
| `PUT` | `/api/clientes/{id}/cambiar-contrasena` | Admin/Propietario | Cambiar contraseña |

---

## Empleados — `/api/empleados`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/empleados/` | Admin | Listar empleados |
| `GET` | `/api/empleados/{id}` | Admin | Obtener empleado |
| `POST` | `/api/empleados/` | Admin | Crear empleado |
| `PUT` | `/api/empleados/{id}` | Admin | Actualizar empleado |
| `DELETE` | `/api/empleados/{id}` | Admin | Eliminar empleado |
| `GET` | `/api/empleados/buscar/{term}` | Admin | Buscar por término |
| `GET` | `/api/empleados/activos/lista` | Admin | Solo empleados activos |

---

## Reservas — `/api/reservas`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/reservas/` | Admin | Listar reservas (cached 60s) |
| `GET` | `/api/reservas/{id}` | Admin/Propietario | Obtener reserva |
| `GET` | `/api/reservas/cliente/{id}` | Admin/Propietario | Reservas por cliente |
| `GET` | `/api/reservas/estado/{estado}` | Admin | Filtrar por estado |
| `POST` | `/api/reservas/` | Auth | Crear reserva |
| `PUT` | `/api/reservas/{id}` | Admin | Actualizar reserva |
| `DELETE` | `/api/reservas/{id}` | Admin | Eliminar reserva |
| `POST` | `/api/reservas/{id}/pagar` | Auth | Simular pago |
| `GET` | `/api/reservas/{id}/habitaciones` | Auth | Habitaciones de la reserva |
| `GET` | `/api/reservas/{id}/servicios` | Auth | Servicios de la reserva |
| `GET` | `/api/reservas/{id}/historial` | Auth | Historial de cambios |
| `GET` | `/api/reservas/historial-reservas/recientes` | Admin | Historial reciente |

---

## Pagos — `/api/pagos`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/pagos/metodos-pago` | No | Métodos de pago disponibles |
| `POST` | `/api/pagos/metodos-pago` | Admin | Crear método de pago |
| `GET` | `/api/pagos/` | Admin | Listar pagos |
| `GET` | `/api/pagos/{id}` | Admin | Obtener pago |
| `POST` | `/api/pagos/{id}/confirmar` | Admin | Confirmar pago asíncrono (PSE/Nequi) |
| `POST` | `/api/pagos/{id}/comprobante` | Auth | Subir comprobante (max 5MB) |
| `DELETE` | `/api/pagos/{id}/comprobante` | Auth | Eliminar comprobante |

---

## Paquetes — `/api/paquetes`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/paquetes/` | No | Listar paquetes (cached 2min) |
| `GET` | `/api/paquetes/populares` | No | Paquetes más populares (vista SQL) |
| `GET` | `/api/paquetes/{id}` | No | Obtener paquete |
| `GET` | `/api/paquetes/{id}/detalle` | No | Detalle con servicios y hoteles |
| `POST` | `/api/paquetes/` | Admin | Crear paquete |
| `PUT` | `/api/paquetes/{id}` | Admin | Actualizar paquete |
| `DELETE` | `/api/paquetes/{id}` | Admin | Eliminar paquete |

---

## Servicios — `/api/servicios`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/servicios/` | No | Listar servicios |
| `GET` | `/api/servicios/{id}` | No | Obtener servicio |
| `POST` | `/api/servicios/` | Admin | Crear servicio |
| `PUT` | `/api/servicios/{id}` | Admin | Actualizar servicio |
| `DELETE` | `/api/servicios/{id}` | Admin | Eliminar servicio |
| `GET` | `/api/servicios/categorias` | No | Listar categorías |

---

## Destinos — `/api/destinos`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/destinos/` | No | Listar destinos |
| `GET` | `/api/destinos/{id}` | No | Obtener destino |
| `POST` | `/api/destinos/` | Admin | Crear destino |
| `PUT` | `/api/destinos/{id}` | Admin | Actualizar destino |
| `DELETE` | `/api/destinos/{id}` | Admin | Eliminar destino |
| `GET` | `/api/destinos/sugerencias` | No | Sugerencias de destinos |

---

## Reseñas — `/api/resenas`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/resenas/` | No | Listar reseñas (paginado, con promedio) |
| `GET` | `/api/resenas/hotel/{id}` | No | Reseñas de un hotel |
| `GET` | `/api/resenas/destacadas` | No | Reseñas destacadas (cached 10min) |
| `POST` | `/api/resenas/` | Cliente | Crear reseña (1 por reserva, 1-5 estrellas) |

---

## Preferencias — `/api/preferencias-cliente`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/preferencias-cliente/` | Auth | Guardar preferencias |
| `GET` | `/api/preferencias-cliente/{cliente_id}` | Auth | Obtener preferencias |
| `GET` | `/api/preferencias-cliente/{cliente_id}/sugerencias` | Auth | Sugerencias personalizadas |
| `GET` | `/api/preferencias-cliente/{cliente_id}/sugerencias-hoteles` | Auth | Hoteles recomendados |

---

## Usuarios — `/api/usuarios`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/usuarios/` | Admin | Listar usuarios |
| `GET` | `/api/usuarios/{id}` | Admin | Obtener usuario |
| `POST` | `/api/usuarios/` | Admin | Crear usuario |
| `PUT` | `/api/usuarios/{id}` | Admin | Actualizar usuario |
| `DELETE` | `/api/usuarios/{id}` | Admin | Eliminar usuario |
| `GET` | `/api/usuarios/me` | Auth | Perfil del usuario actual |
| `PUT` | `/api/usuarios/me/password` | Auth | Cambiar contraseña |
| `POST` | `/api/usuarios/me/foto` | Auth | Subir foto de perfil |
| `DELETE` | `/api/usuarios/me/foto` | Auth | Eliminar foto de perfil |
| `PUT` | `/api/usuarios/{id}/vincular-cliente` | Admin | Vincular usuario con cliente |

---

## Otros Endpoints

### Favoritos — `/api/favoritos`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/favoritos/` | Auth | Lista de favoritos |
| `GET` | `/api/favoritos/ids` | Auth | IDs de hoteles favoritos |
| `POST` | `/api/favoritos/` | Auth | Agregar hotel a favoritos |
| `DELETE` | `/api/favoritos/{id_hotel}` | Auth | Quitar de favoritos |

### Notificaciones — `/api/notificaciones`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/notificaciones/` | Auth | Listar notificaciones |
| `GET` | `/api/notificaciones/no-leidas/conteo` | Auth | Conteo no leídas |
| `PUT` | `/api/notificaciones/leer-todas` | Auth | Marcar todas leídas |
| `PUT` | `/api/notificaciones/{id}/leer` | Auth | Marcar una leída |
| `DELETE` | `/api/notificaciones/{id}` | Auth | Eliminar notificación |

### Contacto — `/api/contacto`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/contacto/` | No | Enviar mensaje de contacto (email dual + notificación) |

### Promociones — `/api/promociones`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/promociones/destacados` | No | Promociones destacadas |
| `GET` | `/api/promociones/seleccion-casa` | No | Selección para home |

### Dashboard — `/api/dashboard`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/dashboard/resumen` | Admin | KPIs, métricas, gráficas (cached 60s) |

### Configuración — `/api/configuracion`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/configuracion/` | Admin | Listar configuración |
| `GET` | `/api/configuracion/{clave}` | Admin | Obtener valor |
| `POST` | `/api/configuracion/` | Admin | Crear configuración |
| `PUT` | `/api/configuracion/{clave}` | Admin | Actualizar configuración |
| `DELETE` | `/api/configuracion/{clave}` | Admin | Eliminar configuración |

### Solicitudes de Cancelación — `/api/solicitudes-cancelacion`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/solicitudes-cancelacion/` | Cliente | Crear solicitud |
| `GET` | `/api/solicitudes-cancelacion/` | Admin | Listar solicitudes |
| `PUT` | `/api/solicitudes-cancelacion/{id}/resolver` | Admin | Aprobar/rechazar (email en background) |

### Solicitudes Corporativas — `/api/solicitudes-corporativas`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/solicitudes-corporativas/` | No | Crear solicitud (público) |
| `GET` | `/api/solicitudes-corporativas/` | Admin | Listar solicitudes |
| `PUT` | `/api/solicitudes-corporativas/{id}` | Admin | Actualizar estado |
| `DELETE` | `/api/solicitudes-corporativas/{id}` | Admin | Eliminar solicitud |

### Banners — `/api/banners`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/banners/` | No | Banners activos |
| `GET` | `/api/banners/todos` | Admin | Todos los banners |
| `POST` | `/api/banners/` | Admin | Crear banner |
| `PUT` | `/api/banners/{id}` | Admin | Actualizar banner |
| `DELETE` | `/api/banners/{id}` | Admin | Eliminar banner |
| `PUT` | `/api/banners/orden` | Admin | Reordenar banners |

### Métodos de Pago Guardados — `/api/metodos-pago-guardados`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/metodos-pago-guardados/` | Auth | Listar métodos guardados |
| `POST` | `/api/metodos-pago-guardados/` | Auth | Guardar método de pago |
| `DELETE` | `/api/metodos-pago-guardados/{id}` | Auth | Eliminar método |
| `PUT` | `/api/metodos-pago-guardados/{id}/predeterminado` | Auth | Establecer predeterminado |
| `POST` | `/api/metodos-pago-guardados/{id}/verificar` | Auth | Verificar clave |

---

## Rate Limiting

Implementado con Redis token-bucket middleware:

| Endpoint | Límite | Razón |
|---|---|---|
| `POST /auth/login` | 5/60s | Prevenir brute force |
| `POST /auth/register` | 5/60s | Prevenir creación masiva |
| `POST /auth/forgot-password` | 3/60s | Prevenir spam de emails |
| `POST /auth/reset-password` | 5/60s | Prevenir abuso |
| `POST /api/reservas/*/pagar` | 10/60s | Prevenir fraude de pagos |

---

## Security Headers

Todas las respuestas incluyen:

| Header | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |

---

## Documentación Swagger

Disponible en desarrollo:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health check**: `http://localhost:8000/health`
