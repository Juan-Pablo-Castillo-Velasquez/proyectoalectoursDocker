# HU-001 — Registro de cuenta

<!--
¿Qué? Formulario de registro de cuenta para usuarios nuevos, con validación de datos, verificación por correo electrónico y activación de cuenta.
¿Para qué? Permitir que un usuario nuevo cree una cuenta propia y acceda a las funcionalidades del sistema de manera segura.
Impacto? Habilita el ingreso controlado de nuevos usuarios al sistema, garantizando la integridad de los datos de autenticación y la seguridad de las cuentas mediante verificación de correo.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-001 |
| Título | Registro de cuenta |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Aprobada |
| RF asociados | RF-001 |

## Historia

Como usuario nuevo,
quiero crear una cuenta proporcionando mi nombre, correo electrónico y contraseña,
para poder acceder a las funcionalidades del sistema.

## Criterios de aceptación

### CA-001.1 — Formulario de registro completo
Dado que estoy en la página de registro,
cuando visualizo el formulario,
entonces debo encontrar los campos nombre completo, correo electrónico, número de teléfono, contraseña y confirmación de contraseña.

### CA-001.2 — Validación de nombre obligatorio
Dado que estoy completando el formulario,
cuando dejo vacío el campo nombre y envío la información,
entonces debo visualizar un mensaje indicando que el nombre es obligatorio.

### CA-001.3 — Validación de longitud mínima del nombre
Dado que estoy completando el formulario,
cuando ingreso un nombre con menos de dos caracteres,
entonces debo visualizar un mensaje indicando que el nombre no cumple los requisitos mínimos.

### CA-001.4 — Validación de correo obligatorio
Dado que estoy completando el formulario,
cuando dejo vacío el campo correo electrónico,
entonces debo visualizar un mensaje indicando que el correo es obligatorio.

### CA-001.5 — Validación de formato de correo
Dado que estoy completando el formulario,
cuando ingreso un correo con formato inválido,
entonces debo visualizar un mensaje indicando que el correo no es válido.

### CA-001.6 — Validación de contraseña segura
Dado que estoy completando el formulario,
cuando ingreso una contraseña que no cumple las políticas de seguridad establecidas,
entonces debo visualizar un mensaje indicando los requisitos faltantes.

### CA-001.7 — Confirmación de contraseña
Dado que estoy completando el formulario,
cuando la contraseña y la confirmación no coinciden,
entonces debo visualizar el mensaje "Las contraseñas no coinciden".

### CA-001.8 — Registro exitoso
Dado que todos los datos ingresados son válidos,
cuando envío el formulario de registro,
entonces la cuenta debe crearse correctamente.

### CA-001.9 — Correo electrónico duplicado
Dado que intento registrarme con un correo ya existente,
cuando envío el formulario,
entonces debo visualizar un mensaje indicando que el correo ya se encuentra registrado.

### CA-001.10 — Estado de carga durante el registro
Dado que he enviado el formulario,
cuando la solicitud está siendo procesada,
entonces el botón de registro debe permanecer deshabilitado y mostrar un indicador de carga.

### CA-001.11 — Envío de correo de verificación
Dado que el registro fue exitoso,
cuando finaliza el proceso,
entonces el sistema debe enviar un correo electrónico con un enlace de verificación de cuenta.

### CA-001.12 — Activación de cuenta
Dado que recibí el correo de verificación,
cuando hago clic en el enlace válido,
entonces mi cuenta debe quedar activa para iniciar sesión.

### CA-001.13 — Bloqueo de acceso sin verificación
Dado que mi cuenta aún no ha sido verificada,
cuando intento iniciar sesión,
entonces debo visualizar un mensaje indicando que primero debo verificar mi correo electrónico.

### CA-001.14 — Token de verificación expirado
Dado que el enlace de verificación ha expirado,
cuando intento utilizarlo,
entonces debo visualizar un mensaje indicando que el enlace ya no es válido y una opción para solicitar uno nuevo.

### CA-001.15 — Enlace a inicio de sesión
Dado que me encuentro en la página de registro,
cuando ya poseo una cuenta registrada y activada,
entonces debo encontrar un enlace que me permita navegar a la pantalla de inicio de sesión.
