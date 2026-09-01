# HU-002 — Configuración de preferencias de viaje

<!--
¿Qué? Cuestionario de preferencias de viaje que el cliente completa dentro de su perfil.
¿Para qué? Permitir que el sistema ofrezca recomendaciones y paquetes turísticos personalizados según los intereses y presupuesto del cliente.
Impacto? Mejora la relevancia de las recomendaciones ofrecidas al cliente y sienta la base de datos de personalización usada por otros módulos de recomendación.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-002 |
| Título | Configuración de preferencias de viaje |
| Módulo | Perfil del Cliente |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-002 |

## Historia

Como cliente registrado,
quiero completar un cuestionario con mis preferencias de viaje,
para recibir recomendaciones y paquetes turísticos personalizados.

## Criterios de aceptación

### CA-002.1 — Visualización del cuestionario
Dado que ingreso por primera vez al sistema,
cuando accedo a mi cuenta,
entonces debo visualizar el cuestionario de preferencias de viaje.

### CA-002.2 — Selección múltiple de intereses
Dado que estoy completando el cuestionario,
cuando selecciono mis intereses,
entonces debo poder elegir múltiples opciones.

### CA-002.3 — Selección única de presupuesto
Dado que estoy completando el cuestionario,
cuando selecciono un presupuesto,
entonces solo debo poder elegir una categoría.

### CA-002.4 — Guardado exitoso
Dado que he completado el cuestionario,
cuando presiono "Guardar preferencias",
entonces el sistema debe almacenar mis selecciones correctamente.

### CA-002.5 — Usuario sin preferencias
Dado que decido omitir el cuestionario,
cuando ingreso al sistema,
entonces debo recibir recomendaciones generales.
