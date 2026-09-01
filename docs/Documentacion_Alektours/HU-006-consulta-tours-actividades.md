# HU-006 — Consulta de tours y actividades

<!--
¿Qué? Búsqueda de tours y actividades disponibles filtrando por destino, fecha, categoría, perfil del viajero, duración y presupuesto.
¿Para qué? Permitir al agente de viajes complementar los itinerarios con experiencias acordes a las preferencias de sus clientes.
Impacto? Enriquece la oferta de productos turísticos y permite combinaciones de múltiples actividades dentro de un mismo itinerario.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-006 |
| Título | Consulta de tours y actividades |
| Módulo | Gestión de Productos Turísticos |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-006 |

## Historia

Como agente de viajes,
quiero consultar tours y actividades disponibles,
para complementar los itinerarios de mis clientes con experiencias acordes a sus preferencias.

## Criterios de aceptación

### CA-006.1 — Formulario de búsqueda
Dado que accedo al catálogo de actividades,
cuando visualizo la pantalla de búsqueda,
entonces debo encontrar filtros por destino, fecha, categoría, perfil del viajero, duración y presupuesto.

### CA-006.2 — Validación de fecha
Dado que realizo una búsqueda,
cuando ingreso una fecha anterior a la actual,
entonces debo visualizar un mensaje de validación.

### CA-006.3 — Resultados disponibles
Dado que existen actividades disponibles,
cuando ejecuto la búsqueda,
entonces debo visualizar nombre, descripción, duración, ubicación, precio y disponibilidad.

### CA-006.4 — Filtrado de resultados
Dado que obtuve resultados,
cuando aplico filtros adicionales,
entonces solo deben mostrarse las actividades que cumplan los criterios.

### CA-006.5 — Selección múltiple
Dado que existen varias actividades disponibles,
cuando selecciono más de una actividad,
entonces el sistema debe permitir asociarlas al mismo itinerario.

### CA-006.6 — Sin resultados
Dado que no existen actividades disponibles,
cuando realizo la búsqueda,
entonces debo visualizar un mensaje informativo.
