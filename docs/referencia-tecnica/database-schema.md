# Esquema de Base de Datos — AlecTours

> **Motor**: PostgreSQL 16
> **ORM**: SQLAlchemy 2.0 con tipos declarativos (Mapped + mapped_column)
> **Migraciones**: Alembic — 16 migraciones encadenadas
> **Archivo de referencia**: `db_schema.sql` en la raíz del proyecto

---

## Diagrama de Dominios

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOMINIO USUARIOS                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ usuarios │──│ usuarios │──│    roles      │  │ sesiones_    │  │
│  │          │  │ _roles   │  │               │  │ usuario      │  │
│  └────┬─────┘  └──────────┘  └───────────────┘  └──────────────┘  │
│       │                                                            │
│  ┌────┴────┐  ┌───────────────────┐                                │
│  │recuper- │  │                    │                               │
│  │acion_   │  │                    │                               │
│  │password │  │                    │                               │
│  └─────────┘  │                    │                               │
└───────────────┼────────────────────┼───────────────────────────────┘
                │                    │
┌───────────────┼────────────────────┼───────────────────────────────┐
│               │   DOMINIO CLIENTES │                               │
│  ┌────────────┴──┐  ┌─────────────┴──┐  ┌────────────────────┐    │
│  │   clientes    │──│ preferencias_  │  │   metodos_pago_    │    │
│  │               │  │   cliente      │  │   guardados        │    │
│  └───────┬───────┘  └────────────────┘  └────────────────────┘    │
│          │                                                         │
│  ┌───────┴───────┐  ┌──────────────┐  ┌──────────────────┐        │
│  │  resenas      │  │  favoritos   │  │ solicitudes_     │        │
│  │               │  │              │  │ cancelacion      │        │
│  └───────────────┘  └──────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DOMINIO HOTELES                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ hoteles  │──│ habitac- │  │ tipo_         │  │caracteristicas│  │
│  │          │  │ iones    │  │ habitacion    │  │   _hotel     │  │
│  └──────────┘  └──────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DOMINIO SERVICIOS                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │destinos  │──│servicios │──│ proveedores  │  │ categoria_   │  │
│  │          │  │          │  │              │  │ servicio     │  │
│  └──────────┘  └──────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DOMINIO RESERVAS                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ reservas │──│reserva_      │  │reserva_      │                 │
│  │          │  │habitaciones  │  │servicios     │                 │
│  └────┬─────┘  └──────────────┘  └──────────────┘                 │
│       │                                                             │
│  ┌────┴────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  pagos  │  │historial_  │  │  metodos_    │  │solicitudes_  │  │
│  │         │  │reservas    │  │  pago        │  │cancelacion   │  │
│  └─────────┘  └────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DOMINIO PAQUETES                                 │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────┐            │
│  │ paquetes │──│paquete_        │  │paquete_hotel     │            │
│  │          │  │servicios       │  │                  │            │
│  └──────────┘  └────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DOMINIO SISTEMA                                  │
│  ┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │configuracion_      │  │notificaciones│  │banners_          │    │
│  │sistema             │  │              │  │publicitarios     │    │
│  └────────────────────┘  └──────────────┘  └──────────────────┘    │
│  ┌────────────────────────────────────────┐                        │
│  │solicitudes_corporativas                │                        │
│  └────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tablas Principales

### `usuarios`

```sql
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    id_cliente INTEGER UNIQUE REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    id_empleado INTEGER UNIQUE REFERENCES empleados(id_empleado) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    foto_perfil VARCHAR(255),
    ultimo_login TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Un usuario puede estar vinculado a un cliente O un empleado (o ninguno en el caso del admin).

### `roles` y `usuarios_roles`

```sql
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios_roles (
    id_usuario INTEGER NOT NULL,
    id_rol INTEGER NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_rol)
);
```

Roles semilla: `admin`, `cliente`, `empleado`, `supervisor`, `gerente`, `agente_ventas`, `soporte`, `guia_turistico`, `auditor`, `marketing`.

### `hoteles`

```sql
CREATE TABLE hoteles (
    id_hotel SERIAL PRIMARY KEY,
    nombre_hotel VARCHAR(100) NOT NULL,
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    codigo_postal VARCHAR(20),
    correo_electronico VARCHAR(100),
    telefono VARCHAR(20)
);
```

### `habitaciones`

```sql
CREATE TABLE habitaciones (
    id_habitacion SERIAL PRIMARY KEY,
    id_hotel INTEGER NOT NULL REFERENCES hoteles(id_hotel) ON DELETE CASCADE,
    id_tipo_habitacion INTEGER NOT NULL REFERENCES tipo_habitacion(id_tipo_habitacion),
    numero_habitacion VARCHAR(20) NOT NULL,
    precio_noche NUMERIC(10,2) CHECK (precio_noche >= 0),
    estado VARCHAR(20) CHECK (estado IN ('disponible', 'ocupada', 'mantenimiento')),
    UNIQUE(id_hotel, numero_habitacion)
);
```

### `reservas`

```sql
CREATE TABLE reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente),
    id_empleado INTEGER REFERENCES empleados(id_empleado) ON DELETE SET NULL,
    id_paquete INTEGER REFERENCES paquetes(id_paquete) ON DELETE SET NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE,
    fecha_fin DATE,
    numero_personas INTEGER CHECK (numero_personas > 0),
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'finalizada')),
    canal_origen VARCHAR(20) DEFAULT 'web' CHECK (canal_origen IN ('web', 'empleado', 'telefono'))
);
```

### `pagos`

```sql
CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_reserva INTEGER NOT NULL REFERENCES reservas(id_reserva),
    id_metodo_pago INTEGER NOT NULL REFERENCES metodos_pago(id_metodo),
    monto NUMERIC(10,2) CHECK (monto >= 0),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia VARCHAR(100),
    numero_factura VARCHAR(20) UNIQUE,
    comprobante_url VARCHAR(255),
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'procesando', 'pagado', 'rechazado', 'cancelado')),
    simular_rechazo BOOLEAN DEFAULT FALSE
);
```

### `paquetes`

```sql
CREATE TABLE paquetes (
    id_paquete SERIAL PRIMARY KEY,
    nombre_paquete VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_dias INTEGER,
    precio_base NUMERIC(10,2) CHECK (precio_base >= 0),
    activo BOOLEAN DEFAULT TRUE,
    ciudad_salida VARCHAR(100)
);
```

---

## Tablas de Relación N:N

| Tabla | Relaciona | Campos clave |
|---|---|---|
| `usuarios_roles` | usuarios ↔ roles | id_usuario, id_rol |
| `hotel_caracteristicas` | hoteles ↔ caracteristicas_hotel | id_hotel, id_caracteristica |
| `reserva_habitaciones` | reservas ↔ habitaciones | id_reserva, id_habitacion |
| `reserva_servicios` | reservas ↔ servicios | id_reserva, id_servicio |
| `paquete_servicios` | paquetes ↔ servicios | id_paquete, id_servicio |
| `paquete_hotel` | paquetes ↔ hoteles | id_paquete, id_hotel |
| `servicio_proveedor` | servicios ↔ proveedores | id_servicio, id_proveedor |

---

## Índices

```sql
CREATE INDEX idx_reservas_cliente ON reservas(id_cliente);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_habitaciones_hotel ON habitaciones(id_hotel);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_correo ON usuarios(correo_electronico);
CREATE UNIQUE INDEX idx_solicitud_cancelacion_pendiente_unica
    ON solicitudes_cancelacion (id_reserva) WHERE estado = 'pendiente';
CREATE INDEX idx_solicitudes_cancelacion_cliente ON solicitudes_cancelacion(id_cliente);
CREATE INDEX idx_solicitudes_cancelacion_estado ON solicitudes_cancelacion(estado);
```

---

## Vista SQL

```sql
CREATE OR REPLACE VIEW vista_paquetes_populares AS
SELECT
    p.id_paquete,
    p.nombre_paquete,
    p.descripcion,
    p.duracion_dias,
    p.precio_base,
    p.activo,
    COUNT(r.id_reserva) AS total_reservas,
    ROUND(AVG(CASE WHEN pa.estado = 'pagado' THEN 1.0 ELSE 0.0 END) * 5, 1) AS calificacion_estimada
FROM paquetes p
LEFT JOIN reservas r ON r.id_paquete = p.id_paquete
LEFT JOIN pagos pa ON pa.id_reserva = r.id_reserva
WHERE p.activo = TRUE
GROUP BY p.id_paquete
ORDER BY total_reservas DESC, calificacion_estimada DESC;
```

---

## Migraciones con Alembic

16 migraciones encadenadas desde el esquema inicial hasta el estado actual:

| Revisión | Descripción |
|---|---|
| `49b74c185f93` | Esquema inicial — 27 tablas |
| `2b118189cd9d` | Seed 10 roles |
| `523e6283e58b` | Seed datos demo (hoteles, clientes, empleados, reservas, pagos) |
| `83731da37b5e` | Tabla resenas |
| `f4a9c1d8b2e3` | Campo foto_perfil en usuarios |
| `a7c3e9f21b04` | Fix password hashes, crear admin user, asignar roles |
| `d4c8a1f39b02` | Campo codigo en metodos_pago, estados procesando/cancelado |
| `e1f5a2c9d7b6` | Tabla favoritos |
| `b6a2d4f81c93` | Tabla metodos_pago_guardados |
| `c8e2f5a91d47` | Campo numero_factura y comprobante_url en pagos |
| `d3f7b6c281a9` | Tabla configuracion_sistema |
| `e7a2c9f04b18` | Tabla notificaciones |
| `f1b8d3a75c26` | Tabla solicitudes_corporativas |
| `c8810ca8bd10` | Campo ciudad_salida en paquetes |
| `6e292ee53809` | Tabla banners_publicitarios |
| `5b3d408e912a` | Tabla solicitudes_cancelacion (head) |

```bash
# Comandos útiles
docker compose exec backend alembic current     # Ver migración actual
docker compose exec backend alembic history     # Ver historial
docker compose exec backend alembic upgrade head # Aplicar pendientes
```

---

## Convenciones de Nomenclatura

| Aspecto | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case`, plural | `reservas`, `metodos_pago` |
| Columnas | `snake_case` | `fecha_creacion`, `precio_noche` |
| Primary Keys | `id_<tabla>` SERIAL | `id_reserva`, `id_hotel` |
| Foreign Keys | `id_<tabla_referenciada>` | `id_cliente`, `id_hotel` |
| Timestamps | `fecha_creacion` / `fecha_actualizacion` | — |
| Índices | `idx_<tabla>_<columna>` | `idx_reservas_cliente` |

---

## Datos Semilla

El proyecto incluye 10 hoteles, 10 habitaciones, 10 clientes, 10 empleados, 11 usuarios (incluyendo admin), 10 servicios, 10 paquetes, 10 reservas y 10 pagos como datos de demostración.

Credenciales de prueba:
- **Admin**: `admin@alektours.com` / `Admin1234!`
- **Cliente**: `juanp` / `Cliente1234!`
- **Cliente**: `mariag` / `Cliente1234!`

> Ver `db_schema.sql` para el SQL completo con seeds.
