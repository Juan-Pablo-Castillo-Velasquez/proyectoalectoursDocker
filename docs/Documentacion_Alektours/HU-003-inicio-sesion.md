# HU-003 — Inicio de sesión

<!--
¿Qué? Formulario de autenticación mediante correo electrónico y contraseña para usuarios registrados.
¿Para qué? Permitir el acceso seguro de usuarios registrados a las funcionalidades autorizadas del sistema.
Impacto? Garantiza el control de acceso al sistema y protege las cuentas mediante validación de credenciales y estados de cuenta.
-->

## Identificación

| Campo | Valor |
| :---: | :---: |
| ID | HU-003 |
| Título | Inicio de sesión |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Implementada |
| RF asociados | RF-003 |

## Historia

Como usuario registrado,
quiero iniciar sesión con mi correo electrónico y contraseña,
para acceder a las funcionalidades autorizadas del sistema.

## Criterios de aceptación

### CA-003.1 — Formulario de login
Dado que estoy en la página de inicio de sesión,
cuando visualizo el formulario,
entonces debo encontrar los campos correo electrónico y contraseña.

### CA-003.2 — Credenciales válidas
Dado que tengo una cuenta activa,
cuando ingreso credenciales válidas,
entonces debo acceder al sistema exitosamente.

### CA-003.3 — Credenciales inválidas
Dado que ingreso un correo o contraseña incorrectos,
cuando envío el formulario,
entonces debo visualizar el mensaje "Incorrect email or password".

### CA-003.4 — Cuenta inactiva
Dado que mi cuenta está inactiva,
cuando intento iniciar sesión,
entonces debo recibir el mensaje genérico de autenticación fallida.

### CA-003.5 — Estado de carga
Dado que envío mis credenciales,
cuando la autenticación está en proceso,
entonces el botón de acceso debe permanecer deshabilitado.
