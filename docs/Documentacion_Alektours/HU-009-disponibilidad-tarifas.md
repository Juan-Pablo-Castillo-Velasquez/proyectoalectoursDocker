# HU-009 — Consulta de disponibilidad y tarifas

<!--
¿Qué? Consulta en tiempo real de disponibilidad y tarifas a través de múltiples proveedores integrados al sistema.
¿Para qué? Permitir al agente de viajes ofrecer opciones actualizadas y comparadas a sus clientes.
Impacto? Sustenta la vigencia y precisión de la información mostrada en los módulos de búsqueda de productos turísticos, tolerando fallas parciales de proveedores.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-009 |
| Título | Consulta de disponibilidad y tarifas |
| Módulo | Integraciones y Tarifas |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-009 |

## Historia

Como agente de viajes,
quiero consultar disponibilidad y tarifas en tiempo real,
para ofrecer opciones actualizadas a mis clientes.

## Criterios de aceptación

### CA-009.1 — Consulta a proveedores
Dado que realizo una búsqueda,
cuando existen múltiples proveedores integrados,
entonces el sistema debe consultar todos los disponibles.

### CA-009.2 — Consolidación de resultados
Dado que se reciben respuestas de distintos proveedores,
cuando finaliza la consulta,
entonces debo visualizar una lista consolidada.

### CA-009.3 — Comparación automática
Dado que existen múltiples opciones,
cuando se muestran los resultados,
entonces estos deben ordenarse según precio, disponibilidad o calidad.

### CA-009.4 — Manejo de errores parciales
Dado que un proveedor presenta fallas,
cuando existen respuestas válidas de otros proveedores,
entonces el sistema debe mostrar los resultados disponibles.

### CA-009.5 — Sin disponibilidad
Dado que ningún proveedor retorna resultados,
cuando finaliza la consulta,
entonces debo visualizar una lista vacía y un mensaje informativo.
