# HU-008 — Construcción de itinerarios personalizados

<!--
¿Qué? Herramienta para construir itinerarios de viaje personalizados, organizados por días y asociados a un cliente.
¿Para qué? Permitir al agente de viajes ofrecer propuestas de viaje completas y organizadas combinando vuelos, hoteles y actividades.
Impacto? Es el módulo central que integra los productos turísticos consultados (vuelos, alojamientos, actividades, transportes) en una propuesta coherente para el cliente.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-008 |
| Título | Construcción de itinerarios personalizados |
| Módulo | Gestión de Itinerarios |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-008 |

## Historia

Como agente de viajes,
quiero construir itinerarios personalizados,
para ofrecer propuestas de viaje completas y organizadas.

## Criterios de aceptación

### CA-008.1 — Creación de itinerario
Dado que deseo crear un itinerario,
cuando ingreso los datos requeridos,
entonces el sistema debe generar una estructura organizada por días.

### CA-008.2 — Validación de fechas
Dado que estoy creando un itinerario,
cuando la fecha de finalización es anterior a la fecha de inicio,
entonces debo visualizar un mensaje de error.

### CA-008.3 — Asociación de cliente
Dado que estoy creando un itinerario,
cuando selecciono un cliente válido,
entonces el itinerario debe quedar asociado a dicho cliente.

### CA-008.4 — Adición de servicios
Dado que existe un itinerario creado,
cuando agrego vuelos, hoteles o actividades,
entonces estos deben organizarse dentro de los días correspondientes.

### CA-008.5 — Guardado de cambios
Dado que realizo modificaciones,
cuando guardo el itinerario,
entonces los cambios deben persistir correctamente.

### CA-008.6 — Previsualización
Dado que he completado el itinerario,
cuando selecciono la opción de vista previa,
entonces debo visualizar el itinerario completo antes de finalizarlo.

### CA-008.7 — Conflicto de fechas
Dado que agrego servicios incompatibles,
cuando existe solapamiento de fechas u horarios,
entonces el sistema debe advertir el conflicto.
