# HU-010 — Generación automática de cotización

<!--
¿Qué? Generación automática de una cotización a partir de un itinerario completo, con cálculo de subtotales, impuestos, descuentos y total.
¿Para qué? Permitir al agente de viajes presentar una propuesta económica detallada al cliente.
Impacto? Convierte un itinerario armado en un documento comercial formal (PDF), habilitando el flujo posterior de aceptación, rechazo y reserva.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-010 |
| Título | Generación automática de cotización |
| Módulo | Cotizaciones |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-010 |

## Historia

Como agente de viajes,
quiero generar una cotización automáticamente,
para presentar una propuesta económica detallada al cliente.

## Criterios de aceptación

### CA-010.1 — Validación del itinerario
Dado que solicito una cotización,
cuando el itinerario está completo,
entonces el sistema debe permitir generar la cotización.

### CA-010.2 — Itinerario incompleto
Dado que existen servicios faltantes,
cuando intento generar la cotización,
entonces debo visualizar un mensaje indicando la inconsistencia.

### CA-010.3 — Cálculo automático
Dado que la información es válida,
cuando se genera la cotización,
entonces deben calcularse subtotales, impuestos, descuentos y total final.

### CA-010.4 — Generación de documento
Dado que la cotización fue creada,
cuando finaliza el proceso,
entonces debe estar disponible en formato digital o PDF.

### CA-010.5 — Almacenamiento
Dado que la cotización fue generada,
cuando consulto el historial del cliente,
entonces debo encontrar la cotización registrada.
