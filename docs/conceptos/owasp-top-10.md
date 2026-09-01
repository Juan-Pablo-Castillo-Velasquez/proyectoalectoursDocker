# OWASP Top 10 — AlecTours

> **Referencia oficial**: [OWASP Top 10 — 2021](https://owasp.org/Top10/)
> **Edición**: 2021 (vigente)

---

## Resumen de Estado — AlecTours

| # | Categoría | Estado | Implementación |
|---|---|---|---|
| A01 | Broken Access Control | Implementado | JWT + require_admin + IDOR protection |
| A02 | Cryptographic Failures | Implementado | bcrypt + JWT HS256 + SECRET_KEY validator |
| A03 | Injection | Implementado | SQLAlchemy ORM (queries parametrizadas) |
| A04 | Insecure Design | Implementado | Rate limiting (Redis token-bucket) |
| A05 | Security Misconfiguration | Implementado | Security headers + CORS explícita |
| A06 | Vulnerable Components | Monitoreado | Dependencias con versiones fijadas |
| A07 | Auth & Session Failures | Implementado | Tokens de corta duración + verificación email |
| A08 | Software & Data Integrity | Parcial | Tokens JWT firmados; sin firma de código |
| A09 | Logging & Monitoring | Implementado | Sentry SDK (opcional) + logs estructurados |
| A10 | Server-Side Request Forgery | N/A | API no hace peticiones a URLs externas |

---

## A01 — Broken Access Control

### Mitigaciones

**Dependencia `require_admin`** — solo admins acceden a endpoints sensibles:

```python
@router.delete("/hoteles/{id}")
async def eliminar_hotel(current_user: Usuario = Depends(require_admin)):
    ...
```

**Protección IDOR** — `exigir_propietario_o_admin`:

```python
# Un usuario solo puede acceder a SUS datos (o un admin)
exigir_propietario_o_admin(current_user, resource_owner_id)
```

El ID del usuario nunca se acepta del cliente — se extrae del JWT firmado.

---

## A02 — Cryptographic Failures

### Mitigaciones

**bcrypt para contraseñas** (`core/security.py`):

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)  # "$2b$12$..."

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

**SECRET_KEY validada** — mínimo 32 caracteres:

```python
@field_validator("SECRET_KEY")
def validate_secret_key_strength(cls, v: str) -> str:
    if len(v) < 32:
        raise ValueError("SECRET_KEY debe tener al menos 32 caracteres")
    return v
```

---

## A03 — Injection

### Mitigaciones

**SQLAlchemy ORM** — queries parametrizadas automáticas:

```python
user = db.query(Usuario).filter(Usuario.username == username).first()
# SQL: SELECT * FROM usuarios WHERE username = %s  — parametrizado
```

**Pydantic Validation** — datos validados antes de llegar al service:

```python
class RegistroRequest(BaseModel):
    username: str
    correo_electronico: EmailStr
    password: str  # Validación de fortaleza
```

**XSS**: La API devuelve JSON, no HTML. React escapa automáticamente en JSX.

**Validación de archivos** (`core/file_validation.py`):

```python
# Magic bytes check — no solo MIME declarado
def validar_y_leer_archivo(archivo, permitidos, max_size):
    header = archivo.read(8)
    # Verifica magic bytes reales (jpg, png, webp, pdf)
    # 64KB chunked read para no cargar todo en memoria
```

---

## A04 — Insecure Design

### Mitigaciones

**Rate limiting con Redis token-bucket** (middleware en `main.py`):

| Endpoint | Límite |
|---|---|
| `POST /auth/login` | 5/60s |
| `POST /auth/register` | 5/60s |
| `POST /auth/forgot-password` | 3/60s |
| `POST /auth/reset-password` | 5/60s |
| `POST /api/reservas/*/pagar` | 10/60s |

---

## A05 — Security Misconfiguration

### Mitigaciones

**Security headers** (middleware en `main.py`):

| Header | Protección |
|---|---|
| `X-Content-Type-Options: nosniff` | Previene MIME sniffing |
| `X-Frame-Options: DENY` | Previene clickjacking |
| `Referrer-Policy: strict-origin-when-cross-origin` | Protege URLs con tokens |
| `Permissions-Policy: camera=(), microphone=()` | Deniega hardware |
| `Strict-Transport-Security` | Fuerza HTTPS |

**CORS configurada**:

```python
app.add_middleware(CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)
```

**Global exception handler** — error 500 genérico sin detalles internos:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
```

---

## A07 — Authentication and Session Failures

### Mitigaciones

**Tokens de corta duración**: access_token 30 min, refresh_token 7 días.

**Verificación de email obligatoria**: usuarios no autenticados hasta verificar.

**Mensajes genéricos**: `forgot-password` siempre responde lo mismo (previene enumeración).

**Sesiones en BD**: `sesiones_usuario` almacena refresh tokens con expiración e IP.

---

## A09 — Logging & Monitoring

**Sentry SDK** (opcional, si `SENTRY_DSN` está configurado):

```python
if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)
```

**Health check** con query real a BD:

```python
@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "healthy"}
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    AlecTours Security                            │
│                                                                 │
│  Cliente           FastAPI Backend           PostgreSQL/Redis    │
│  ────────          ──────────────────        ───────────────    │
│                                                                 │
│  POST /login  ──►  Rate Limiting (A04)       Redis token-bucket │
│                         │                                       │
│                    Pydantic Validation (A03)                    │
│                         │                                       │
│                    Security Service (A07)                       │
│                    bcrypt.verify() (A02)                        │
│                         │                                       │
│                    JWT signed HS256 (A02)                       │
│                    ACCESS: 30min, REFRESH: 7d                   │
│                                                                 │
│  GET /me      ──►  get_current_usuario (A01)                    │
│                    JWT verification + owner-or-admin            │
│                                                                 │
│  All requests ──►  Security Headers (A05)                       │
│               ◄──  nosniff, DENY, HSTS, Referrer-Policy        │
│                                                                 │
│  File upload  ──►  Magic bytes validation (A03)                 │
│                    MIME + header bytes check                    │
└─────────────────────────────────────────────────────────────────┘
```
