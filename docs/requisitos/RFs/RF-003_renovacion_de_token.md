# RF-003 — Renovación de token (Refresh)

<!--
  ¿Qué? Requisito funcional que define la renovación del access token usando el refresh token.
  ¿Para qué? Documentar el mecanismo que permite mantener la sesión activa sin re-login.
  ¿Impacto? Sin refresh, el usuario tendría que re-autenticarse cada 15 minutos.
-->

---

## Identificación

| Campo             | Valor                                                  |
| ----------------- | ------------------------------------------------------ |
| **ID**            | RF-003                                                 |
| **Nombre**        | Renovación de token (Refresh)                          |
| **Módulo**        | Autenticación                                          |
| **Prioridad**     | Alta                                                   |
| **Estado**        | Pendiente — ver nota abajo                             |
| **Fecha**         | Febrero 2026                                           |

> **Nota (auditoría, Septiembre 2026):** este requisito está documentado
> como "Implementado" pero **no hay un endpoint de refresh en el
> backend** (`backend/app/routes/auth_route.py` solo expone
> `/auth/register`, `/auth/login`, `/auth/verify-email`,
> `/auth/forgot-password` y `/auth/reset-password` — ninguna ruta
> `refresh`). `/auth/login` sí genera y devuelve un `refresh_token`, y el
> frontend lo recibe (`auth.service.ts`), pero nunca lo usa para pedir un
> access token nuevo — no existe ningún endpoint al que enviarlo. En la
> práctica, el usuario simplemente tiene que volver a iniciar sesión
> cuando el access token expira (30 minutos). No se implementó el
> endpoint faltante como parte de esta auditoría porque agregar un flujo
> de autenticación nuevo es una decisión de producto (política de
> expiración/rotación de sesiones), no un bug a corregir — queda como
> hallazgo para que el equipo decida si lo prioriza.

---

## Descripción

El sistema debe permitir obtener un nuevo access token válido presentando un refresh token vigente, sin necesidad de que el usuario vuelva a ingresar sus credenciales.

---

## Entradas

| Campo           | Tipo   | Obligatorio | Validaciones                                     |
| --------------- | ------ | ----------- | ------------------------------------------------ |
| `refresh_token` | Texto  | Sí          | JWT válido, no expirado, tipo "refresh"          |

---

## Proceso

1. El frontend detecta que el access token está por expirar o ya expiró.
2. Se envía el refresh token al backend.
3. El backend decodifica y valida el refresh token (firma, expiración, tipo).
4. Se verifica que el usuario asociado al token aún exista y esté activo.
5. Se genera un nuevo access token (15 minutos).
6. Se retorna el nuevo access token al frontend.

---

## Salidas

| Escenario                    | Código HTTP | Respuesta                                                |
| ---------------------------- | ----------- | -------------------------------------------------------- |
| Refresh exitoso              | 200         | `{ access_token, token_type: "bearer" }`                 |
| Token expirado o inválido    | 401         | Mensaje: "Invalid or expired refresh token"              |
| Usuario inactivo             | 401         | Mensaje: "Invalid or expired refresh token"              |

---

## Endpoint asociado

**No existe actualmente** (ver nota de auditoría arriba). La ruta
`/api/v1/auth/refresh` descrita originalmente aquí nunca se implementó
ni en ese prefijo (`/api/v1/...` no se usa en ningún otro endpoint del
proyecto — el prefijo real es `/api/...` o `/auth/...`) ni en ningún
otro.

---

## Reglas de negocio

- RN-010: El refresh token debe contener un claim `type: "refresh"` para diferenciarlo del access token.
- RN-011: Si el refresh token expiró, el usuario debe iniciar sesión nuevamente.
- RN-012: El refresh no genera un nuevo refresh token — solo renueva el access token.
