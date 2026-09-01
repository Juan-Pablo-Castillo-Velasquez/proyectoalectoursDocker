# Patrones Arquitectónicos — AlecTours

> **Proyecto**: AlecTours — Plataforma de gestión turística
> **Stack**: FastAPI + React 18 + PostgreSQL 16 + Docker Compose

---

## Resumen ejecutivo

El sistema aplica patrones arquitectónicos y de diseño estándar de la industria para mantener un código escalable, seguro y mantenible.

| # | Patrón | Dónde vive | Qué resuelve |
|---|---|---|---|
| 1 | Arquitectura en Capas | `backend/app/` | Separación de responsabilidades backend |
| 2 | DTO / Schema | `schemas/` (Pydantic) | Validación y serialización |
| 3 | Repository Pattern | `repositories/` | Desacoplar acceso a datos |
| 4 | Inyección de Dependencias | `core/deps.py` + `Depends()` | Desacoplar servicios transversales |
| 5 | JWT Stateless | `core/security.py` | Autenticación sin estado en servidor |
| 6 | Rate Limiting (Token Bucket) | Redis + middleware | Protección contra abuso |
| 7 | Context / Provider | `AuthContext.tsx`, `FavoritosContext.tsx` | Estado global en React |
| 8 | SPA + Route Guard | `ProtectedRoute.tsx` | Proteger rutas autenticadas |
| 9 | Custom Hook | `useSeoMeta`, `usePagination` | Reutilizar lógica |
| 10 | Interceptor | `apiFetch()` | Adjuntar JWT en cada petición |
| 11 | Cache-Aside | `core/cache.py` + Redis | Reducir carga a PostgreSQL |
| 12 | Monorepo | `backend/` + `alecktourfrondend/` | Código unificado en un solo repo |

---

## Patrón 1 — Arquitectura en Capas

```
HTTP Request
      ↓
┌─────────────────────────────────────────┐
│  routes/           → Capa HTTP          │  Recibe y devuelve HTTP
├─────────────────────────────────────────┤
│  schemas/          → Validación         │  Pydantic request/response
├─────────────────────────────────────────┤
│  services/         → Capa de Negocio    │  Reglas y decisiones
├─────────────────────────────────────────┤
│  repositories/     → Capa de Datos      │  Queries SQLAlchemy
├─────────────────────────────────────────┤
│  models/           → ORM                │  Tablas y relaciones
├─────────────────────────────────────────┤
│  core/             → Transversal        │  config, security, mail, cache
└─────────────────────────────────────────┘
      ↓
PostgreSQL + Redis
```

Cada capa solo se comunica con la adyacente. Un cambio en la BD no afecta el router. Un cambio en el router no afecta la lógica de negocio.

---

## Patrón 2 — DTO / Schema (Pydantic)

Los schemas Pydantic actúan como contratos de datos entre capas. El modelo ORM `Usuario` tiene `password_hash`, pero el schema `UsuarioResponse` lo excluye:

```python
# Modelo ORM — tiene password_hash
class Usuario(Base):
    password_hash: Mapped[str]

# Schema Pydantic — OMITE password_hash
class UsuarioResponse(BaseModel):
    id_usuario: int
    username: str
    correo_electronico: str
    # password_hash NUNCA aparece aquí
```

---

## Patrón 3 — Repository Pattern

11 repositorios encapsulan el acceso a datos. Los services llaman a repositories, nunca hacen queries directas:

```python
# ReservaRepository encapsula queries complejas
class ReservaRepository:
    def crear(self, db, reserva_data): ...
    def obtener_por_cliente(self, db, cliente_id): ...
    def listar_con_filtros(self, db, filtros): ...

# Service delega al repository
class ReservaService:
    def __init__(self, reserva_repo: ReservaRepository):
        self.repo = reserva_repo
```

---

## Patrón 4 — Inyección de Dependencias (DI)

```python
# core/deps.py — dependencias reutilizables
async def get_current_usuario(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    """Valida JWT y devuelve el usuario autenticado."""
    ...

def exigir_propietario_o_admin(
    current_user: Usuario,
    resource_owner_id: int
):
    """Protección IDOR — owner o admin pueden acceder."""
    ...
```

```python
# Uso en routes
@router.get("/me")
async def get_me(current_user: Usuario = Depends(get_current_usuario)):
    return current_user
```

---

## Patrón 5 — JWT Stateless

| Token | Duración | Propósito |
|---|---|---|
| `access_token` | 30 minutos | Autenticar cada request |
| `refresh_token` | 7 días | Renovar access sin re-login |

Tokens diferenciados por `type` claim ("access" / "refresh"). `get_user_from_token` rechaza tokens que no sean tipo "access".

---

## Patrón 6 — Rate Limiting con Redis

Token-bucket middleware por endpoint:

| Endpoint | Límite |
|---|---|
| `POST /auth/login` | 5/60s |
| `POST /auth/register` | 5/60s |
| `POST /auth/forgot-password` | 3/60s |
| Pagos | 10/60s |

---

## Patrón 7 — Context / Provider (React)

```typescript
// Tres providers envuelven la app
<AuthProvider>        // Token, user, roles, login/logout
  <FavoritosProvider>  // IDs de hoteles favoritos, toggle
    <AuthModalProvider> // Control global de modales login/register
      <App />
    </AuthModalProvider>
  </FavoritosProvider>
</AuthProvider>
```

---

## Patrón 8 — SPA + Route Guard

```typescript
// ProtectedRoute protege rutas que requieren auth
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

Si no hay token → redirige a `/` con modal de login abierto. Si hay token pero no el rol → redirige según el rol.

---

## Patrón 9 — Cache-Aside con Redis

```python
# core/cache.py
def get_cached(key: str) -> dict | None:
    data = redis_client.get(key)
    return json.loads(data) if data else None

def set_cached(key: str, value: dict, ttl: int = 600):
    redis_client.setex(key, ttl, json.dumps(value))
```

Endpoints cached:
- Hoteles: TTL 600s (10 min)
- Paquetes populares: TTL 120s (2 min)
- Dashboard resumen: TTL 60s
- Reseñas destacadas: TTL 600s

---

## Patrón 10 — Interceptor (Frontend)

```typescript
// apiFetch agrega JWT automáticamente
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers = {
    ...options?.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // ...
}
```

Ningún componente necesita preocuparse por añadir el header `Authorization`.

---

## Relación entre patrones

```
┌─────────────────────────────────────────────────────────────────┐
│ Monorepo (#12)                                                   │
│                                                                   │
│  ┌─── REST API ────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  Frontend                    Backend (Capas #1)             │  │
│  │  ┌────────────────────┐      ┌──────────────────────────┐  │  │
│  │  │ Context (#7)       │      │ routes/                   │  │  │
│  │  │ RouteGuard (#8)    │←────→│ schemas/    ← DTO (#2)    │  │  │
│  │  │ Hook (#9)          │      │ services/   ← DI (#4)     │  │  │
│  │  │ Interceptor (#10)  │──────│ repositories← Repository  │  │  │
│  │  │ Cache-Aside (#11)  │      │ models/                  │  │  │
│  │  └────────────────────┘      │ core/ ← JWT (#5)          │  │  │
│  │                              │       ← Rate (#6)         │  │  │
│  │                              │       ← Cache (#11)       │  │  │
│  │                              └──────────────────────────┘  │  │
│  │                                        ↕                    │  │
│  │                               PostgreSQL + Redis            │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

Cada patrón resuelve un problema específico. Juntos, hacen que el sistema sea:

- **Seguro** — JWT + bcrypt + Rate Limiting + IDOR protection
- **Mantenible** — Capas + Repository + DI
- **Escalable** — Stateless + Redis cache + Monorepo
- **Testeable** — DI override + Separación de capas
