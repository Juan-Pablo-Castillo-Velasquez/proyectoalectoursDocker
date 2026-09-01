# HU-005 — Consulta de alojamientos

<!--
¿Qué? Búsqueda de alojamientos disponibles según destino, fechas, número de personas, categoría y presupuesto.
¿Para qué? Permitir al agente de viajes ofrecer opciones de hospedaje adecuadas a las necesidades de sus clientes.
Impacto? Amplía la oferta de productos turísticos gestionables dentro del sistema y alimenta la construcción de itinerarios personalizados.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-005 |
| Título | Consulta de alojamientos |
| Módulo | Gestión de Productos Turísticos |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-005 |

## Historia

Como agente de viajes,
quiero buscar alojamientos disponibles según el destino, fechas y características requeridas,
para ofrecer opciones de hospedaje adecuadas a mis clientes.

## Criterios de aceptación

### CA-005.1 — Formulario de búsqueda
Dado que accedo al catálogo de alojamientos,
cuando visualizo la pantalla de búsqueda,
entonces debo encontrar los campos destino, fecha de ingreso, fecha de salida, número de personas, categoría y presupuesto.

### CA-005.2 — Validación de fechas
Dado que estoy realizando una búsqueda,
cuando ingreso una fecha de salida anterior a la fecha de ingreso,
entonces debo visualizar un mensaje de error indicando la inconsistencia.

### CA-005.3 — Búsqueda exitosa
Dado que existen hoteles disponibles,
cuando ejecuto la búsqueda,
entonces debo visualizar una lista de alojamientos con nombre, categoría, ubicación, precio y disponibilidad.

### CA-005.4 — Aplicación de filtros
Dado que obtuve resultados de búsqueda,
cuando aplico filtros de categoría o presupuesto,
entonces la lista debe actualizarse mostrando únicamente los resultados que cumplen los criterios.

### CA-005.5 — Sin resultados
Dado que no existen hoteles disponibles para los criterios seleccionados,
cuando realizo la búsqueda,
entonces debo visualizar un mensaje informativo y una lista vacía.

### CA-005.6 — Selección de alojamiento
Dado que visualizo resultados disponibles,
cuando selecciono un hotel,
entonces este debe quedar asociado al itinerario correspondiente.
