# Historias de Usuario - AlecTours

**Versión:** 1.0  
**Fecha:** Agosto 2026  
**Proyecto:** Sistema de Gestión Turística AlecTours

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Formato de Historias](#formato-de-historias)
3. [Épicas del Proyecto](#épicas-del-proyecto)
4. [Historias por Rol](#historias-por-rol)
   - [Cliente/Viajero](#clienteviajero)
   - [Empleado](#empleado)
   - [Administrador](#administrador)
5. [Backlog Priorizado](#backlog-priorizado)

---

## Introducción

Este documento contiene las historias de usuario del sistema AlecTours, organizadas por roles y épicas. Cada historia describe una funcionalidad desde la perspectiva del usuario final.

### Propósito

Comunicar de forma clara y concisa las necesidades y expectativas de los usuarios del sistema, facilitando la planificación y desarrollo iterativo.

### Audiencia

- Product Owner
- Equipo de Desarrollo
- Stakeholders
- Testers/QA

---

## Formato de Historias

Cada historia de usuario sigue el formato estándar:

```
Como [rol]
Quiero [funcionalidad]
Para [beneficio/valor]
```

Además incluye:
- **ID:** Identificador único
- **Épica:** Agrupación funcional
- **Prioridad:** Must Have / Should Have / Could Have / Won't Have (MoSCoW)
- **Story Points:** Estimación de esfuerzo (1, 2, 3, 5, 8, 13)
- **Criterios de Aceptación:** Condiciones que deben cumplirse

---

## Épicas del Proyecto

| ID | Épica | Descripción |
|----|-------|-------------|
| EP-01 | Autenticación y Registro | Gestión de cuentas y acceso al sistema |
| EP-02 | Búsqueda y Descubrimiento | Encontrar hoteles y destinos |
| EP-03 | Reservas | Crear y gestionar reservas |
| EP-04 | Pagos | Procesar pagos y comprobantes |
| EP-05 | Perfil de Usuario | Gestión de datos personales |
| EP-06 | Reseñas y Valoraciones | Compartir experiencias |
| EP-07 | Favoritos | Guardar hoteles de interés |
| EP-08 | Notificaciones | Recibir actualizaciones |
| EP-09 | Gestión de Hoteles | Administrar catálogo de hoteles |
| EP-10 | Gestión de Clientes | Administrar base de clientes |
| EP-11 | Reportes y Analytics | Visualizar métricas y estadísticas |
| EP-12 | Paquetes Turísticos | Ofertas combinadas |
| EP-13 | Cancelaciones | Gestión de cancelaciones y reembolsos |

---

## Historias por Rol

### Cliente/Viajero

#### EP-01: Autenticación y Registro

---

**HU-001: Registro de Cuenta**

**Como** nuevo usuario  
**Quiero** crear una cuenta en AlecTours  
**Para** poder hacer reservas y acceder a servicios personalizados

**Prioridad:** Must Have  
**Story Points:** 5  
**Épica:** EP-01

**Criterios de Aceptación:**
- Puedo registrarme con nombre completo, email y contraseña
- Recibo un email de verificación
- No puedo usar un email ya registrado
- La contraseña debe tener mínimo 8 caracteres
- Veo mensaje de confirmación tras registro exitoso

---

**HU-002: Verificación de Email**

**Como** usuario recién registrado  
**Quiero** verificar mi dirección de email  
**Para** activar mi cuenta y poder iniciar sesión

**Prioridad:** Must Have  
**Story Points:** 3  
**Épica:** EP-01

**Criterios de Aceptación:**
- Recibo un email con enlace de verificación
- El enlace me redirige a la plataforma
- Veo confirmación de cuenta activada
- Puedo iniciar sesión después de verificar
- El enlace expira después de 24 horas

---

**HU-003: Inicio de Sesión**

**Como** usuario registrado  
**Quiero** iniciar sesión con mi email y contraseña  
**Para** acceder a mi cuenta

**Prioridad:** Must Have  
**Story Points:** 3  
**Épica:** EP-01

**Criterios de Aceptación:**
- Puedo ingresar email y contraseña
- Veo mensaje de error si las credenciales son incorrectas
- Soy redirigido al home después de login exitoso
- Mi sesión permanece activa por 30 minutos
- Veo mi nombre de usuario en el header

---

**HU-004: Recuperación de Contraseña**

**Como** usuario que olvidó su contraseña  
**Quiero** poder restablecerla  
**Para** recuperar el acceso a mi cuenta

**Prioridad:** Must Have  
**Story Points:** 5  
**Épica:** EP-01

**Criterios de Aceptación:**
- Puedo solicitar recuperación desde login
- Recibo email con enlace de recuperación
- Puedo establecer nueva contraseña
- El enlace expira después de 1 hora
- Puedo iniciar sesión con la nueva contraseña

---

#### EP-02: Búsqueda y Descubrimiento

---

**HU-005: Búsqueda Básica de Hoteles**

**Como** viajero  
**Quiero** buscar hoteles por destino y fechas  
**Para** encontrar opciones para mi viaje

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-02

**Criterios de Aceptación:**
- Puedo seleccionar destino (ciudad/país)
- Puedo elegir fechas de check-in y check-out
- Puedo especificar número de huéspedes
- Veo lista de hoteles con disponibilidad
- Cada resultado muestra imagen, nombre, precio y calificación

---

**HU-006: Filtros de Búsqueda Avanzada**

**Como** viajero  
**Quiero** aplicar filtros a mi búsqueda  
**Para** encontrar el hotel que mejor se ajuste a mis necesidades

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-02

**Criterios de Aceptación:**
- Puedo filtrar por rango de precio
- Puedo filtrar por categoría (estrellas)
- Puedo filtrar por servicios (wifi, piscina, etc.)
- Los resultados se actualizan al aplicar filtros
- Puedo limpiar todos los filtros fácilmente

---

**HU-007: Ordenamiento de Resultados**

**Como** viajero  
**Quiero** ordenar los resultados de búsqueda  
**Para** ver primero las opciones más relevantes

**Prioridad:** Should Have  
**Story Points:** 2  
**Épica:** EP-02

**Criterios de Aceptación:**
- Puedo ordenar por precio (menor a mayor / mayor a menor)
- Puedo ordenar por calificación
- Puedo ordenar por popularidad
- El orden se mantiene al paginar resultados

---

**HU-008: Ver Detalles de Hotel**

**Como** viajero  
**Quiero** ver información completa de un hotel  
**Para** decidir si es adecuado para mi viaje

**Prioridad:** Must Have  
**Story Points:** 5  
**Épica:** EP-02

**Criterios de Aceptación:**
- Veo galería de imágenes del hotel
- Veo descripción detallada
- Veo lista de servicios incluidos
- Veo ubicación en mapa
- Veo reseñas de otros clientes
- Veo habitaciones disponibles con precios

---

**HU-009: Explorar Destinos Populares**

**Como** viajero sin destino definido  
**Quiero** ver destinos populares  
**Para** inspirarme y descubrir nuevos lugares

**Prioridad:** Should Have  
**Story Points:** 3  
**Épica:** EP-02

**Criterios de Aceptación:**
- Veo sección de destinos destacados en home
- Cada destino muestra imagen atractiva
- Puedo hacer clic para ver hoteles del destino
- Veo breve descripción de cada destino

---

#### EP-03: Reservas

---

**HU-010: Crear Reserva**

**Como** viajero  
**Quiero** reservar una habitación de hotel  
**Para** asegurar mi alojamiento

**Prioridad:** Must Have  
**Story Points:** 13  
**Épica:** EP-03

**Criterios de Aceptación:**
- Puedo seleccionar habitación y fechas
- Veo resumen de reserva con precio total
- Puedo agregar información de huéspedes
- Veo políticas de cancelación antes de confirmar
- Recibo código de reserva único
- Recibo email de confirmación

---

**HU-011: Ver Mis Reservas**

**Como** cliente  
**Quiero** ver todas mis reservas  
**Para** gestionar mis viajes

**Prioridad:** Must Have  
**Story Points:** 5  
**Épica:** EP-03

**Criterios de Aceptación:**
- Veo lista de mis reservas (activas y pasadas)
- Puedo filtrar por estado (pendiente, confirmada, completada, cancelada)
- Puedo ver detalles de cada reserva
- Veo fechas de check-in y check-out claramente
- Puedo descargar comprobante en PDF

---

**HU-012: Cancelar Reserva**

**Como** cliente con reserva  
**Quiero** cancelar mi reserva  
**Para** recuperar mi dinero según las políticas

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-03

**Criterios de Aceptación:**
- Puedo solicitar cancelación desde mis reservas
- Veo política de cancelación aplicable
- Veo monto de reembolso calculado
- Debo confirmar la cancelación
- Recibo email de confirmación de cancelación
- El reembolso se procesa según política

---

**HU-013: Modificar Reserva**

**Como** cliente con reserva  
**Quiero** modificar fechas de mi reserva  
**Para** ajustar mis planes de viaje

**Prioridad:** Should Have  
**Story Points:** 8  
**Épica:** EP-03

**Criterios de Aceptación:**
- Puedo cambiar fechas si hay disponibilidad
- Veo diferencia de precio si aplica
- Debo confirmar los cambios
- Recibo email con reserva actualizada
- El historial de cambios queda registrado

---

#### EP-04: Pagos

---

**HU-014: Pagar Reserva con Tarjeta**

**Como** cliente  
**Quiero** pagar mi reserva con tarjeta de crédito/débito  
**Para** confirmar mi reserva de forma inmediata

**Prioridad:** Must Have  
**Story Points:** 13  
**Épica:** EP-04

**Criterios de Aceptación:**
- Puedo ingresar datos de tarjeta de forma segura
- Veo proceso de pago con indicador de progreso
- Recibo confirmación de pago exitoso
- La reserva cambia a estado "confirmada"
- Recibo comprobante de pago por email

---

**HU-015: Subir Comprobante de Pago**

**Como** cliente que pagó por transferencia  
**Quiero** subir mi comprobante de pago  
**Para** que verifiquen y confirmen mi reserva

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-04

**Criterios de Aceptación:**
- Puedo subir archivo (PDF, JPG, PNG)
- Veo confirmación de recepción
- Recibo notificación cuando se verifique el pago
- El archivo no puede exceder 5MB

---

**HU-016: Guardar Método de Pago**

**Como** cliente frecuente  
**Quiero** guardar mi tarjeta para futuros pagos  
**Para** agilizar el proceso de reserva

**Prioridad:** Could Have  
**Story Points:** 5  
**Épica:** EP-04

**Criterios de Aceptación:**
- Puedo optar por guardar tarjeta al pagar
- Solo se guardan últimos 4 dígitos visibles
- Puedo eliminar tarjetas guardadas
- Puedo marcar una como predeterminada
- Los datos están cifrados

---

#### EP-05: Perfil de Usuario

---

**HU-017: Editar Mi Perfil**

**Como** usuario registrado  
**Quiero** actualizar mi información personal  
**Para** mantener mis datos actualizados

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-05

**Criterios de Aceptación:**
- Puedo actualizar nombre, teléfono
- Puedo subir foto de perfil
- Puedo cambiar contraseña
- Veo confirmación de cambios guardados
- El cambio de email requiere verificación

---

**HU-018: Ver Historial de Viajes**

**Como** cliente  
**Quiero** ver mi historial completo de viajes  
**Para** recordar mis experiencias y estadísticas

**Prioridad:** Could Have  
**Story Points:** 3  
**Épica:** EP-05

**Criterios de Aceptación:**
- Veo todas mis reservas completadas
- Veo total de noches hospedadas
- Veo total gastado en la plataforma
- Veo hoteles visitados

---

#### EP-06: Reseñas y Valoraciones

---

**HU-019: Escribir Reseña de Hotel**

**Como** cliente que completó una estancia  
**Quiero** dejar una reseña del hotel  
**Para** compartir mi experiencia con otros viajeros

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-06

**Criterios de Aceptación:**
- Puedo calificar con 1-5 estrellas
- Puedo escribir comentario (mínimo 20 caracteres)
- Solo puedo reseñar hoteles donde me hospedé
- Una reseña por reserva
- La reseña aparece en detalle del hotel

---

**HU-020: Leer Reseñas de Otros**

**Como** viajero  
**Quiero** leer reseñas de otros clientes  
**Para** tomar una decisión informada

**Prioridad:** Should Have  
**Story Points:** 2  
**Épica:** EP-06

**Criterios de Aceptación:**
- Veo reseñas en detalle de hotel
- Veo calificación promedio
- Puedo filtrar por calificación
- Veo fecha de la reseña
- Veo indicador de "reserva verificada"

---

#### EP-07: Favoritos

---

**HU-021: Agregar Hotel a Favoritos**

**Como** viajero interesado en un hotel  
**Quiero** guardarlo en mis favoritos  
**Para** encontrarlo fácilmente después

**Prioridad:** Could Have  
**Story Points:** 3  
**Épica:** EP-07

**Criterios de Aceptación:**
- Puedo hacer clic en ícono de corazón
- Veo confirmación visual inmediata
- El hotel se agrega a mi lista de favoritos
- Puedo remover de favoritos fácilmente

---

**HU-022: Ver Mis Favoritos**

**Como** usuario con favoritos guardados  
**Quiero** acceder a mi lista de favoritos  
**Para** revisar hoteles que me interesan

**Prioridad:** Could Have  
**Story Points:** 2  
**Épica:** EP-07

**Criterios de Aceptación:**
- Veo todos mis hoteles favoritos
- Puedo acceder a detalles de cada uno
- Puedo eliminar de la lista
- Veo si están disponibles para mis fechas

---

#### EP-08: Notificaciones

---

**HU-023: Recibir Notificaciones por Email**

**Como** cliente con reserva  
**Quiero** recibir notificaciones importantes por email  
**Para** estar informado sobre mi reserva

**Prioridad:** Must Have  
**Story Points:** 5  
**Épica:** EP-08

**Criterios de Aceptación:**
- Recibo email al confirmar reserva
- Recibo recordatorio 7 días antes de check-in
- Recibo recordatorio 1 día antes
- Recibo notificación si hay cambios en reserva
- Puedo desactivar notificaciones no esenciales

---

**HU-024: Notificaciones en la Plataforma**

**Como** usuario activo  
**Quiero** ver notificaciones dentro de la plataforma  
**Para** estar al día con actualizaciones

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-08

**Criterios de Aceptación:**
- Veo ícono con contador de notificaciones nuevas
- Puedo ver lista de notificaciones
- Puedo marcar como leídas
- Las notificaciones se organizan por fecha
- Se eliminan automáticamente después de 30 días

---

#### EP-12: Paquetes Turísticos

---

**HU-025: Buscar Paquetes Turísticos**

**Como** viajero buscando oferta completa  
**Quiero** ver paquetes que incluyan hotel y actividades  
**Para** simplificar la planificación de mi viaje

**Prioridad:** Should Have  
**Story Points:** 8  
**Épica:** EP-12

**Criterios de Aceptación:**
- Veo sección dedicada a paquetes
- Puedo filtrar por destino y duración
- Veo qué incluye cada paquete
- Veo precio total con descuento
- Puedo comparar con servicios individuales

---

**HU-026: Reservar Paquete Turístico**

**Como** viajero interesado en paquete  
**Quiero** reservar paquete completo  
**Para** obtener descuento y comodidad

**Prioridad:** Should Have  
**Story Points:** 8  
**Épica:** EP-12

**Criterios de Aceptación:**
- Puedo personalizar algunas opciones del paquete
- Veo resumen con todos los servicios incluidos
- Puedo pagar el paquete completo
- Recibo confirmación de todas las reservas
- Obtengo código único de paquete

---

### Empleado

#### EP-09: Gestión de Hoteles

---

**HU-027: Registrar Nuevo Hotel**

**Como** empleado  
**Quiero** agregar un nuevo hotel al sistema  
**Para** ampliarnuestro catálogo

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-09

**Criterios de Aceptación:**
- Puedo ingresar datos completos del hotel
- Puedo subir múltiples imágenes
- Puedo asociar el hotel a un destino
- Puedo especificar servicios disponibles
- El hotel queda visible en búsquedas

---

**HU-028: Gestionar Habitaciones**

**Como** empleado  
**Quiero** agregar y editar habitaciones de un hotel  
**Para** mantener actualizada la oferta

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-09

**Criterios de Aceptación:**
- Puedo agregar nuevas habitaciones
- Puedo especificar tipo, capacidad y precio
- Puedo definir disponibilidad
- Puedo subir fotos de habitaciones
- Puedo editar o desactivar habitaciones

---

**HU-029: Actualizar Información de Hotel**

**Como** empleado  
**Quiero** editar información de hoteles existentes  
**Para** mantener los datos actualizados

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-09

**Criterios de Aceptación:**
- Puedo editar descripción, servicios, precios
- Puedo agregar/eliminar imágenes
- Los cambios se reflejan inmediatamente
- Se registra historial de cambios

---

#### EP-10: Gestión de Clientes

---

**HU-030: Buscar Cliente**

**Como** empleado  
**Quiero** buscar un cliente en el sistema  
**Para** acceder a su información y reservas

**Prioridad:** Must Have  
**Story Points:** 3  
**Épica:** EP-10

**Criterios de Aceptación:**
- Puedo buscar por nombre, email o documento
- Veo resultados relevantes
- Puedo acceder al perfil completo del cliente
- Veo historial de reservas del cliente

---

**HU-031: Crear Reserva para Cliente**

**Como** empleado  
**Quiero** crear una reserva en nombre de un cliente  
**Para** asistir en la reserva telefónica o presencial

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-10

**Criterios de Aceptación:**
- Puedo buscar o crear cliente
- Puedo seleccionar hotel y habitación
- Puedo especificar fechas y huéspedes
- Puedo registrar método de pago
- El cliente recibe confirmación por email

---

**HU-032: Ver Historial de Cliente**

**Como** empleado  
**Quiero** ver el historial completo de un cliente  
**Para** brindar mejor servicio

**Prioridad:** Should Have  
**Story Points:** 3  
**Épica:** EP-10

**Criterios de Aceptación:**
- Veo todas las reservas pasadas y activas
- Veo total gastado
- Veo reseñas escritas
- Veo preferencias del cliente

---

#### EP-13: Cancelaciones

---

**HU-033: Aprobar Solicitud de Cancelación**

**Como** empleado  
**Quiero** revisar y aprobar solicitudes de cancelación  
**Para** procesar reembolsos

**Prioridad:** Must Have  
**Story Points:** 5  
**Épica:** EP-13

**Criterios de Aceptación:**
- Veo lista de solicitudes pendientes
- Veo detalles de la reserva y razón de cancelación
- Puedo aprobar o rechazar con justificación
- El reembolso se procesa automáticamente si apruebo
- El cliente recibe notificación de la decisión

---

**HU-034: Gestionar Reembolsos**

**Como** empleado  
**Quiero** gestionar reembolsos de cancelaciones  
**Para** asegurar que los clientes reciban su dinero

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-13

**Criterios de Aceptación:**
- Veo lista de reembolsos pendientes
- Puedo marcar como procesado
- Puedo ver estado del reembolso
- Se registra fecha y responsable del reembolso

---

### Administrador

#### EP-11: Reportes y Analytics

---

**HU-035: Ver Dashboard Administrativo**

**Como** administrador  
**Quiero** ver métricas clave del negocio  
**Para** tomar decisiones informadas

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-11

**Criterios de Aceptación:**
- Veo reservas del día/mes
- Veo ingresos totales
- Veo tasa de ocupación
- Veo nuevos clientes registrados
- Puedo filtrar por rango de fechas
- Los datos se actualizan en tiempo real

---

**HU-036: Generar Reporte de Ventas**

**Como** administrador  
**Quiero** generar reportes de ventas  
**Para** analizar el desempeño del negocio

**Prioridad:** Should Have  
**Story Points:** 8  
**Épica:** EP-11

**Criterios de Aceptación:**
- Puedo seleccionar período del reporte
- Veo ingresos totales, por hotel, por tipo
- Puedo exportar a PDF o Excel
- El reporte incluye gráficos visuales
- Puedo comparar períodos

---

**HU-037: Ver Reporte de Ocupación**

**Como** administrador  
**Quiero** ver reportes de ocupación  
**Para** optimizar precios y disponibilidad

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-11

**Criterios de Aceptación:**
- Veo porcentaje de ocupación por hotel
- Veo ocupación por período
- Veo proyección de ocupación futura
- Puedo identificar temporadas altas/bajas

---

**HU-038: Gestionar Usuarios y Roles**

**Como** administrador  
**Quiero** gestionar usuarios del sistema  
**Para** controlar accesos y permisos

**Prioridad:** Must Have  
**Story Points:** 8  
**Épica:** EP-11

**Criterios de Aceptación:**
- Puedo ver lista de todos los usuarios
- Puedo asignar roles (admin, empleado, cliente)
- Puedo activar/desactivar cuentas
- Puedo resetear contraseñas
- Registro de cambios de permisos

---

**HU-039: Moderar Reseñas**

**Como** administrador  
**Quiero** revisar y moderar reseñas  
**Para** mantener calidad del contenido

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-11

**Criterios de Aceptación:**
- Veo lista de reseñas pendientes
- Puedo aprobar o rechazar reseñas
- Puedo eliminar reseñas inapropiadas
- Puedo responder a reseñas en nombre del hotel
- El autor recibe notificación si se rechaza

---

**HU-040: Configurar Banners Promocionales**

**Como** administrador  
**Quiero** gestionar banners del sitio  
**Para** promocionar ofertas y destinos

**Prioridad:** Could Have  
**Story Points:** 5  
**Épica:** EP-11

**Criterios de Aceptación:**
- Puedo subir imagen de banner
- Puedo configurar enlace de destino
- Puedo activar/desactivar banners
- Puedo definir orden de visualización
- Los banners se muestran en home

---

**HU-041: Ver Logs de Actividad del Sistema**

**Como** administrador  
**Quiero** ver logs de actividades críticas  
**Para** auditar el uso del sistema

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-11

**Criterios de Aceptación:**
- Veo registro de logins y cambios importantes
- Puedo filtrar por usuario, fecha, tipo de acción
- Veo IP de origen
- Los logs no pueden ser modificados
- Puedo exportar logs

---

**HU-042: Configurar Políticas de Cancelación**

**Como** administrador  
**Quiero** definir políticas de cancelación  
**Para** estandarizar el proceso de reembolsos

**Prioridad:** Should Have  
**Story Points:** 5  
**Épica:** EP-13

**Criterios de Aceptación:**
- Puedo definir porcentaje de reembolso por anticipación
- Puedo configurar excepciones por hotel
- Las políticas se muestran al cliente al reservar
- Se aplican automáticamente al calcular reembolsos

---

## Backlog Priorizado

### Sprint 1: Fundamentos (Must Have)
1. HU-001: Registro de Cuenta
2. HU-002: Verificación de Email
3. HU-003: Inicio de Sesión
4. HU-004: Recuperación de Contraseña
5. HU-027: Registrar Nuevo Hotel
6. HU-028: Gestionar Habitaciones

### Sprint 2: Búsqueda y Descubrimiento (Must Have)
7. HU-005: Búsqueda Básica de Hoteles
8. HU-008: Ver Detalles de Hotel
9. HU-030: Buscar Cliente
10. HU-031: Crear Reserva para Cliente

### Sprint 3: Reservas Core (Must Have)
11. HU-010: Crear Reserva
12. HU-011: Ver Mis Reservas
13. HU-014: Pagar Reserva con Tarjeta
14. HU-023: Recibir Notificaciones por Email

### Sprint 4: Gestión de Reservas (Must Have)
15. HU-012: Cancelar Reserva
16. HU-033: Aprobar Solicitud de Cancelación
17. HU-035: Ver Dashboard Administrativo
18. HU-038: Gestionar Usuarios y Roles

### Sprint 5: Mejoras de Experiencia (Should Have)
19. HU-006: Filtros de Búsqueda Avanzada
20. HU-007: Ordenamiento de Resultados
21. HU-009: Explorar Destinos Populares
22. HU-013: Modificar Reserva
23. HU-015: Subir Comprobante de Pago

### Sprint 6: Perfil y Contenido (Should Have)
24. HU-017: Editar Mi Perfil
25. HU-019: Escribir Reseña de Hotel
26. HU-020: Leer Reseñas de Otros
27. HU-024: Notificaciones en la Plataforma
28. HU-029: Actualizar Información de Hotel

### Sprint 7: Analytics y Reportes (Should Have)
29. HU-032: Ver Historial de Cliente
30. HU-034: Gestionar Reembolsos
31. HU-036: Generar Reporte de Ventas
32. HU-037: Ver Reporte de Ocupación
33. HU-039: Moderar Reseñas

### Sprint 8: Paquetes y Avanzado (Should Have)
34. HU-025: Buscar Paquetes Turísticos
35. HU-026: Reservar Paquete Turístico
36. HU-041: Ver Logs de Actividad del Sistema
37. HU-042: Configurar Políticas de Cancelación

### Backlog (Could Have)
38. HU-016: Guardar Método de Pago
39. HU-018: Ver Historial de Viajes
40. HU-021: Agregar Hotel a Favoritos
41. HU-022: Ver Mis Favoritos
42. HU-040: Configurar Banners Promocionales

---

## Estimación Total

| Prioridad | Story Points | Historias |
|-----------|--------------|-----------|
| Must Have | 98 | 18 |
| Should Have | 86 | 17 |
| Could Have | 18 | 7 |
| **Total** | **202** | **42** |

---

## Convenciones

### Story Points
- **1:** Muy simple, < 2 horas
- **2:** Simple, 2-4 horas
- **3:** Pequeño, 4-8 horas
- **5:** Mediano, 1-2 días
- **8:** Grande, 2-4 días
- **13:** Muy grande, > 4 días (considerar dividir)

### Estados de Historia
- **Backlog:** Por planificar
- **Ready:** Lista para desarrollo
- **In Progress:** En desarrollo
- **In Review:** En revisión/testing
- **Done:** Completada y aceptada

---

## Glosario

- **Cliente:** Usuario final que reserva hoteles
- **Empleado:** Personal de AlecTours que gestiona operaciones
- **Administrador:** Usuario con permisos completos
- **Check-in:** Fecha de llegada al hotel
- **Check-out:** Fecha de salida del hotel
- **Comprobante:** Documento que acredita un pago

---

## Control de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Agosto 2026 | Equipo AlecTours | Versión inicial con 42 historias |

---

**Fin del Documento**
