# Requisitos No Funcionales - AlecTours

**Versión:** 1.0  
**Fecha:** Agosto 2026  
**Proyecto:** Sistema de Gestión Turística AlecTours

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Rendimiento](#rendimiento)
3. [Escalabilidad](#escalabilidad)
4. [Seguridad](#seguridad)
5. [Disponibilidad](#disponibilidad)
6. [Usabilidad](#usabilidad)
7. [Mantenibilidad](#mantenibilidad)
8. [Portabilidad](#portabilidad)
9. [Confiabilidad](#confiabilidad)
10. [Compatibilidad](#compatibilidad)
11. [Observabilidad](#observabilidad)
12. [Cumplimiento Legal](#cumplimiento-legal)

---

## Introducción

Este documento especifica los requisitos no funcionales del sistema AlecTours, es decir, las características de calidad, restricciones técnicas y atributos de rendimiento que debe cumplir la plataforma.

### Propósito

Establecer los estándares de calidad, rendimiento y seguridad que garanticen una experiencia óptima para los usuarios y faciliten el mantenimiento del sistema a largo plazo.

### Alcance

Los requisitos no funcionales aplican a todos los componentes del sistema: frontend, backend, base de datos, infraestructura y servicios externos.

---

## Rendimiento

### RNF-PER-001: Tiempo de Respuesta de API
**Prioridad:** Alta  
**Descripción:** Los endpoints de la API deben responder en tiempos óptimos.

**Criterios de Aceptación:**
- Endpoints de lectura (GET): ≤ 200ms en el percentil 95
- Endpoints de escritura (POST/PUT): ≤ 500ms en el percentil 95
- Búsquedas complejas: ≤ 1 segundo en el percentil 95
- Tiempo de respuesta del health check: ≤ 50ms

**Métrica de Medición:**
- Prometheus + Grafana para monitoreo de latencia
- Registro de percentiles p50, p95, p99

---

### RNF-PER-002: Tiempo de Carga de Páginas
**Prioridad:** Alta  
**Descripción:** Las páginas del frontend deben cargar rápidamente.

**Criterios de Aceptación:**
- First Contentful Paint (FCP): ≤ 1.5 segundos
- Largest Contentful Paint (LCP): ≤ 2.5 segundos
- Time to Interactive (TTI): ≤ 3.5 segundos
- Cumulative Layout Shift (CLS): ≤ 0.1

**Métrica de Medición:**
- Google Lighthouse
- Web Vitals

---

### RNF-PER-003: Optimización de Imágenes
**Prioridad:** Media  
**Descripción:** Las imágenes deben estar optimizadas para carga rápida.

**Criterios de Aceptación:**
- Formato preferido: WebP con fallback a JPG
- Lazy loading implementado en todas las imágenes
- Imágenes responsive con múltiples resoluciones
- Compresión automática al subir imágenes
- Tamaño máximo por imagen: 500KB después de compresión

---

### RNF-PER-004: Caché
**Prioridad:** Alta  
**Descripción:** El sistema debe implementar estrategias de caché eficientes.

**Criterios de Aceptación:**
- Caché de listados populares: 10 minutos (Redis)
- Caché de destinos: 1 hora
- Caché de hoteles destacados: 30 minutos
- Caché de estadísticas de dashboard: 5 minutos
- Invalidación automática al actualizar datos

---

### RNF-PER-005: Compresión de Respuestas
**Prioridad:** Media  
**Descripción:** Las respuestas HTTP deben estar comprimidas.

**Criterios de Aceptación:**
- Compresión Gzip habilitada para respuestas > 1KB
- Nivel de compresión: 6 (balance entre velocidad y tamaño)
- Tipos MIME comprimidos: JSON, HTML, CSS, JavaScript

---

### RNF-PER-006: Paginación
**Prioridad:** Alta  
**Descripción:** Los listados deben implementar paginación eficiente.

**Criterios de Aceptación:**
- Tamaño de página predeterminado: 20 items
- Máximo de items por página: 100
- Respuesta incluye metadata: total, página actual, total de páginas
- Implementación mediante offset-limit con índices optimizados

---

## Escalabilidad

### RNF-ESC-001: Escalabilidad Horizontal
**Prioridad:** Alta  
**Descripción:** El sistema debe soportar escalabilidad horizontal.

**Criterios de Aceptación:**
- Backend stateless (sin estado en servidor)
- Sesiones almacenadas en Redis
- Capacidad de ejecutar múltiples instancias del backend
- Load balancer puede distribuir tráfico entre instancias
- No hay dependencias de sistema de archivos local

---

### RNF-ESC-002: Capacidad de Usuarios Concurrentes
**Prioridad:** Alta  
**Descripción:** El sistema debe soportar múltiples usuarios concurrentes.

**Criterios de Aceptación:**
- Mínimo 1,000 usuarios concurrentes sin degradación
- Objetivo: 5,000 usuarios concurrentes
- Manejo de 100 transacciones por segundo
- Pool de conexiones a BD: 20-50 conexiones

---

### RNF-ESC-003: Crecimiento de Datos
**Prioridad:** Media  
**Descripción:** El sistema debe manejar crecimiento de datos a largo plazo.

**Criterios de Aceptación:**
- Soporte para millones de registros de reservas
- Archivado automático de datos históricos (> 2 años)
- Índices optimizados en tablas de gran volumen
- Particionamiento de tablas si es necesario
- Estrategia de backup incremental

---

### RNF-ESC-004: Escalabilidad de Base de Datos
**Prioridad:** Media  
**Descripción:** La base de datos debe escalar según demanda.

**Criterios de Aceptación:**
- Réplica de lectura para consultas pesadas
- Índices en campos de búsqueda frecuente
- Consultas optimizadas con EXPLAIN
- Tiempo de respuesta de queries < 100ms
- Connection pooling configurado

---

## Seguridad

### RNF-SEG-001: Autenticación y Autorización
**Prioridad:** Crítica  
**Descripción:** El sistema debe implementar autenticación y autorización robustas.

**Criterios de Aceptación:**
- Autenticación basada en JWT con expiración de 30 minutos
- Contraseñas hasheadas con bcrypt (cost factor 12)
- SECRET_KEY mínimo de 48 caracteres
- Validación de permisos en cada endpoint protegido
- Refresh tokens para renovación segura
- Logout invalida tokens activos

---

### RNF-SEG-002: Protección contra Ataques
**Prioridad:** Crítica  
**Descripción:** El sistema debe estar protegido contra ataques comunes.

**Protecciones Implementadas:**
- **Rate Limiting:** 
  - Login: 5 intentos/minuto por IP
  - Registro: 5 intentos/minuto por IP
  - API general: 100 requests/minuto por usuario
  - Pagos: 10 intentos/minuto por usuario
- **SQL Injection:** Uso de ORM (SQLAlchemy) con queries parametrizadas
- **XSS:** Sanitización de inputs y Content Security Policy
- **CSRF:** Tokens CSRF en formularios
- **DDoS:** Limitación de tasa a nivel de servidor

---

### RNF-SEG-003: Cifrado de Datos
**Prioridad:** Crítica  
**Descripción:** Los datos sensibles deben estar cifrados.

**Criterios de Aceptación:**
- Comunicación HTTPS obligatoria en producción (TLS 1.3)
- HSTS header habilitado (max-age=63072000)
- Contraseñas nunca almacenadas en texto plano
- Datos de tarjetas tokenizados (no se almacenan datos completos)
- Datos personales sensibles cifrados en BD si aplica

---

### RNF-SEG-004: Validación de Datos
**Prioridad:** Alta  
**Descripción:** Todos los inputs deben ser validados.

**Criterios de Aceptación:**
- Validación en backend con Pydantic schemas
- Validación de tipos de dato
- Validación de rangos y formatos
- Sanitización de strings para prevenir injection
- Rechazo de payloads con datos extra no esperados

---

### RNF-SEG-005: Headers de Seguridad
**Prioridad:** Alta  
**Descripción:** El sistema debe incluir headers HTTP de seguridad.

**Headers Implementados:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`

---

### RNF-SEG-006: Gestión de Sesiones
**Prioridad:** Alta  
**Descripción:** Las sesiones deben gestionarse de forma segura.

**Criterios de Aceptación:**
- Tokens JWT con expiración corta (30 minutos)
- No almacenar datos sensibles en tokens
- Invalidación de token al cambiar contraseña
- Registro de actividad sospechosa
- Cierre de sesión automático por inactividad (opcional)

---

### RNF-SEG-007: Auditoría
**Prioridad:** Media  
**Descripción:** El sistema debe registrar actividades críticas.

**Eventos Auditados:**
- Inicio de sesión exitoso/fallido
- Cambios en datos sensibles
- Creación/modificación/cancelación de reservas
- Cambios de roles y permisos
- Acciones administrativas críticas

**Información Registrada:**
- Usuario que realizó la acción
- Timestamp
- IP de origen
- Acción realizada
- Datos antes y después (si aplica)

---

## Disponibilidad

### RNF-DIS-001: Uptime del Sistema
**Prioridad:** Alta  
**Descripción:** El sistema debe mantener alta disponibilidad.

**Criterios de Aceptación:**
- Uptime objetivo: 99.5% (aproximadamente 3.6 horas de downtime/mes)
- Disponibilidad medida en ventanas de 30 días
- Mantenimientos planificados en horarios de baja demanda
- Notificación anticipada de mantenimientos (48 horas)

---

### RNF-DIS-002: Recuperación ante Fallos
**Prioridad:** Alta  
**Descripción:** El sistema debe recuperarse rápidamente de fallos.

**Criterios de Aceptación:**
- RTO (Recovery Time Objective): ≤ 1 hora
- RPO (Recovery Point Objective): ≤ 15 minutos
- Healthcheck endpoints para monitoreo automático
- Auto-reinicio de servicios caídos
- Alertas automáticas de servicios caídos

---

### RNF-DIS-003: Backup y Restauración
**Prioridad:** Crítica  
**Descripción:** El sistema debe tener respaldos regulares.

**Criterios de Aceptación:**
- Backup completo diario de base de datos
- Backup incremental cada 6 horas
- Retención de backups: 30 días
- Backups almacenados en ubicación geográfica diferente
- Pruebas de restauración mensuales
- Documentación de procedimiento de restauración

---

### RNF-DIS-004: Tolerancia a Fallos
**Prioridad:** Media  
**Descripción:** El sistema debe tolerar fallos parciales.

**Criterios de Aceptación:**
- Fallback para servicios externos no críticos
- Degradación graceful (funcionalidad reducida vs error total)
- Circuit breaker para servicios externos
- Reintentos automáticos con backoff exponencial
- Mensajes de error informativos al usuario

---

## Usabilidad

### RNF-USA-001: Interfaz Intuitiva
**Prioridad:** Alta  
**Descripción:** La interfaz debe ser fácil de usar.

**Criterios de Aceptación:**
- Navegación clara con máximo 3 clics para acción principal
- Mensajes de error claros y accionables
- Feedback visual inmediato en acciones
- Consistencia en diseño y patrones de interacción
- Tooltips y ayuda contextual donde sea necesario

---

### RNF-USA-002: Accesibilidad
**Prioridad:** Alta  
**Descripción:** El sistema debe ser accesible para personas con discapacidades.

**Criterios de Aceptación:**
- Cumplimiento WCAG 2.1 Nivel AA
- Contraste de colores mínimo 4.5:1
- Navegación completa por teclado
- Etiquetas ARIA en elementos interactivos
- Imágenes con texto alternativo descriptivo
- Formularios con labels asociados

---

### RNF-USA-003: Diseño Responsivo
**Prioridad:** Alta  
**Descripción:** La interfaz debe adaptarse a diferentes dispositivos.

**Criterios de Aceptación:**
- Diseño móvil-first
- Breakpoints: móvil (< 768px), tablet (768-1024px), desktop (> 1024px)
- Touch-friendly (botones mínimo 44x44px)
- Menú colapsable en móvil
- Imágenes responsive con srcset

---

### RNF-USA-004: Internacionalización
**Prioridad:** Baja  
**Descripción:** El sistema debe soportar múltiples idiomas.

**Criterios de Aceptación:**
- Idioma por defecto: Español
- Soporte para inglés como idioma secundario
- Formato de fechas según locale
- Formato de moneda según locale
- Traducción de mensajes de error

---

### RNF-USA-005: Experiencia de Usuario
**Prioridad:** Media  
**Descripción:** La experiencia debe ser fluida y agradable.

**Criterios de Aceptación:**
- Animaciones suaves (< 300ms)
- Estados de carga con indicadores visuales
- Confirmación de acciones destructivas
- Autocompletado en campos de búsqueda
- Guardado automático en formularios largos (opcional)

---

## Mantenibilidad

### RNF-MAN-001: Código Limpio
**Prioridad:** Alta  
**Descripción:** El código debe ser mantenible y legible.

**Criterios de Aceptación:**
- Convenciones de estilo: Python (PEP 8), TypeScript (ESLint)
- Nombres descriptivos de variables y funciones
- Funciones con responsabilidad única
- Máximo 200 líneas por función/componente
- Comentarios solo donde sea necesario (código autoexplicativo)

---

### RNF-MAN-002: Documentación
**Prioridad:** Alta  
**Descripción:** El sistema debe estar bien documentado.

**Documentación Requerida:**
- README con instrucciones de instalación
- Documentación de API (OpenAPI/Swagger)
- Diagramas de arquitectura
- Guías de despliegue
- Documentación de base de datos (ERD)
- Comentarios en código complejo
- Changelog de versiones

---

### RNF-MAN-003: Testing
**Prioridad:** Alta  
**Descripción:** El código debe tener cobertura de tests adecuada.

**Criterios de Aceptación:**
- Cobertura mínima: 70%
- Tests unitarios para lógica de negocio crítica
- Tests de integración para endpoints principales
- Tests E2E para flujos críticos
- CI/CD ejecuta tests automáticamente
- Tests no deben tomar más de 10 minutos en ejecutar

---

### RNF-MAN-004: Versionamiento
**Prioridad:** Alta  
**Descripción:** El código debe seguir buenas prácticas de versionamiento.

**Criterios de Aceptación:**
- Control de versiones con Git
- Versionamiento semántico (MAJOR.MINOR.PATCH)
- Commits descriptivos siguiendo conventional commits
- Ramas: main (producción), develop (desarrollo), feature/* (features)
- Pull requests obligatorios para merge a main
- Tags en releases

---

### RNF-MAN-005: Logging
**Prioridad:** Alta  
**Descripción:** El sistema debe registrar eventos importantes.

**Criterios de Aceptación:**
- Niveles de log: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Logs estructurados (JSON)
- Rotación de logs diaria
- Retención de logs: 30 días
- Logs no contienen información sensible
- Correlación de logs con request ID

---

### RNF-MAN-006: Monitoreo
**Prioridad:** Alta  
**Descripción:** El sistema debe ser fácil de monitorear.

**Métricas Monitoreadas:**
- CPU, memoria, disco del servidor
- Latencia de endpoints (p50, p95, p99)
- Tasa de errores (4xx, 5xx)
- Número de requests por segundo
- Tiempo de respuesta de base de datos
- Estado de servicios externos
- Alertas automáticas en Prometheus/Grafana

---

## Portabilidad

### RNF-POR-001: Contenedorización
**Prioridad:** Alta  
**Descripción:** El sistema debe ejecutarse en contenedores.

**Criterios de Aceptación:**
- Dockerfile para backend y frontend
- docker-compose para desarrollo local
- Imágenes optimizadas (multi-stage builds)
- Variables de entorno para configuración
- No hard-coding de URLs o configuraciones

---

### RNF-POR-002: Independencia de Plataforma
**Prioridad:** Media  
**Descripción:** El sistema debe ejecutarse en diferentes plataformas.

**Criterios de Aceptación:**
- Compatible con Linux, macOS, Windows (vía Docker)
- No dependencias de software propietario
- Uso de estándares abiertos
- Base de datos portable (PostgreSQL)

---

### RNF-POR-003: Despliegue
**Prioridad:** Alta  
**Descripción:** El sistema debe ser fácil de desplegar.

**Criterios de Aceptación:**
- Script automatizado de despliegue
- Documentación clara de requisitos
- Migración de BD automática (Alembic)
- Variables de entorno documentadas
- Health checks para validar despliegue

---

## Confiabilidad

### RNF-CON-001: Manejo de Errores
**Prioridad:** Alta  
**Descripción:** El sistema debe manejar errores de forma robusta.

**Criterios de Aceptación:**
- Try-catch en operaciones críticas
- Mensajes de error descriptivos al usuario
- Logging detallado de errores para debugging
- Códigos de estado HTTP apropiados
- No exposición de stack traces en producción

---

### RNF-CON-002: Validación de Datos
**Prioridad:** Alta  
**Descripción:** Los datos deben ser validados exhaustivamente.

**Criterios de Aceptación:**
- Validación en frontend y backend
- Validación de tipos, formatos y rangos
- Validación de integridad referencial
- Mensajes de validación claros
- Prevención de estados inconsistentes

---

### RNF-CON-003: Transacciones
**Prioridad:** Alta  
**Descripción:** Las operaciones críticas deben ser transaccionales.

**Criterios de Aceptación:**
- Uso de transacciones de BD en operaciones multi-tabla
- Rollback automático en caso de error
- Isolation level apropiado
- Manejo de deadlocks
- Idempotencia en operaciones críticas

---

## Compatibilidad

### RNF-COM-001: Navegadores Soportados
**Prioridad:** Alta  
**Descripción:** El frontend debe funcionar en navegadores modernos.

**Navegadores Soportados:**
- Chrome/Edge: últimas 2 versiones
- Firefox: últimas 2 versiones
- Safari: últimas 2 versiones
- Opera: últimas 2 versiones

**No Soportados:**
- Internet Explorer

---

### RNF-COM-002: APIs y Estándares
**Prioridad:** Alta  
**Descripción:** El backend debe seguir estándares de API REST.

**Criterios de Aceptación:**
- Convenciones REST para endpoints
- JSON como formato de intercambio
- Códigos de estado HTTP estándar
- Versionamiento de API (/api/v1/)
- CORS configurado correctamente

---

## Observabilidad

### RNF-OBS-001: Métricas
**Prioridad:** Alta  
**Descripción:** El sistema debe exponer métricas de operación.

**Métricas Expuestas:**
- Endpoint `/metrics` en formato Prometheus
- Histogramas de latencia por endpoint
- Contadores de requests por status code
- Métricas de negocio (reservas/hora, ingresos)
- Métricas de sistema (CPU, memoria)

---

### RNF-OBS-002: Trazabilidad
**Prioridad:** Media  
**Descripción:** Las operaciones deben ser trazables.

**Criterios de Aceptación:**
- Request ID único por petición
- Propagación de trace context
- Correlación de logs entre servicios
- Registro de operaciones críticas con contexto completo

---

### RNF-OBS-003: Dashboards
**Prioridad:** Media  
**Descripción:** El sistema debe tener dashboards de monitoreo.

**Dashboards Implementados:**
- Dashboard de API (latencia, throughput, errores)
- Dashboard de negocio (reservas, ingresos)
- Dashboard de infraestructura (recursos)
- Alertas configuradas para métricas críticas

---

## Cumplimiento Legal

### RNF-LEG-001: Protección de Datos Personales
**Prioridad:** Crítica  
**Descripción:** El sistema debe proteger datos personales según regulaciones.

**Criterios de Aceptación:**
- Aviso de privacidad visible
- Consentimiento explícito para uso de datos
- Derecho al olvido implementado
- Exportación de datos personales
- Cifrado de datos sensibles
- Registro de acceso a datos personales

---

### RNF-LEG-002: Términos y Condiciones
**Prioridad:** Alta  
**Descripción:** El sistema debe presentar términos y condiciones claros.

**Criterios de Aceptación:**
- Términos accesibles antes del registro
- Aceptación explícita requerida
- Versiones de términos versionadas
- Notificación de cambios en términos

---

### RNF-LEG-003: Cookies y Rastreo
**Prioridad:** Alta  
**Descripción:** El uso de cookies debe cumplir con regulaciones.

**Criterios de Aceptación:**
- Banner de consentimiento de cookies
- Categorización de cookies (esenciales, analytics, marketing)
- Opt-in para cookies no esenciales
- Documentación de cookies utilizadas

---

## Matriz de Prioridades

| Prioridad | Cantidad | Porcentaje |
|-----------|----------|------------|
| Crítica   | 6        | 13%        |
| Alta      | 30       | 65%        |
| Media     | 9        | 20%        |
| Baja      | 1        | 2%         |

---

## Convenciones de Nomenclatura

- **RNF-XXX-NNN**: Requisito No Funcional
  - **XXX**: Categoría (PER=Rendimiento, SEG=Seguridad, etc.)
  - **NNN**: Número secuencial (001, 002, etc.)

---

## Control de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Agosto 2026 | Equipo AlecTours | Versión inicial |

---

**Fin del Documento**
