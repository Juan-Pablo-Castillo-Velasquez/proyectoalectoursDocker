# Requisitos No Funcionales Detallados - AlecTours

**Versión:** 2.0  
**Fecha:** Agosto 30, 2026  
**Proyecto:** Sistema de Gestión Turística AlecTours  
**Estado:** Documento Actualizado

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Atributos de Calidad](#atributos-de-calidad)
3. [Rendimiento](#rendimiento)
4. [Escalabilidad](#escalabilidad)
5. [Seguridad](#seguridad)
6. [Confiabilidad](#confiabilidad)
7. [Disponibilidad](#disponibilidad)
8. [Mantenibilidad](#mantenibilidad)
9. [Usabilidad](#usabilidad)
10. [Portabilidad](#portabilidad)
11. [Observabilidad](#observabilidad)
12. [Cumplimiento](#cumplimiento)

---

## Introducción

### Propósito

Este documento especifica los requisitos no funcionales (atributos de calidad) que debe cumplir el sistema AlecTours para garantizar su operación eficiente, segura y confiable en un entorno de producción.

### Importancia de los Requisitos No Funcionales

Los requisitos no funcionales determinan:

- **Rendimiento:** Qué tan rápido responde el sistema
- **Seguridad:** Qué tan protegido está contra amenazas
- **Escalabilidad:** Qué tan bien crece con la demanda
- **Confiabilidad:** Qué tan libre de errores opera
- **Mantenibilidad:** Qué tan fácil es modificar y depurar

---

## Atributos de Calidad

### Modelo de Calidad ISO/IEC 25010

El sistema AlecTours se evalúa según las siguientes características de calidad:

```
Adecuación Funcional (Functional Suitability)
├── Completitud funcional
├── Corrección funcional
└── Pertinencia funcional

Eficiencia de Desempeño (Performance Efficiency)
├── Comportamiento temporal
├── Utilización de recursos
└── Capacidad

Compatibilidad (Compatibility)
├── Coexistencia
└── Interoperabilidad

Usabilidad (Usability)
├── Reconocimiento de adecuación
├── Aprendizaje
├── Operabilidad
├── Protección contra errores de usuario
├── Estética de interfaz
└── Accesibilidad

Confiabilidad (Reliability)
├── Madurez
├── Disponibilidad
├── Tolerancia a fallos
└── Recuperabilidad

Seguridad (Security)
├── Confidencialidad
├── Integridad
├── No repudio
├── Responsabilidad
└── Autenticidad

Mantenibilidad (Maintainability)
├── Modularidad
├── Reusabilidad
├── Analizabilidad
├── Capacidad de modificación
└── Capacidad de prueba

Portabilidad (Portability)
├── Adaptabilidad
├── Instalabilidad
└── Reemplazabilidad
```

---

## Rendimiento

### RNF-PER-001: Tiempos de Respuesta de API

**ID:** RNF-PER-001  
**Categoría:** Rendimiento  
**Prioridad:** Crítica  
**Métrica:** Latencia en milisegundos

#### Objetivos de Rendimiento

| Tipo de Operación | Percentil 50 | Percentil 95 | Percentil 99 | Máximo Aceptable |
|-------------------|--------------|--------------|--------------|-------------------|
| GET simple (por ID) | ≤ 50ms | ≤ 100ms | ≤ 200ms | 500ms |
| GET con joins (1-2 tablas) | ≤ 100ms | ≤ 200ms | ≤ 400ms | 1000ms |
| POST/PUT simple | ≤ 100ms | ≤ 300ms | ≤ 500ms | 1000ms |
| POST/PUT complejo | ≤ 200ms | ≤ 500ms | ≤ 800ms | 1500ms |
| Búsqueda con filtros | ≤ 300ms | ≤ 700ms | ≤ 1000ms | 2000ms |
| Health check | ≤ 10ms | ≤ 30ms | ≤ 50ms | 100ms |

#### Endpoints Críticos

**Alta Prioridad (Tier 1):**
- `POST /api/v1/auth/login` - ≤ 200ms (p95)
- `GET /api/v1/hoteles` - ≤ 500ms (p95)
- `POST /api/v1/reservas` - ≤ 500ms (p95)
- `POST /api/v1/pagos` - ≤ 1000ms (p95)

**Media Prioridad (Tier 2):**
- `GET /api/v1/reservas` - ≤ 300ms (p95)
- `GET /api/v1/hoteles/{id}` - ≤ 200ms (p95)
- `PUT /api/v1/reservas/{id}` - ≤ 500ms (p95)

#### Estrategias de Optimización

1. **Índices de Base de Datos**
```sql
-- Índices críticos para rendimiento
CREATE INDEX idx_reservas_cliente_estado ON reservas(cliente_id, estado);
CREATE INDEX idx_reservas_hotel_fechas ON reservas(hotel_id, fecha_checkin, fecha_checkout);
CREATE INDEX idx_hoteles_destino ON hoteles(destino_id) WHERE estado = 'activo';
CREATE INDEX idx_usuarios_email ON usuarios(email) WHERE verificado = true;

-- Índices compuestos para búsquedas complejas
CREATE INDEX idx_habitaciones_hotel_disponibilidad 
ON habitaciones(hotel_id, estado) 
WHERE estado = 'disponible';
```

2. **Caché con Redis**
```python
# Estrategia de caché por tipo de dato
CACHE_TTL = {
    "destinos": 3600,  # 1 hora (cambian poco)
    "hoteles_listado": 600,  # 10 minutos
    "hotel_detalle": 300,  # 5 minutos
    "disponibilidad": 120,  # 2 minutos (crítico)
    "estadisticas_dashboard": 300,  # 5 minutos
    "configuracion_sistema": 1800  # 30 minutos
}

# Ejemplo de implementación
@cache(ttl=CACHE_TTL["hoteles_listado"], key="hoteles:listado:{destino_id}")
def listar_hoteles(destino_id: UUID):
    return db.query(Hotel).filter(Hotel.destino_id == destino_id).all()
```

3. **Paginación y Límites**
```python
# Configuración de paginación
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20

# Siempre retornar metadata de paginación
{
    "items": [...],
    "total": 1234,
    "pagina": 2,
    "por_pagina": 20,
    "total_paginas": 62
}
```

4. **Query Optimization**
```python
# ❌ Mal: N+1 queries
reservas = db.query(Reserva).all()
for reserva in reservas:
    hotel = db.query(Hotel).get(reserva.hotel_id)  # N queries adicionales

# ✅ Bien: Eager loading
reservas = db.query(Reserva).options(
    joinedload(Reserva.hotel),
    joinedload(Reserva.cliente)
).all()
```

#### Medición y Monitoreo

```python
# Instrumentación con Prometheus
from prometheus_client import Histogram

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint', 'status']
)

@app.middleware("http")
async def measure_request_time(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).observe(duration)
    
    return response
```

---

### RNF-PER-002: Tiempo de Carga del Frontend

**ID:** RNF-PER-002  
**Categoría:** Rendimiento  
**Prioridad:** Alta  
**Métrica:** Core Web Vitals

#### Objetivos

| Métrica | Objetivo | Aceptable | Pobre |
|---------|----------|-----------|-------|
| First Contentful Paint (FCP) | ≤ 1.0s | ≤ 2.0s | > 2.0s |
| Largest Contentful Paint (LCP) | ≤ 2.0s | ≤ 3.0s | > 3.0s |
| First Input Delay (FID) | ≤ 100ms | ≤ 200ms | > 200ms |
| Cumulative Layout Shift (CLS) | ≤ 0.05 | ≤ 0.15 | > 0.15 |
| Time to Interactive (TTI) | ≤ 3.0s | ≤ 5.0s | > 5.0s |
| Total Blocking Time (TBT) | ≤ 200ms | ≤ 400ms | > 400ms |

#### Estrategias de Optimización Frontend

1. **Code Splitting**
```typescript
// Lazy loading de rutas
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Reservas = React.lazy(() => import('./pages/Reservas'));
const Hoteles = React.lazy(() => import('./pages/Hoteles'));

// Suspense para loading states
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/reservas" element={<Reservas />} />
  </Routes>
</Suspense>
```

2. **Optimización de Imágenes**
```typescript
// Uso de WebP con fallback
<picture>
  <source srcset="image.webp" type="image/webp" />
  <source srcset="image.jpg" type="image/jpeg" />
  <img src="image.jpg" alt="Hotel" loading="lazy" />
</picture>

// Responsive images
<img 
  srcset="
    hotel-300.jpg 300w,
    hotel-600.jpg 600w,
    hotel-1200.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  src="hotel-600.jpg"
  alt="Hotel"
/>
```

3. **Asset Optimization**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@mui/material', '@emotion/react'],
          'utils': ['axios', 'date-fns']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true  // Remover console.logs en producción
      }
    }
  }
});
```

4. **Caché de Browser**
```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
}
```

---

### RNF-PER-003: Optimización de Base de Datos

**ID:** RNF-PER-003  
**Categoría:** Rendimiento  
**Prioridad:** Alta  
**Métrica:** Tiempo de ejecución de queries

#### Objetivos

- Queries simples (SELECT por PK): < 5ms
- Queries con 1-2 JOINs: < 50ms
- Búsquedas complejas: < 200ms
- Agregaciones: < 500ms

#### Connection Pooling

```python
# Database configuration
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

DATABASE_URL = "postgresql://user:pass@localhost/alectours"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,  # Conexiones activas
    max_overflow=10,  # Conexiones adicionales bajo demanda
    pool_timeout=30,  # Timeout esperando conexión disponible
    pool_recycle=3600,  # Reciclar conexiones cada hora
    pool_pre_ping=True,  # Verificar conexión antes de usar
    echo=False  # No loguear queries en producción
)
```

#### Query Optimization Examples

```sql
-- ❌ Mal: Full table scan
SELECT * FROM reservas WHERE EXTRACT(YEAR FROM fecha_checkin) = 2026;

-- ✅ Bien: Uso de rango con índice
SELECT * FROM reservas 
WHERE fecha_checkin >= '2026-01-01' AND fecha_checkin < '2027-01-01';

-- ❌ Mal: Multiple queries
SELECT * FROM hoteles WHERE destino_id = 'uuid';
-- Luego para cada hotel:
SELECT AVG(calificacion) FROM resenas WHERE hotel_id = 'uuid';

-- ✅ Bien: Single query con aggregation
SELECT h.*, COALESCE(AVG(r.calificacion), 0) as calificacion_promedio
FROM hoteles h
LEFT JOIN resenas r ON h.id = r.hotel_id AND r.estado = 'aprobada'
WHERE h.destino_id = 'uuid'
GROUP BY h.id;
```

---

## Escalabilidad

### RNF-ESC-001: Escalabilidad Horizontal

**ID:** RNF-ESC-001  
**Categoría:** Escalabilidad  
**Prioridad:** Alta  
**Métrica:** Capacidad de instancias concurrentes

#### Objetivos

- Soportar **mínimo 3 instancias** del backend simultáneamente
- Soportar **hasta 10 instancias** sin cambios de código
- **Stateless design:** Sin estado compartido entre instancias

#### Arquitectura Stateless

```yaml
# docker-compose.yml - Múltiples instancias backend
version: '3.8'
services:
  backend-1:
    image: alectours-backend:latest
    environment:
      - INSTANCE_ID=backend-1
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  backend-2:
    image: alectours-backend:latest
    environment:
      - INSTANCE_ID=backend-2
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  backend-3:
    image: alectours-backend:latest
    environment:
      - INSTANCE_ID=backend-3
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend-1
      - backend-2
      - backend-3
```

#### Load Balancing

```nginx
# nginx.conf
upstream backend_servers {
    least_conn;  # Distribuir según carga
    server backend-1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-2:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-3:8000 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Health check
        proxy_next_upstream error timeout http_500 http_502 http_503;
    }
}
```

#### Sesiones en Redis

```python
# No usar sesiones en memoria del servidor
# ❌ Mal: Estado en memoria (no escala)
sessions = {}  # Diccionario en memoria del proceso

def store_session(user_id, data):
    sessions[user_id] = data  # Se pierde si reinicia el servidor

# ✅ Bien: Sesiones en Redis (compartido)
import redis

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

def store_session(user_id: str, data: dict, ttl: int = 1800):
    redis_client.setex(
        f"session:{user_id}",
        ttl,
        json.dumps(data)
    )

def get_session(user_id: str) -> dict:
    data = redis_client.get(f"session:{user_id}")
    return json.loads(data) if data else None
```

---

### RNF-ESC-002: Capacidad de Usuarios Concurrentes

**ID:** RNF-ESC-002  
**Categoría:** Escalabilidad  
**Prioridad:** Alta  
**Métrica:** Usuarios concurrentes sin degradación

#### Objetivos

| Escenario | Usuarios Concurrentes | Latencia p95 | Throughput |
|-----------|------------------------|--------------|------------|
| Operación normal | 1,000 | ≤ 500ms | 100 req/s |
| Carga alta | 5,000 | ≤ 1000ms | 500 req/s |
| Pico (Black Friday) | 10,000 | ≤ 2000ms | 1000 req/s |

#### Load Testing

```python
# locustfile.py - Prueba de carga
from locust import HttpUser, task, between

class AlecToursUser(HttpUser):
    wait_time = between(1, 5)  # Espera entre 1-5 segundos entre acciones
    
    def on_start(self):
        # Login al iniciar
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)  # Peso 3: más frecuente
    def buscar_hoteles(self):
        self.client.get("/api/v1/hoteles", params={
            "destino_id": "some-uuid",
            "pagina": 1,
            "por_pagina": 20
        })
    
    @task(2)  # Peso 2
    def ver_detalle_hotel(self):
        self.client.get("/api/v1/hoteles/some-uuid")
    
    @task(1)  # Peso 1: menos frecuente
    def crear_reserva(self):
        self.client.post("/api/v1/reservas", 
            headers=self.headers,
            json={
                "hotel_id": "uuid",
                "habitacion_id": "uuid",
                "fecha_checkin": "2026-09-01",
                "fecha_checkout": "2026-09-05"
            }
        )

# Ejecutar: locust -f locustfile.py --users 5000 --spawn-rate 100
```

#### Auto-Scaling (Kubernetes)

```yaml
# kubernetes/hpa.yaml - Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: alectours-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: alectours-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60
```

---

## Seguridad

### RNF-SEG-001: Autenticación y Autorización

**ID:** RNF-SEG-001  
**Categoría:** Seguridad  
**Prioridad:** Crítica  
**Estándar:** OWASP Top 10

#### Requisitos de Autenticación

**Contraseñas:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Permitir caracteres especiales
- Hashing con bcrypt (cost factor ≥ 12)
- No permitir contraseñas comunes (diccionario)

```python
# Password validation
import bcrypt
from password_strength import PasswordPolicy

policy = PasswordPolicy.from_names(
    length=8,
    uppercase=1,
    lowercase=1,
    numbers=1
)

def validar_contraseña(password: str) -> bool:
    # Validar política
    if policy.test(password):
        raise ValueError("Contraseña no cumple requisitos")
    
    # Validar contra diccionario común
    common_passwords = load_common_passwords()
    if password.lower() in common_passwords:
        raise ValueError("Contraseña muy común")
    
    return True

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
```

**JWT Tokens:**
```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("SECRET_KEY")  # Mínimo 48 caracteres
ALGORITHM = "HS256"
TOKEN_EXPIRATION = 30  # minutos

def crear_token(usuario_id: UUID, rol: str) -> str:
    payload = {
        "sub": str(usuario_id),
        "rol": rol,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRATION),
        "jti": str(uuid.uuid4())  # Token ID único
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def validar_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verificar que no esté en blacklist (tokens revocados)
        if redis_client.exists(f"blacklist:{payload['jti']}"):
            raise HTTPException(401, "Token revocado")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expirado")
    except jwt.JWTError:
        raise HTTPException(401, "Token inválido")
```

**Control de Acceso Basado en Roles (RBAC):**
```python
from enum import Enum
from functools import wraps

class Rol(Enum):
    ADMIN = "admin"
    EMPLEADO = "empleado"
    CLIENTE = "cliente"

# Matriz de permisos
PERMISOS = {
    Rol.ADMIN: ["*"],  # Todos los permisos
    Rol.EMPLEADO: [
        "hoteles:*",
        "reservas:*",
        "clientes:read",
        "clientes:update",
        "pagos:verify"
    ],
    Rol.CLIENTE: [
        "reservas:create",
        "reservas:read:own",
        "reservas:cancel:own",
        "perfil:update:own"
    ]
}

def requiere_permiso(*permisos_requeridos):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, usuario: Usuario = Depends(get_current_user), **kwargs):
            rol = usuario.rol
            permisos_usuario = PERMISOS[rol]
            
            # Admin tiene todos los permisos
            if "*" in permisos_usuario:
                return await func(*args, usuario=usuario, **kwargs)
            
            # Verificar permisos específicos
            tiene_permiso = any(
                permiso in permisos_usuario or 
                permiso.split(":")[0] + ":*" in permisos_usuario
                for permiso in permisos_requeridos
            )
            
            if not tiene_permiso:
                raise HTTPException(403, "No tienes permiso para esta acción")
            
            return await func(*args, usuario=usuario, **kwargs)
        return wrapper
    return decorator

# Uso
@app.post("/api/v1/hoteles")
@requiere_permiso("hoteles:create")
async def crear_hotel(datos: HotelCreate, usuario: Usuario = Depends()):
    # Solo admin y empleados pueden ejecutar esto
    ...
```

---

### RNF-SEG-002: Protección contra Ataques

**ID:** RNF-SEG-002  
**Categoría:** Seguridad  
**Prioridad:** Crítica  
**Estándar:** OWASP Top 10

#### Rate Limiting

```python
from fastapi import Request
from app.core.cache import redis_client

class RateLimiter:
    def __init__(self, limite: int, ventana: int):
        self.limite = limite
        self.ventana = ventana
    
    async def __call__(self, request: Request):
        ip = request.client.host
        endpoint = request.url.path
        
        key = f"ratelimit:{endpoint}:{ip}"
        
        try:
            # Incrementar contador
            current = redis_client.incr(key)
            
            # Primera petición: configurar expiración
            if current == 1:
                redis_client.expire(key, self.ventana)
            
            # Verificar límite
            if current > self.limite:
                raise HTTPException(
                    status_code=429,
                    detail=f"Límite de {self.limite} peticiones excedido. Intenta en {self.ventana} segundos.",
                    headers={"Retry-After": str(self.ventana)}
                )
            
            # Agregar headers informativos
            remaining = max(0, self.limite - current)
            return {
                "X-RateLimit-Limit": str(self.limite),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(redis_client.ttl(key))
            }
        
        except redis.RedisError:
            # Si Redis falla, no bloquear tráfico legítimo
            logger.warning(f"Rate limiting failed for {ip}")
            return {}

# Aplicar a endpoints críticos
@app.post("/api/v1/auth/login", dependencies=[Depends(RateLimiter(5, 60))])
async def login(...):
    ...

@app.post("/api/v1/auth/register", dependencies=[Depends(RateLimiter(5, 60))])
async def register(...):
    ...

@app.post("/api/v1/reservas/{id}/pagar", dependencies=[Depends(RateLimiter(10, 60))])
async def pagar_reserva(...):
    ...
```

#### SQL Injection Prevention

```python
# ✅ Siempre usar ORM con queries parametrizadas
from sqlalchemy import text

# ❌ NUNCA hacer esto:
def buscar_usuario_inseguro(email: str):
    query = f"SELECT * FROM usuarios WHERE email = '{email}'"  # VULNERABLE
    return db.execute(query)

# ✅ Hacer esto:
def buscar_usuario_seguro(email: str):
    # ORM automáticamente parametriza
    return db.query(Usuario).filter(Usuario.email == email).first()

# ✅ O con SQL raw parametrizado:
def buscar_usuario_raw(email: str):
    query = text("SELECT * FROM usuarios WHERE email = :email")
    return db.execute(query, {"email": email})
```

#### Cross-Site Scripting (XSS) Prevention

```python
from html import escape

# Backend: Sanitizar inputs
def sanitizar_input(texto: str) -> str:
    return escape(texto).strip()

# Pydantic schema con validación
from pydantic import BaseModel, validator

class ComentarioCreate(BaseModel):
    texto: str
    
    @validator('texto')
    def sanitizar_texto(cls, v):
        # Remover tags HTML
        return bleach.clean(v, tags=[], strip=True)

# Frontend: Uso de React (escapa automáticamente)
// ✅ React escapa por defecto
<div>{comentario.texto}</div>

// ❌ NUNCA usar dangerouslySetInnerHTML con input de usuario
<div dangerouslySetInnerHTML={{__html: comentario.texto}} />  // VULNERABLE
```

#### CSRF Protection

```python
from fastapi_csrf_protect import CsrfProtect

csrf = CsrfProtect()

@app.post("/api/v1/reservas")
async def crear_reserva(
    datos: ReservaCreate,
    csrf_token: str = Depends(csrf.validate_csrf)
):
    # Token CSRF validado automáticamente
    ...
```

---

### RNF-SEG-003: Cifrado de Datos

**ID:** RNF-SEG-003  
**Categoría:** Seguridad  
**Prioridad:** Crítica  
**Estándar:** PCI DSS, GDPR

#### HTTPS/TLS

```nginx
# nginx.conf - Configuración SSL/TLS
server {
    listen 443 ssl http2;
    server_name alectours.com;
    
    # Certificados (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/alectours.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alectours.com/privkey.pem;
    
    # Protocolos seguros
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    location / {
        proxy_pass http://backend;
    }
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name alectours.com;
    return 301 https://$server_name$request_uri;
}
```

#### Cifrado de Datos Sensibles

```python
from cryptography.fernet import Fernet

# Generar clave (hacer una vez, guardar en secrets)
def generar_clave():
    return Fernet.generate_key()

# Cifrar datos
class DataEncryption:
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY").encode()
        self.cipher = Fernet(key)
    
    def cifrar(self, texto: str) -> str:
        return self.cipher.encrypt(texto.encode()).decode()
    
    def descifrar(self, texto_cifrado: str) -> str:
        return self.cipher.decrypt(texto_cifrado.encode()).decode()

encryptor = DataEncryption()

# Uso en modelo
class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(UUID, primary_key=True)
    nombre = Column(String)
    numero_documento = Column(String)  # Cifrado
    
    @property
    def documento_descifrado(self) -> str:
        return encryptor.descifrar(self.numero_documento)
    
    def set_documento(self, documento: str):
        self.numero_documento = encryptor.cifrar(documento)
```

#### Tokenización de Tarjetas (PCI DSS)

```python
# NO almacenar datos completos de tarjetas
# Usar gateway de pago (Stripe, PayPal) para tokenización

import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def procesar_pago_seguro(datos_tarjeta: dict, monto: Decimal):
    # 1. Crear token en Stripe (datos de tarjeta nunca llegan a nuestro servidor)
    token = stripe.Token.create(card={
        "number": datos_tarjeta["numero"],
        "exp_month": datos_tarjeta["exp_mes"],
        "exp_year": datos_tarjeta["exp_año"],
        "cvc": datos_tarjeta["cvv"]
    })
    
    # 2. Crear cargo usando token
    cargo = stripe.Charge.create(
        amount=int(monto * 100),
        currency="usd",
        source=token.id
    )
    
    # 3. Guardar solo metadata segura
    return {
        "stripe_charge_id": cargo.id,
        "ultimos_4_digitos": datos_tarjeta["numero"][-4:],
        "marca": cargo.source.brand  # Visa, Mastercard, etc
    }
```

---

## Confiabilidad

### RNF-CON-001: Manejo de Errores

**ID:** RNF-CON-001  
**Categoría:** Confiabilidad  
**Prioridad:** Alta  
**Métrica:** Tasa de error < 1%

#### Estrategia de Manejo de Errores

```python
from enum import Enum
from typing import Optional

class ErrorCode(Enum):
    # Errores de autenticación (1xxx)
    AUTH_CREDENCIALES_INVALIDAS = 1001
    AUTH_TOKEN_EXPIRADO = 1002
    AUTH_TOKEN_INVALIDO = 1003
    AUTH_CUENTA_NO_VERIFICADA = 1004
    
    # Errores de validación (2xxx)
    VALIDACION_DATOS_REQUERIDOS = 2001
    VALIDACION_FORMATO_INVALIDO = 2002
    VALIDACION_RANGO_INVALIDO = 2003
    
    # Errores de negocio (3xxx)
    RESERVA_SIN_DISPONIBILIDAD = 3001
    RESERVA_FECHAS_INVALIDAS = 3002
    PAGO_PROCESAMIENTO_FALLIDO = 3003
    
    # Errores de sistema (5xxx)
    SISTEMA_BD_NO_DISPONIBLE = 5001
    SISTEMA_SERVICIO_EXTERNO = 5002

class AppException(Exception):
    def __init__(
        self,
        codigo: ErrorCode,
        mensaje: str,
        detalles: Optional[dict] = None,
        http_status: int = 400
    ):
        self.codigo = codigo
        self.mensaje = mensaje
        self.detalles = detalles or {}
        self.http_status = http_status
        super().__init__(mensaje)

# Exception handler global
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    logger.error(
        f"Error de aplicación: {exc.codigo.name}",
        extra={
            "codigo": exc.codigo.value,
            "mensaje": exc.mensaje,
            "detalles": exc.detalles,
            "url": str(request.url),
            "metodo": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.http_status,
        content={
            "error": {
                "codigo": exc.codigo.value,
                "mensaje": exc.mensaje,
                "detalles": exc.detalles,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

# Uso
def verificar_disponibilidad(habitacion_id, fechas):
    if not hay_disponibilidad:
        raise AppException(
            codigo=ErrorCode.RESERVA_SIN_DISPONIBILIDAD,
            mensaje="La habitación no está disponible para las fechas seleccionadas",
            detalles={
                "habitacion_id": str(habitacion_id),
                "fecha_checkin": fechas.checkin.isoformat(),
                "fecha_checkout": fechas.checkout.isoformat()
            },
            http_status=409
        )
```

---

### RNF-CON-002: Transacciones ACID

**ID:** RNF-CON-002  
**Categoría:** Confiabilidad  
**Prioridad:** Crítica  
**Métrica:** 100% de transacciones atómicas

#### Implementación de Transacciones

```python
from sqlalchemy.orm import Session
from contextlib import contextmanager

@contextmanager
def transaccion(db: Session):
    """Context manager para transacciones con rollback automático"""
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error en transacción, rollback ejecutado: {str(e)}")
        raise
    finally:
        db.close()

# Uso en operaciones críticas
def crear_reserva_completa(datos: ReservaCreate, db: Session):
    with transaccion(db):
        # 1. Crear registro de reserva
        reserva = Reserva(**datos.dict())
        db.add(reserva)
        db.flush()  # Obtener ID sin commit
        
        # 2. Actualizar disponibilidad
        habitacion = db.query(Habitacion).get(datos.habitacion_id)
        habitacion.disponibilidad -= 1
        
        # 3. Crear registro de pago pendiente
        pago = Pago(
            reserva_id=reserva.id,
            monto=datos.precio_total,
            estado="pendiente"
        )
        db.add(pago)
        
        # 4. Enviar notificación (fuera de transacción)
        # Se ejecuta DESPUÉS del commit exitoso
        
    # Si llega aquí, transacción fue exitosa
    enviar_notificacion_reserva_creada(reserva.id)
    return reserva
```

---

## Disponibilidad

### RNF-DIS-001: Uptime

**ID:** RNF-DIS-001  
**Categoría:** Disponibilidad  
**Prioridad:** Alta  
**Métrica:** 99.5% uptime (≈ 3.6 horas downtime/mes)

#### Cálculo de Disponibilidad

```
Uptime (%) = (Tiempo Total - Tiempo Inactivo) / Tiempo Total × 100

99.5% = 99.5% disponible = 0.5% inactivo
0.5% de 30 días = 0.5% de 43,200 minutos = 216 minutos = 3.6 horas
```

#### Service Level Agreement (SLA)

| Nivel | Uptime | Downtime/Año | Downtime/Mes | Downtime/Semana |
|-------|--------|--------------|--------------|-----------------|
| 99% | Two Nines | 3.65 días | 7.31 horas | 1.68 horas |
| 99.5% | **AlecTours** | 1.83 días | 3.65 horas | 50.4 minutos |
| 99.9% | Three Nines | 8.77 horas | 43.8 minutos | 10.1 minutos |
| 99.99% | Four Nines | 52.6 minutos | 4.38 minutos | 1.01 minutos |

#### Estrategias para Alta Disponibilidad

**1. Health Checks**
```python
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "up"
    except Exception as e:
        health_status["checks"]["database"] = "down"
        health_status["status"] = "unhealthy"
        logger.error(f"Database health check failed: {e}")
    
    # Check Redis
    try:
        redis_client.ping()
        health_status["checks"]["redis"] = "up"
    except Exception as e:
        health_status["checks"]["redis"] = "down"
        # Redis es cache, no crítico
        logger.warning(f"Redis health check failed: {e}")
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)
```

**2. Graceful Shutdown**
```python
import signal
import sys

def graceful_shutdown(signum, frame):
    logger.info("Recibida señal de terminación, iniciando graceful shutdown...")
    
    # 1. Dejar de aceptar nuevas conexiones
    server.should_exit = True
    
    # 2. Esperar que terminen requests en progreso (timeout 30s)
    logger.info("Esperando que terminen requests en progreso...")
    time.sleep(30)
    
    # 3. Cerrar conexiones de BD
    logger.info("Cerrando conexiones de base de datos...")
    engine.dispose()
    
    # 4. Cerrar conexiones de Redis
    logger.info("Cerrando conexiones de Redis...")
    redis_client.close()
    
    logger.info("Shutdown completado")
    sys.exit(0)

# Registrar señales
signal.signal(signal.SIGTERM, graceful_shutdown)
signal.signal(signal.SIGINT, graceful_shutdown)
```

---

### RNF-DIS-002: Backup y Recuperación

**ID:** RNF-DIS-002  
**Categoría:** Disponibilidad  
**Prioridad:** Crítica  
**Métrica:** RPO ≤ 15 min, RTO ≤ 1 hora

#### Estrategia de Backup

```bash
#!/bin/bash
# scripts/backup_database.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
DB_NAME="alectours"
DB_USER="postgres"
DB_HOST="localhost"

# Backup completo (diario)
echo "Iniciando backup completo..."
pg_dump -h $DB_HOST -U $DB_USER -Fc $DB_NAME > "$BACKUP_DIR/full_$TIMESTAMP.dump"

# Comprimir
gzip "$BACKUP_DIR/full_$TIMESTAMP.dump"

# Subir a S3
aws s3 cp "$BACKUP_DIR/full_$TIMESTAMP.dump.gz" s3://alectours-backups/daily/

# Limpiar backups locales > 7 días
find $BACKUP_DIR -name "full_*.dump.gz" -mtime +7 -delete

echo "Backup completado: full_$TIMESTAMP.dump.gz"

# Cron job: Ejecutar diariamente a las 2 AM
# 0 2 * * * /scripts/backup_database.sh
```

```bash
#!/bin/bash
# scripts/backup_incremental.sh

# Backup incremental (cada 6 horas)
# Usa WAL (Write-Ahead Logging) de PostgreSQL

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/wal"

# Archivar WAL
pg_receivewal -h localhost -U postgres -D "$BACKUP_DIR" --compress=9

# Subir a S3
aws s3 sync "$BACKUP_DIR" s3://alectours-backups/wal/

# Cron job: Cada 6 horas
# 0 */6 * * * /scripts/backup_incremental.sh
```

#### Procedimiento de Restauración

```bash
#!/bin/bash
# scripts/restore_database.sh

BACKUP_FILE=$1
DB_NAME="alectours"

echo "Restaurando desde $BACKUP_FILE..."

# 1. Descargar backup de S3
aws s3 cp "s3://alectours-backups/$BACKUP_FILE" /tmp/

# 2. Descomprimir
gunzip "/tmp/$BACKUP_FILE"

# 3. Detener aplicación
docker-compose stop backend

# 4. Eliminar BD existente
psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -U postgres -c "CREATE DATABASE $DB_NAME;"

# 5. Restaurar backup
pg_restore -h localhost -U postgres -d $DB_NAME "/tmp/${BACKUP_FILE%.gz}"

# 6. Aplicar WAL incremental si es necesario
# (para punto de recuperación más reciente)

# 7. Reiniciar aplicación
docker-compose start backend

echo "Restauración completada"
```

---

## Mantenibilidad

### RNF-MAN-001: Código Limpio

**ID:** RNF-MAN-001  
**Categoría:** Mantenibilidad  
**Prioridad:** Alta  
**Estándar:** Clean Code, PEP 8

#### Convenciones de Código

**Python (Backend):**
```python
# ✅ Buenos nombres: descriptivos y específicos
def calcular_precio_total_reserva(reserva: Reserva, promocion: Promocion = None) -> Decimal:
    precio_base = reserva.habitacion.precio_noche * reserva.numero_noches
    if promocion and promocion.activa:
        descuento = precio_base * (promocion.porcentaje / 100)
        return precio_base - descuento
    return precio_base

# ❌ Malos nombres: ambiguos o crípticos
def calc(r, p = None):
    pb = r.h.pn * r.nn
    if p and p.a:
        d = pb * (p.p / 100)
        return pb - d
    return pb
```

**Funciones Pequeñas:**
```python
# ✅ Bien: Funciones con responsabilidad única
def validar_fechas_reserva(checkin: date, checkout: date):
    """Valida que las fechas de reserva sean correctas."""
    if checkin >= checkout:
        raise ValueError("Checkout debe ser después de checkin")
    
    if checkin < date.today():
        raise ValueError("Check-in no puede ser en el pasado")

def validar_disponibilidad(habitacion_id: UUID, checkin: date, checkout: date):
    """Verifica si la habitación está disponible."""
    return calcular_disponibilidad(habitacion_id, checkin, checkout) > 0

def crear_reserva(datos: ReservaCreate):
    # Función orquestadora
    validar_fechas_reserva(datos.fecha_checkin, datos.fecha_checkout)
    
    if not validar_disponibilidad(datos.habitacion_id, datos.fecha_checkin, datos.fecha_checkout):
        raise HTTPException(409, "Sin disponibilidad")
    
    # ... crear reserva

# ❌ Mal: Función gigante que hace todo
def crear_reserva_monolitica(datos):
    # 200 líneas de validaciones, cálculos, creación, notificaciones...
    pass
```

---

### RNF-MAN-002: Logging Estructurado

**ID:** RNF-MAN-002  
**Categoría:** Mantenibilidad  
**Prioridad:** Alta  
**Formato:** JSON estructurado

#### Configuración de Logging

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Agregar información extra
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Agregar excepción si existe
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Configurar logger
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler()
    ]
)

for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())

logger = logging.getLogger(__name__)

# Uso
logger.info("Reserva creada", extra={
    "reserva_id": str(reserva.id),
    "cliente_id": str(cliente.id),
    "hotel_id": str(hotel.id),
    "precio_total": float(reserva.precio_total)
})

logger.error("Error procesando pago", extra={
    "reserva_id": str(reserva.id),
    "error_code": "PAYMENT_FAILED",
    "gateway_response": gateway_response
}, exc_info=True)
```

#### Niveles de Log

```python
# DEBUG: Información detallada para debugging
logger.debug("Iniciando validación de disponibilidad", extra={
    "habitacion_id": str(habitacion_id),
    "fecha_checkin": checkin.isoformat()
})

# INFO: Eventos importantes del flujo normal
logger.info("Usuario autenticado exitosamente", extra={
    "usuario_id": str(usuario.id),
    "email": usuario.email
})

# WARNING: Situaciones inesperadas pero manejables
logger.warning("Cache de Redis no disponible, usando base de datos directa", extra={
    "cache_key": key,
    "fallback": "database"
})

# ERROR: Errores que impiden completar operación
logger.error("Fallo al procesar pago", extra={
    "reserva_id": str(reserva.id),
    "error": str(e)
}, exc_info=True)

# CRITICAL: Errores que afectan al sistema completo
logger.critical("Base de datos no disponible", extra={
    "database_url": DATABASE_URL,
    "error": str(e)
}, exc_info=True)
```

---

## Usabilidad

### RNF-USA-001: Accesibilidad (WCAG 2.1 Nivel AA)

**ID:** RNF-USA-001  
**Categoría:** Usabilidad  
**Prioridad:** Alta  
**Estándar:** WCAG 2.1 Level AA

#### Requisitos de Accesibilidad

**1. Contraste de Colores**
```css
/* Mínimo 4.5:1 para texto normal */
.text-normal {
    color: #333333;  /* Texto oscuro */
    background-color: #FFFFFF;  /* Fondo claro */
    /* Ratio de contraste: 12.63:1 ✅ */
}

/* Mínimo 3:1 para texto grande (18px+ o 14px+ bold) */
.text-large {
    font-size: 18px;
    color: #666666;
    background-color: #FFFFFF;
    /* Ratio de contraste: 5.74:1 ✅ */
}

/* Verificar contraste con herramientas:
   - WebAIM Contrast Checker
   - Chrome DevTools Accessibility Panel
*/
```

**2. Navegación por Teclado**
```tsx
// Todos los elementos interactivos deben ser accesibles por teclado

// ✅ Bien: Botón nativo
<button onClick={handleClick}>Reservar</button>

// ✅ Bien: Div con role y tabIndex
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
>
  Reservar
</div>

// ❌ Mal: Div sin role ni keyboard handler
<div onClick={handleClick}>Reservar</div>
```

**3. ARIA Labels**
```tsx
// Labels descriptivos para screen readers
<button
  aria-label="Cerrar diálogo de reserva"
  onClick={onClose}
>
  <CloseIcon />
</button>

<input
  type="text"
  id="email"
  aria-label="Correo electrónico"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Por favor ingresa un email válido
  </span>
)}

// Navegación landmarks
<nav aria-label="Navegación principal">
  <a href="/">Inicio</a>
  <a href="/hoteles">Hoteles</a>
</nav>

<main>
  {/* Contenido principal */}
</main>

<aside aria-label="Filtros de búsqueda">
  {/* Sidebar */}
</aside>
```

**4. Foco Visible**
```css
/* Indicador de foco claro */
button:focus-visible,
input:focus-visible,
a:focus-visible {
    outline: 3px solid #0066CC;
    outline-offset: 2px;
}

/* NO remover outline sin alternativa */
/* ❌ Mal */
*:focus {
    outline: none;
}
```

---

### RNF-USA-002: Diseño Responsivo

**ID:** RNF-USA-002  
**Categoría:** Usabilidad  
**Prioridad:** Alta  
**Dispositivos:** Móvil, Tablet, Desktop

#### Breakpoints

```css
/* Mobile First Approach */

/* Base: Mobile (< 768px) */
.container {
    width: 100%;
    padding: 16px;
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) {
    .container {
        width: 750px;
        padding: 24px;
    }
}

/* Desktop (1024px - 1440px) */
@media (min-width: 1024px) {
    .container {
        width: 980px;
        padding: 32px;
    }
}

/* Large Desktop (> 1440px) */
@media (min-width: 1440px) {
    .container {
        width: 1200px;
    }
}
```

#### Touch Targets

```css
/* Tamaño mínimo 44x44px para elementos táctiles */
button,
a.button,
input[type="checkbox"],
input[type="radio"] {
    min-width: 44px;
    min-height: 44px;
    padding: 12px 16px;
}

/* Espaciado entre elementos táctiles */
.button-group button {
    margin: 8px;
}
```

---

## Observabilidad

### RNF-OBS-001: Métricas con Prometheus

**ID:** RNF-OBS-001  
**Categoría:** Observabilidad  
**Prioridad:** Alta  
**Herramienta:** Prometheus + Grafana

#### Métricas Expuestas

```python
from prometheus_client import Counter, Histogram, Gauge

# Contadores
requests_total = Counter(
    'http_requests_total',
    'Total de peticiones HTTP',
    ['method', 'endpoint', 'status']
)

reservas_creadas = Counter(
    'reservas_creadas_total',
    'Total de reservas creadas',
    ['hotel_id']
)

errores_pago = Counter(
    'errores_pago_total',
    'Total de errores en pagos',
    ['tipo_error']
)

# Histogramas
request_duration = Histogram(
    'http_request_duration_seconds',
    'Duración de peticiones HTTP',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
)

query_duration = Histogram(
    'database_query_duration_seconds',
    'Duración de queries de base de datos',
    ['query_type'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

# Gauges
habitaciones_disponibles = Gauge(
    'habitaciones_disponibles',
    'Habitaciones disponibles actualmente',
    ['hotel_id']
)

usuarios_conectados = Gauge(
    'usuarios_conectados',
    'Usuarios conectados actualmente'
)

# Middleware para métricas
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # Registrar métricas
    requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

#### Dashboard de Grafana

```yaml
# grafana/dashboards/alectours-api.json (simplificado)
{
  "dashboard": {
    "title": "AlecTours API Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Latency p95",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Database Query Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

---

## Cumplimiento

### RNF-LEG-001: GDPR / Protección de Datos

**ID:** RNF-LEG-001  
**Categoría:** Cumplimiento Legal  
**Prioridad:** Crítica  
**Regulación:** GDPR (EU), LGPD (Brasil)

#### Derechos del Usuario

```python
# 1. Derecho al Acceso
@app.get("/api/v1/clientes/mis-datos")
async def exportar_datos_personales(usuario: Usuario = Depends(get_current_user)):
    """Exportar todos los datos personales del usuario"""
    datos = {
        "informacion_personal": {
            "nombre": usuario.nombre,
            "email": usuario.email,
            "telefono": usuario.telefono,
            # ...
        },
        "reservas": [reserva.to_dict() for reserva in usuario.reservas],
        "pagos": [pago.to_dict() for pago in usuario.pagos],
        "preferencias": usuario.preferencias
    }
    
    # Generar PDF o JSON para descarga
    return exportar_como_pdf(datos)

# 2. Derecho al Olvido (Right to be Forgotten)
@app.delete("/api/v1/clientes/eliminar-cuenta")
async def eliminar_cuenta(
    usuario: Usuario = Depends(get_current_user),
    confirmacion: str = Body(...)
):
    """Eliminar permanentemente la cuenta y datos del usuario"""
    
    if confirmacion != "CONFIRMO ELIMINAR MI CUENTA":
        raise HTTPException(400, "Confirmación requerida")
    
    # Anonimizar datos en vez de eliminar (mantener integridad referencial)
    usuario.email = f"deleted_{usuario.id}@deleted.com"
    usuario.nombre = "Usuario Eliminado"
    usuario.telefono = None
    usuario.documento = None
    usuario.activo = False
    
    # Eliminar datos opcionales
    db.query(MetodoPagoGuardado).filter_by(cliente_id=usuario.cliente_id).delete()
    db.query(Favorito).filter_by(usuario_id=usuario.id).delete()
    
    # Mantener reservas para historial legal/contable pero anonimizadas
    
    db.commit()
    
    return {"mensaje": "Cuenta eliminada exitosamente"}

# 3. Derecho a la Rectificación
@app.put("/api/v1/clientes/actualizar-datos")
async def actualizar_datos(
    datos: ClienteUpdate,
    usuario: Usuario = Depends(get_current_user)
):
    """Actualizar datos personales"""
    # Permitir actualización inmediata de datos personales
    ...

# 4. Consentimiento
@app.post("/api/v1/consentimiento")
async def actualizar_consentimiento(
    consentimientos: dict,
    usuario: Usuario = Depends(get_current_user)
):
    """Actualizar preferencias de consentimiento"""
    usuario.acepta_marketing = consentimientos.get("marketing", False)
    usuario.acepta_cookies_analytics = consentimientos.get("analytics", False)
    db.commit()
    return {"mensaje": "Preferencias actualizadas"}
```

#### Registro de Procesamiento

```python
class RegistroProcesamientoDatos(Base):
    """Auditoría de acceso a datos personales (GDPR Article 30)"""
    __tablename__ = "registro_procesamiento_datos"
    
    id = Column(UUID, primary_key=True)
    usuario_id = Column(UUID, ForeignKey("usuarios.id"))
    procesado_por = Column(UUID)  # Empleado que accedió
    tipo_operacion = Column(Enum("lectura", "escritura", "eliminacion"))
    datos_accedidos = Column(JSONB)  # Qué datos se accedieron
    proposito = Column(String)  # Por qué se accedió
    base_legal = Column(String)  # Consentimiento, contrato, etc
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_origen = Column(String)

# Decorador para registrar acceso
def registrar_acceso_datos(proposito: str, base_legal: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Ejecutar función
            result = await func(*args, **kwargs)
            
            # Registrar acceso
            registro = RegistroProcesamientoDatos(
                usuario_id=kwargs.get("usuario_id"),
                procesado_por=kwargs.get("empleado_id"),
                tipo_operacion="lectura",
                proposito=proposito,
                base_legal=base_legal,
                timestamp=datetime.utcnow()
            )
            db.add(registro)
            db.commit()
            
            return result
        return wrapper
    return decorator

# Uso
@app.get("/api/v1/clientes/{cliente_id}")
@registrar_acceso_datos(
    proposito="Consulta de información para gestión de reserva",
    base_legal="Ejecución de contrato"
)
async def obtener_cliente(cliente_id: UUID):
    ...
```

---

## Control de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Agosto 2026 | Equipo AlecTours | Versión inicial |
| 2.0 | Agosto 30, 2026 | Kiro AI | Versión detallada con especificaciones técnicas completas |

---

**Fin del Documento**
