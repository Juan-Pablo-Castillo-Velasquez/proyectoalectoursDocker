# JWT en AlecTours

---

## 1. Configuración

`backend/app/core/config.py`

| Parámetro | Valor | Descripción |
|---|---|---|
| `SECRET_KEY` | Variable de entorno | Mínimo 32 caracteres (validador en config) |
| `ALGORITHM` | `HS256` | HMAC-SHA256 simétrico |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Vida útil del access token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Vida útil del refresh token |

---

## 2. Creación de tokens

`backend/app/core/security.py`

### `create_access_token()`

```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

Payload resultante:
```json
{
  "sub": "1",
  "roles": ["cliente"],
  "exp": 1712345678,
  "type": "access"
}
```

### `create_refresh_token()`

Misma estructura, pero `"type": "refresh"` y expiración de 7 días.

### `generate_token_pair()`

Crea ambos tokens de una vez, embebiendo los roles del usuario:

```python
def generate_token_pair(user_id: int, roles: list[str]) -> dict:
    access = create_access_token({"sub": str(user_id), "roles": roles})
    refresh = create_refresh_token({"sub": str(user_id)})
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
```

---

## 3. Login → emisión de tokens

`POST /auth/login` → `auth_service.login_user()`

```
Credenciales → verificar bcrypt → verificar activo + verificado
→ generate_token_pair(user_id, roles)
→ Responder { access_token, refresh_token, user_id, username, id_cliente, roles }
```

**Frontend** (`AuthContext.tsx`):
1. Recibe tokens + metadata del usuario
2. Guarda en `localStorage` (access_token, refresh_token, user data)
3. `apiFetch` adjunta Bearer token en cada request

---

## 4. Transporte del token

```typescript
// api.ts — apiFetch agrega automáticamente
const token = localStorage.getItem("access_token");
if (token) {
  headers["Authorization"] = `Bearer ${token}`;
}
```

---

## 5. Verificación del token (backend)

`backend/app/core/deps.py` — `get_current_usuario()`

```
1. Extrae token del header Authorization
2. decode_token() → jwt.decode() con SECRET_KEY + HS256
3. Valida payload["type"] == "access" (rechaza refresh tokens)
4. Extrae user_id de payload["sub"]
5. Busca usuario en BD por ID
6. Verifica activo == True
7. Retorna objeto Usuario
```

---

## 6. Protección de rutas

### Autenticación básica

```python
@router.get("/me")
async def get_me(current_user: Usuario = Depends(get_current_usuario)):
    return current_user
```

### Solo admin

```python
@router.delete("/hoteles/{id}")
async def eliminar_hotel(
    current_user: Usuario = Depends(require_admin),
    ...
):
    ...
```

### Owner o admin (protección IDOR)

```python
@router.get("/clientes/{id}")
async def obtener_cliente(
    id: int,
    current_user: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
):
    exigir_propietario_o_admin(current_user, id)
    ...
```

---

## 7. Almacenamiento en frontend

`AuthContext.tsx` usa **`localStorage`**:

```typescript
localStorage.setItem("access_token", token);
localStorage.setItem("refresh_token", token);
localStorage.setItem("user", JSON.stringify(userData));
```

Logout limpia todo:
```typescript
localStorage.removeItem("access_token");
localStorage.removeItem("refresh_token");
localStorage.removeItem("user");
```

Evento personalizado en 401:
```typescript
window.dispatchEvent(new Event("auth:session-expired"));
```

---

## 8. Tokens de email (no-JWT)

Para flujos de email se usan tokens temporales almacenados en BD:

| Flujo | Tabla | Expiración | Uso |
|---|---|---|---|
| Verificación email | `recuperacion_password` | 24 horas | `POST /auth/verify-email?token=...` |
| Reset contraseña | `recuperacion_password` | 1 hora | `POST /auth/reset-password` |

---

## 9. Seguridad

- **Tokens diferenciados por tipo**: "access" vs "refresh" — no intercambiables
- **SECRET_KEY validada**: mínimo 32 caracteres en config.py
- **Rate limiting**: previene brute force en login (5/60s) y registro (5/60s)
- **Respuestas genéricas**: forgot-password siempre responde igual
- **Sin blacklist**: JWT es stateless — el token sigue válido hasta expiración natural

---

## Archivos relevantes

| Archivo | Rol |
|---|---|
| `backend/app/core/config.py` | Configuración JWT |
| `backend/app/core/security.py` | Creación y verificación de tokens |
| `backend/app/core/deps.py` | `get_current_usuario`, `require_admin` |
| `backend/app/services/auth_service.py` | Login, register, verify, reset |
| `alecktourfrondend/src/app/api/v1/api.ts` | `apiFetch()` con Bearer |
| `alecktourfrondend/src/app/context/AuthContext.tsx` | Estado de auth + localStorage |
