# Requisitos Funcionales - AlecTours

**Versión:** 1.0  
**Fecha:** Agosto 2026  
**Proyecto:** Sistema de Gestión Turística AlecTours

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Módulo de Autenticación y Usuarios](#módulo-de-autenticación-y-usuarios)
3. [Módulo de Hoteles](#módulo-de-hoteles)
4. [Módulo de Reservas](#módulo-de-reservas)
5. [Módulo de Clientes](#módulo-de-clientes)
6. [Módulo de Paquetes Turísticos](#módulo-de-paquetes-turísticos)
7. [Módulo de Pagos](#módulo-de-pagos)
8. [Módulo de Notificaciones](#módulo-de-notificaciones)
9. [Módulo de Reseñas](#módulo-de-reseñas)
10. [Módulo de Favoritos](#módulo-de-favoritos)
11. [Módulo de Destinos](#módulo-de-destinos)
12. [Módulo de Empresas](#módulo-de-empresas)
13. [Módulo de Cancelaciones](#módulo-de-cancelaciones)
14. [Módulo de Dashboard](#módulo-de-dashboard)
15. [Módulo de Banners](#módulo-de-banners)

---

## Introducción

Este documento describe los requisitos funcionales del sistema AlecTours, una plataforma integral para la gestión de servicios turísticos que incluye hoteles, reservas, paquetes turísticos y gestión de clientes.

### Propósito

Definir de forma clara y precisa todas las funcionalidades que debe proveer el sistema AlecTours a sus usuarios finales, administradores y empleados.

### Alcance

Los requisitos funcionales cubren todos los módulos del sistema, desde la autenticación hasta la gestión de reservas, pagos y análisis de datos.

---

## Módulo de Autenticación y Usuarios

### RF-AUTH-001: Registro de Usuarios
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir el registro de nuevos usuarios proporcionando información básica.

**Criterios de Aceptación:**
- El usuario debe proporcionar: nombre completo, email, contraseña
- El email debe ser único en el sistema
- La contraseña debe tener al menos 8 caracteres
- El sistema debe enviar un email de verificación
- El usuario debe verificar su email antes de poder iniciar sesión

**Flujo Principal:**
1. Usuario accede al formulario de registro
2. Usuario completa los campos requeridos
3. Sistema valida la información
4. Sistema crea la cuenta en estado "no verificado"
5. Sistema envía email de verificación
6. Usuario hace clic en el enlace de verificación
7. Sistema activa la cuenta

---

### RF-AUTH-002: Inicio de Sesión
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir a usuarios registrados autenticarse mediante email y contraseña.

**Criterios de Aceptación:**
- El usuario debe proporcionar email y contraseña válidos
- El sistema debe validar las credenciales
- Solo cuentas verificadas pueden iniciar sesión
- El sistema debe generar un token JWT con expiración de 30 minutos
- El sistema debe implementar rate limiting (máximo 5 intentos por minuto)

**Flujo Principal:**
1. Usuario ingresa email y contraseña
2. Sistema valida credenciales
3. Sistema verifica que la cuenta esté activa
4. Sistema genera token JWT
5. Sistema retorna token y datos básicos del usuario

---

### RF-AUTH-003: Recuperación de Contraseña
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir a usuarios recuperar su contraseña mediante email.

**Criterios de Aceptación:**
- El usuario debe proporcionar su email registrado
- El sistema debe enviar un enlace de recuperación válido por 1 hora
- El enlace debe ser de un solo uso
- El usuario debe poder establecer una nueva contraseña
- El sistema debe aplicar rate limiting (máximo 3 intentos por hora)

---

### RF-AUTH-004: Gestión de Roles
**Prioridad:** Alta  
**Descripción:** El sistema debe soportar diferentes roles de usuario con permisos específicos.

**Roles Definidos:**
- **Admin:** Acceso total al sistema
- **Empleado:** Gestión de reservas, clientes y hoteles
- **Cliente:** Acceso a funcionalidades de usuario final

**Criterios de Aceptación:**
- Cada usuario debe tener un rol asignado
- El rol determina los permisos de acceso
- Solo administradores pueden asignar roles
- El sistema debe validar permisos en cada operación

---

### RF-AUTH-005: Gestión de Perfil
**Prioridad:** Media  
**Descripción:** Los usuarios deben poder actualizar su información de perfil.

**Criterios de Aceptación:**
- El usuario puede actualizar: nombre, teléfono, foto de perfil
- El cambio de email requiere verificación
- El sistema debe permitir cambio de contraseña con validación de contraseña actual
- La foto de perfil debe tener límite de 5MB
- Formatos soportados: JPG, PNG, WEBP

---

## Módulo de Hoteles

### RF-HOT-001: Registro de Hoteles
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir a administradores y empleados registrar nuevos hoteles.

**Criterios de Aceptación:**
- Información requerida: nombre, dirección, ciudad, país, descripción, categoría (1-5 estrellas)
- El sistema debe permitir subir imágenes del hotel (máximo 10)
- El sistema debe permitir especificar servicios disponibles
- El hotel debe estar asociado a un destino existente
- El sistema debe validar que no exista un hotel duplicado

---

### RF-HOT-002: Gestión de Habitaciones
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir gestionar habitaciones asociadas a cada hotel.

**Criterios de Aceptación:**
- Información requerida: tipo, capacidad, precio por noche, descripción
- El sistema debe permitir definir disponibilidad por rango de fechas
- El sistema debe calcular automáticamente disponibilidad según reservas
- El sistema debe permitir subir imágenes de la habitación
- El sistema debe validar que la capacidad sea mayor a 0

---

### RF-HOT-003: Búsqueda de Hoteles
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir buscar hoteles aplicando filtros.

**Criterios de Aceptación:**
- Filtros disponibles: destino, rango de fechas, número de huéspedes, precio, categoría
- El sistema debe mostrar solo hoteles con disponibilidad
- Los resultados deben incluir precio base por noche
- El sistema debe soportar ordenamiento por: precio, popularidad, calificación
- Los resultados deben incluir imágenes y calificación promedio

---

### RF-HOT-004: Detalle de Hotel
**Prioridad:** Alta  
**Descripción:** El sistema debe mostrar información detallada de un hotel específico.

**Criterios de Aceptación:**
- Información mostrada: descripción completa, galería de imágenes, servicios, ubicación
- El sistema debe mostrar habitaciones disponibles con precios
- El sistema debe mostrar reseñas de clientes
- El sistema debe mostrar calificación promedio
- El sistema debe incluir mapa de ubicación

---

### RF-HOT-005: Actualización de Hoteles
**Prioridad:** Media  
**Descripción:** Los administradores y empleados deben poder actualizar información de hoteles.

**Criterios de Aceptación:**
- Se puede actualizar toda la información excepto el ID
- El sistema debe registrar el historial de cambios
- Solo usuarios con permisos pueden realizar actualizaciones
- El sistema debe validar la integridad de los datos

---

### RF-HOT-006: Eliminación de Hoteles
**Prioridad:** Baja  
**Descripción:** Los administradores pueden desactivar hoteles.

**Criterios de Aceptación:**
- La eliminación es lógica (soft delete), no física
- El sistema debe validar que no existan reservas activas
- El hotel eliminado no aparece en búsquedas
- Se debe requerir confirmación de la acción
- Se debe registrar quién y cuándo realizó la eliminación

---

## Módulo de Reservas

### RF-RES-001: Creación de Reservas
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir crear reservas de habitaciones de hotel.

**Criterios de Aceptación:**
- Información requerida: cliente, hotel, habitación, fechas (check-in/check-out), número de huéspedes
- El sistema debe validar disponibilidad en tiempo real
- El sistema debe calcular precio total automáticamente
- El sistema debe aplicar descuentos si existen promociones activas
- El sistema debe generar un código único de reserva
- Estado inicial: "pendiente"

---

### RF-RES-002: Confirmación de Reservas
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir confirmar reservas una vez realizado el pago.

**Criterios de Aceptación:**
- Solo se pueden confirmar reservas en estado "pendiente"
- El sistema debe actualizar la disponibilidad de la habitación
- El sistema debe enviar email de confirmación al cliente
- El sistema debe generar un comprobante de reserva en PDF
- Estado final: "confirmada"

---

### RF-RES-003: Consulta de Reservas
**Prioridad:** Alta  
**Descripción:** Los usuarios deben poder consultar sus reservas.

**Criterios de Aceptación:**
- Los clientes ven solo sus propias reservas
- Los empleados y admins ven todas las reservas
- El sistema debe permitir filtrar por: estado, fechas, hotel
- El sistema debe mostrar información completa de cada reserva
- El sistema debe soportar paginación

---

### RF-RES-004: Modificación de Reservas
**Prioridad:** Media  
**Descripción:** El sistema debe permitir modificar reservas antes del check-in.

**Criterios de Aceptación:**
- Solo se pueden modificar reservas en estado "pendiente" o "confirmada"
- El sistema debe validar disponibilidad si se cambian fechas
- El sistema debe recalcular el precio si aplica
- El sistema debe notificar al cliente de los cambios
- El sistema debe registrar el historial de modificaciones

---

### RF-RES-005: Cancelación de Reservas
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir cancelar reservas bajo políticas definidas.

**Criterios de Aceptación:**
- El sistema debe aplicar políticas de cancelación según tiempo anticipado
- El sistema debe calcular reembolso según política
- El sistema debe liberar la disponibilidad de la habitación
- El sistema debe enviar notificación de cancelación
- Estado final: "cancelada"
- El sistema debe registrar razón de cancelación

---

### RF-RES-006: Check-in Digital
**Prioridad:** Media  
**Descripción:** El sistema debe permitir realizar check-in de forma digital.

**Criterios de Aceptación:**
- Solo reservas confirmadas pueden hacer check-in
- El check-in solo es posible el día de la fecha de inicio
- El sistema debe cambiar estado a "en curso"
- El sistema debe notificar al hotel
- El sistema debe generar confirmación de check-in

---

### RF-RES-007: Check-out
**Prioridad:** Media  
**Descripción:** El sistema debe registrar el check-out de las reservas.

**Criterios de Aceptación:**
- Solo reservas en estado "en curso" pueden hacer check-out
- El sistema debe cambiar estado a "completada"
- El sistema debe solicitar reseña al cliente
- El sistema debe liberar la habitación
- El sistema debe calcular cargos adicionales si aplican

---

## Módulo de Clientes

### RF-CLI-001: Registro de Clientes
**Prioridad:** Alta  
**Descripción:** El sistema debe almacenar información detallada de clientes.

**Criterios de Aceptación:**
- Información almacenada: nombre, apellido, email, teléfono, documento de identidad
- El email debe ser único
- El sistema debe asociar cliente con usuario si corresponde
- El sistema debe validar formato de datos
- El sistema debe permitir registrar preferencias del cliente

---

### RF-CLI-002: Historial de Reservas de Cliente
**Prioridad:** Media  
**Descripción:** El sistema debe mantener historial completo de reservas por cliente.

**Criterios de Aceptación:**
- El historial incluye todas las reservas (activas, pasadas, canceladas)
- El sistema debe mostrar estadísticas: total gastado, número de reservas
- El sistema debe permitir filtrar por rango de fechas
- El sistema debe mostrar detalles de cada reserva

---

### RF-CLI-003: Preferencias de Cliente
**Prioridad:** Baja  
**Descripción:** El sistema debe almacenar preferencias de los clientes.

**Criterios de Aceptación:**
- Preferencias: tipo de habitación, servicios preferidos, restricciones alimentarias
- El sistema debe sugerir opciones basadas en preferencias
- El cliente puede actualizar sus preferencias en cualquier momento

---

### RF-CLI-004: Gestión de Métodos de Pago
**Prioridad:** Media  
**Descripción:** El sistema debe permitir guardar métodos de pago de forma segura.

**Criterios de Aceptación:**
- El cliente puede guardar múltiples tarjetas de crédito/débito
- El sistema solo almacena últimos 4 dígitos y marca
- Los datos sensibles se almacenan mediante tokenización
- El cliente puede marcar un método como predeterminado
- El cliente puede eliminar métodos de pago

---

## Módulo de Paquetes Turísticos

### RF-PAQ-001: Creación de Paquetes
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir crear paquetes turísticos que incluyan múltiples servicios.

**Criterios de Aceptación:**
- Un paquete incluye: hotel, actividades, transporte, comidas
- El sistema debe calcular precio total del paquete
- El sistema debe aplicar descuento por paquete completo
- El sistema debe permitir personalización limitada
- El sistema debe validar disponibilidad de todos los componentes

---

### RF-PAQ-002: Búsqueda de Paquetes
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir buscar paquetes turísticos.

**Criterios de Aceptación:**
- Filtros disponibles: destino, duración, precio, tipo de viaje
- El sistema debe mostrar paquetes con disponibilidad
- Los resultados deben incluir: itinerario, precio, servicios incluidos
- El sistema debe soportar ordenamiento

---

### RF-PAQ-003: Reserva de Paquetes
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir reservar paquetes completos.

**Criterios de Aceptación:**
- El sistema debe validar disponibilidad de todos los componentes
- El sistema debe generar reservas individuales para cada servicio
- El sistema debe agrupar las reservas bajo un código de paquete
- El sistema debe aplicar precio de paquete
- El pago debe cubrir el paquete completo

---

## Módulo de Pagos

### RF-PAG-001: Procesamiento de Pagos
**Prioridad:** Alta  
**Descripción:** El sistema debe procesar pagos de forma segura.

**Criterios de Aceptación:**
- Métodos de pago: tarjeta de crédito, débito, transferencia
- El sistema debe validar fondos disponibles
- El sistema debe generar comprobante de pago
- El sistema debe actualizar estado de reserva tras pago exitoso
- El sistema debe registrar método de pago utilizado

---

### RF-PAG-002: Registro de Comprobantes
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir cargar comprobantes de pago manual.

**Criterios de Aceptación:**
- Formatos soportados: PDF, JPG, PNG
- Tamaño máximo: 5MB
- El sistema debe asociar comprobante con reserva
- El estado cambia a "pendiente de verificación"
- Empleados/admins deben verificar y aprobar

---

### RF-PAG-003: Gestión de Reembolsos
**Prioridad:** Media  
**Descripción:** El sistema debe gestionar reembolsos de reservas canceladas.

**Criterios de Aceptación:**
- El sistema debe calcular monto de reembolso según política
- El sistema debe registrar solicitud de reembolso
- El sistema debe notificar al cliente del proceso
- El sistema debe permitir seguimiento del reembolso
- El estado final debe ser "reembolsado"

---

## Módulo de Notificaciones

### RF-NOT-001: Notificaciones por Email
**Prioridad:** Alta  
**Descripción:** El sistema debe enviar notificaciones importantes por email.

**Criterios de Aceptación:**
- Eventos que generan email: registro, confirmación de reserva, cancelación, recordatorios
- Los emails deben incluir información relevante
- Los emails deben tener formato HTML responsive
- El sistema debe registrar envíos de email
- El sistema debe reintentar envíos fallidos

---

### RF-NOT-002: Notificaciones en la Plataforma
**Prioridad:** Media  
**Descripción:** El sistema debe mostrar notificaciones dentro de la plataforma.

**Criterios de Aceptación:**
- Las notificaciones aparecen en tiempo real
- El usuario puede marcar como leídas
- El sistema debe mostrar contador de no leídas
- El sistema debe permitir filtrar por tipo
- Las notificaciones persisten por 30 días

---

### RF-NOT-003: Recordatorios Automáticos
**Prioridad:** Media  
**Descripción:** El sistema debe enviar recordatorios automáticos de reservas.

**Criterios de Aceptación:**
- Recordatorio 7 días antes del check-in
- Recordatorio 1 día antes del check-in
- Recordatorio de check-out
- El sistema debe permitir desactivar recordatorios
- Los recordatorios incluyen detalles de la reserva

---

## Módulo de Reseñas

### RF-REW-001: Creación de Reseñas
**Prioridad:** Media  
**Descripción:** Los clientes deben poder dejar reseñas de hoteles.

**Criterios de Aceptación:**
- Solo clientes con reservas completadas pueden reseñar
- Información requerida: calificación (1-5 estrellas), comentario
- Una reseña por reserva
- El sistema debe validar que la reserva esté completada
- El sistema debe prevenir spam y contenido inapropiado

---

### RF-REW-002: Moderación de Reseñas
**Prioridad:** Media  
**Descripción:** Los administradores deben poder moderar reseñas.

**Criterios de Aceptación:**
- El sistema debe permitir aprobar/rechazar reseñas
- El sistema debe permitir eliminar reseñas inapropiadas
- Las reseñas rechazadas no se muestran públicamente
- El sistema debe notificar al autor si su reseña es rechazada

---

### RF-REW-003: Visualización de Reseñas
**Prioridad:** Media  
**Descripción:** El sistema debe mostrar reseñas en detalle de hotel.

**Criterios de Aceptación:**
- Las reseñas se muestran ordenadas por fecha (más reciente primero)
- El sistema debe mostrar calificación promedio
- El sistema debe permitir filtrar por calificación
- El sistema debe mostrar verificación de reserva real
- El sistema debe soportar paginación

---

## Módulo de Favoritos

### RF-FAV-001: Agregar a Favoritos
**Prioridad:** Baja  
**Descripción:** Los usuarios deben poder marcar hoteles como favoritos.

**Criterios de Aceptación:**
- Solo usuarios autenticados pueden guardar favoritos
- El sistema debe validar que el hotel exista
- El sistema debe prevenir duplicados
- El sistema debe notificar éxito/error

---

### RF-FAV-002: Gestión de Favoritos
**Prioridad:** Baja  
**Descripción:** Los usuarios deben poder ver y eliminar favoritos.

**Criterios de Aceptación:**
- El sistema debe mostrar lista de favoritos del usuario
- El usuario puede eliminar favoritos
- El sistema debe mostrar información actualizada de cada hotel favorito
- El sistema debe notificar si un favorito ya no está disponible

---

## Módulo de Destinos

### RF-DES-001: Gestión de Destinos
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir administrar destinos turísticos.

**Criterios de Aceptación:**
- Información requerida: nombre, país, descripción, imagen
- El sistema debe permitir asociar hoteles a destinos
- El sistema debe mostrar destinos destacados
- El sistema debe permitir búsqueda de destinos

---

### RF-DES-002: Destinos Populares
**Prioridad:** Media  
**Descripción:** El sistema debe identificar y mostrar destinos populares.

**Criterios de Aceptación:**
- La popularidad se calcula por número de reservas
- El sistema actualiza ranking periódicamente
- El sistema muestra top 10 destinos en home
- El sistema debe incluir imagen y descripción breve

---

## Módulo de Empresas

### RF-EMP-001: Registro de Empresas
**Prioridad:** Media  
**Descripción:** El sistema debe permitir registrar empresas turísticas.

**Criterios de Aceptación:**
- Información requerida: nombre, RUC/NIT, dirección, contacto
- El sistema debe validar unicidad de RUC/NIT
- El sistema debe permitir asociar hoteles a empresas
- Solo administradores pueden gestionar empresas

---

### RF-EMP-002: Panel de Empresa
**Prioridad:** Media  
**Descripción:** Las empresas deben tener acceso a panel de gestión.

**Criterios de Aceptación:**
- El panel muestra estadísticas de sus hoteles
- El panel muestra reservas de sus hoteles
- El panel muestra ingresos y reportes
- El sistema debe soportar múltiples usuarios por empresa

---

## Módulo de Cancelaciones

### RF-CAN-001: Solicitud de Cancelación
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir solicitar cancelación de reservas.

**Criterios de Aceptación:**
- El cliente debe especificar razón de cancelación
- El sistema debe mostrar política de cancelación aplicable
- El sistema debe calcular y mostrar cargo por cancelación
- El sistema debe crear solicitud en estado "pendiente"

---

### RF-CAN-002: Aprobación de Cancelaciones
**Prioridad:** Alta  
**Descripción:** Los empleados deben poder aprobar/rechazar solicitudes de cancelación.

**Criterios de Aceptación:**
- El sistema debe mostrar lista de solicitudes pendientes
- El empleado puede aprobar o rechazar con justificación
- El sistema debe procesar reembolso si aplica
- El sistema debe notificar al cliente de la decisión

---

## Módulo de Dashboard

### RF-DAS-001: Dashboard Administrativo
**Prioridad:** Media  
**Descripción:** El sistema debe proveer dashboard con métricas clave.

**Criterios de Aceptación:**
- Métricas mostradas: reservas del día, ingresos, ocupación, nuevos clientes
- El dashboard debe actualizarse en tiempo real
- El sistema debe permitir filtrar por rango de fechas
- El sistema debe mostrar gráficos visuales
- Solo usuarios con rol admin/empleado acceden

---

### RF-DAS-002: Reportes
**Prioridad:** Media  
**Descripción:** El sistema debe generar reportes de gestión.

**Criterios de Aceptación:**
- Tipos de reporte: ventas, ocupación, clientes, cancelaciones
- El sistema debe permitir exportar a PDF/Excel
- Los reportes deben incluir gráficos
- El sistema debe permitir programar reportes automáticos

---

## Módulo de Banners

### RF-BAN-001: Gestión de Banners
**Prioridad:** Baja  
**Descripción:** El sistema debe permitir gestionar banners promocionales.

**Criterios de Aceptación:**
- Información requerida: título, imagen, enlace, posición
- El sistema debe permitir activar/desactivar banners
- El sistema debe soportar múltiples banners con rotación
- Solo administradores pueden gestionar banners
- Formato soportado: JPG, PNG, WEBP
- Tamaño máximo: 2MB

---

### RF-BAN-002: Visualización de Banners
**Prioridad:** Baja  
**Descripción:** El sistema debe mostrar banners en páginas estratégicas.

**Criterios de Aceptación:**
- Los banners se muestran en home y páginas de destino
- El sistema debe rotar banners automáticamente
- Los banners deben ser responsivos
- El sistema debe registrar clics en banners

---

## Matriz de Prioridades

| Prioridad | Cantidad | Porcentaje |
|-----------|----------|------------|
| Alta      | 28       | 60%        |
| Media     | 16       | 34%        |
| Baja      | 6        | 6%         |

---

## Convenciones de Nomenclatura

- **RF-XXX-NNN**: Requisito Funcional
  - **XXX**: Código del módulo (AUTH, HOT, RES, etc.)
  - **NNN**: Número secuencial (001, 002, etc.)

---

## Control de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Agosto 2026 | Equipo AlecTours | Versión inicial |

---

**Fin del Documento**
