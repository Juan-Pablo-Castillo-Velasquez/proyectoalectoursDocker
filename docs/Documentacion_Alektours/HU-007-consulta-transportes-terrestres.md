# HU-007 — Consulta de transportes terrestres

<!--
¿Qué? Búsqueda de opciones de transporte y traslados terrestres según origen, destino, fecha, pasajeros, horario y presupuesto.
¿Para qué? Permitir al agente de viajes completar la logística de los itinerarios de sus clientes.
Impacto? Cierra el conjunto de productos turísticos gestionables (vuelos, alojamiento, actividades y transporte) necesarios para construir un itinerario completo.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-007 |
| Título | Consulta de transportes terrestres |
| Módulo | Gestión de Productos Turísticos |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-007 |

## Historia

Como agente de viajes,
quiero consultar opciones de transporte terrestre,
para completar la logística de los itinerarios de mis clientes.

## Criterios de aceptación

### CA-007.1 — Formulario de búsqueda
Dado que ingreso al módulo de transportes,
cuando visualizo la pantalla de búsqueda,
entonces debo encontrar los campos origen, destino, fecha, pasajeros, horario y presupuesto.

### CA-007.2 — Validación de origen y destino
Dado que estoy realizando una búsqueda,
cuando selecciono el mismo origen y destino,
entonces debo visualizar un mensaje indicando que deben ser diferentes.

### CA-007.3 — Resultados disponibles
Dado que existen servicios disponibles,
cuando ejecuto la búsqueda,
entonces debo visualizar proveedor, horarios, capacidad, precio y disponibilidad.

### CA-007.4 — Aplicación de filtros
Dado que obtuve resultados,
cuando aplico filtros de capacidad o presupuesto,
entonces la lista debe actualizarse automáticamente.

### CA-007.5 — Selección de transporte
Dado que visualizo servicios disponibles,
cuando selecciono uno o varios transportes,
entonces estos deben asociarse al itinerario.

### CA-007.6 — Sin disponibilidad
Dado que no existen servicios disponibles,
cuando realizo la búsqueda,
entonces debo visualizar un mensaje informativo.
