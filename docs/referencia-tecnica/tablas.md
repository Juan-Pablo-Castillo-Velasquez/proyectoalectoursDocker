# Tablas de la base de datos

Resumen corto de para qué sirve cada tabla de AlekTours (PostgreSQL). Son 41 tablas, agrupadas por dominio. Para columnas, índices y migraciones consulta [`database-schema.md`](database-schema.md).

> La fuente de verdad son los modelos de `backend/app/models/` y las migraciones de Alembic. `db_schema.sql` es un script de referencia y no incluye algunas tablas posteriores (`imagenes_hotel`, `imagenes_paquete`, `mensajes_chat`, `permisos`, `roles_permisos`, `temas_color`).

---

## Usuarios y seguridad

| Tabla | Para qué sirve |
| --- | --- |
| `usuarios` | Cuentas de acceso (username, correo, contraseña con hash). Se vincula a un cliente o a un empleado. Guarda verificación de cuenta y último login. |
| `roles` | Catálogo de roles del sistema (por ejemplo admin, empleado, cliente). |
| `usuarios_roles` | Asigna uno o varios roles a cada usuario (relación N:N). |
| `permisos` | Catálogo fijo de permisos que el backend valida en los endpoints. |
| `roles_permisos` | Define qué permisos tiene cada rol (relación N:N). |
| `sesiones_usuario` | Sesiones activas de cada usuario, con fecha de expiración. |
| `recuperacion_password` | Tokens de un solo uso para restablecer la contraseña. |

## Personas

| Tabla | Para qué sirve |
| --- | --- |
| `clientes` | Datos personales del viajero (cédula, contacto, dirección). Quien reserva. |
| `empleados` | Datos de los asesores/personal de la agencia. Pueden atender y resolver reservas. |
| `preferencias_cliente` | Gustos de viaje del cliente (intereses, compañía, presupuesto, clima, ritmo, transporte). Una fila por cliente. |

## Hoteles

| Tabla | Para qué sirve |
| --- | --- |
| `hoteles` | Hoteles ofrecidos: ubicación, contacto, calificación (1-5) e imagen de portada. |
| `imagenes_hotel` | Galería de fotos de cada hotel, con orden de visualización. |
| `caracteristicas_hotel` | Catálogo de comodidades (wifi, piscina, etc.). |
| `hotel_caracteristicas` | Indica qué comodidades tiene cada hotel (relación N:N). |
| `tipo_habitacion` | Tipos de habitación y su capacidad de personas. |
| `habitaciones` | Habitaciones concretas de un hotel, con número, tipo y precio por noche. |

## Destinos y servicios

| Tabla | Para qué sirve |
| --- | --- |
| `destinos` | Lugares turísticos (ciudad, país) y su temporada alta. |
| `categoria_servicio` | Categorías para clasificar los servicios (tours, transporte, etc.). |
| `servicios` | Servicios turísticos vendibles: categoría, destino, duración, precio base y capacidad máxima. |
| `proveedores` | Empresas externas que prestan los servicios (contacto y comisión). |
| `servicio_proveedor` | Qué proveedor ofrece cada servicio, a qué precio y cuál es el principal (relación N:N). |

## Paquetes turísticos

| Tabla | Para qué sirve |
| --- | --- |
| `paquetes` | Paquetes armados: nombre, duración, precio base, ciudad de salida e imagen. |
| `paquete_servicios` | Servicios incluidos en un paquete y el día en que se realizan. |
| `paquete_hotel` | Hoteles incluidos en un paquete y las noches de estadía. |
| `imagenes_paquete` | Galería de fotos de cada paquete, con orden de visualización. |

## Reservas y pagos

| Tabla | Para qué sirve |
| --- | --- |
| `reservas` | Reserva principal: cliente, asesor, paquete, fechas, personas, estado (pendiente, confirmada, cancelada, finalizada) y canal de origen. |
| `reserva_habitaciones` | Habitaciones reservadas, con check-in, check-out y precio acordado. |
| `reserva_servicios` | Servicios contratados dentro de la reserva, con fecha, personas y precio acordado. |
| `metodos_pago` | Catálogo de métodos de pago disponibles (tarjeta, PSE, Nequi, etc.). |
| `pagos` | Pagos de una reserva: monto, método, estado, referencia, número de factura y comprobante. |
| `historial_reservas` | Bitácora de cambios de estado de cada reserva y quién los hizo. |
| `solicitudes_cancelacion` | Solicitudes del cliente para cancelar una reserva; un asesor/admin las aprueba o rechaza. |
| `metodos_pago_guardados` | Métodos de pago que el cliente guarda: alias, tipo, últimos 4 dígitos y clave de confirmación con hash. Nunca almacena números completos. |

## Interacción con el cliente

| Tabla | Para qué sirve |
| --- | --- |
| `resenas` | Reseña de un hotel (calificación 1-5, comentario y foto). Una por reserva. |
| `favoritos` | Hoteles que el cliente marca como favoritos (único por cliente y hotel). |
| `mensajes_chat` | Chat privado cliente-admin: un solo hilo por cliente, con texto, imagen o PDF y control de leído. |
| `solicitudes_corporativas` | Solicitudes de cotización enviadas desde el formulario corporativo público. |

## Administración y contenido

| Tabla | Para qué sirve |
| --- | --- |
| `notificaciones` | Avisos para el admin generados por eventos reales (cancelaciones, pagos, mensajes, solicitudes). |
| `configuracion_sistema` | Parámetros del sistema en formato clave/valor, editables desde el panel de administración. |
| `banners_publicitarios` | Banners y folletos promocionales, con vigencia por fechas y temporada opcional. |
| `temas_color` | Temas de color de temporada (Navidad, Halloween, etc.); solo uno activo a la vez. |
