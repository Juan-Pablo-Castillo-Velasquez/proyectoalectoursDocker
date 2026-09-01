# HU-004 — Consulta de vuelos

<!--
¿Qué? Búsqueda de vuelos disponibles a partir de criterios como origen, destino y fecha de salida.
¿Para qué? Permitir al agente de viajes seleccionar la mejor opción de vuelo para sus clientes.
Impacto? Habilita la funcionalidad central de búsqueda de vuelos dentro de la gestión de productos turísticos, alimentando la construcción de itinerarios.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-004 |
| Título | Consulta de vuelos |
| Módulo | Gestión de Productos Turísticos |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-004 |

## Historia

Como agente de viajes,
quiero buscar vuelos disponibles utilizando diferentes criterios,
para seleccionar la mejor opción para mis clientes.

## Criterios de aceptación

### CA-004.1 — Búsqueda obligatoria
Dado que accedo al catálogo de vuelos,
cuando realizo una búsqueda,
entonces debo ingresar origen, destino y fecha de salida.

### CA-004.2 — Validación de origen y destino
Dado que diligencio la búsqueda,
cuando selecciono el mismo origen y destino,
entonces debo visualizar un mensaje de validación.

### CA-004.3 — Resultados disponibles
Dado que existen vuelos disponibles,
cuando ejecuto la búsqueda,
entonces debo visualizar una lista de vuelos con horarios, escalas, tarifa y disponibilidad.

### CA-004.4 — Sin resultados
Dado que no existen vuelos disponibles,
cuando realizo la búsqueda,
entonces debo visualizar un mensaje informativo.

### CA-004.5 — Selección de vuelo
Dado que visualizo resultados disponibles,
cuando selecciono un vuelo,
entonces este debe incorporarse al itinerario correspondiente.
