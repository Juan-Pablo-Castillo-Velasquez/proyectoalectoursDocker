# Documentación AlecTours

Bienvenido a la documentación completa del proyecto AlecTours - Sistema de Gestión Turística.

---

## 📚 Índice de Documentación

### Requisitos y Especificaciones

#### 📋 [Requisitos Funcionales](./requisitos-funcionales.md)
Descripción detallada de todas las funcionalidades que debe proveer el sistema, organizadas por módulos:

- Autenticación y Usuarios
- Hoteles y Habitaciones
- Reservas y Check-in/Check-out
- Clientes y Perfiles
- Paquetes Turísticos
- Pagos y Comprobantes
- Notificaciones
- Reseñas y Favoritos
- Destinos y Empresas
- Cancelaciones y Reembolsos
- Dashboard y Reportes
- Banners Promocionales

**Total:** 50 requisitos funcionales clasificados por prioridad

---

#### ⚙️ [Requisitos No Funcionales](./requisitos-no-funcionales.md)
Especificaciones de calidad, rendimiento y restricciones técnicas del sistema:

- **Rendimiento:** Tiempos de respuesta, optimización de imágenes, caché
- **Escalabilidad:** Usuarios concurrentes, crecimiento de datos
- **Seguridad:** Autenticación, cifrado, protección contra ataques
- **Disponibilidad:** Uptime, backup, recuperación ante fallos
- **Usabilidad:** Interfaz intuitiva, accesibilidad, responsive design
- **Mantenibilidad:** Código limpio, documentación, testing, logging
- **Portabilidad:** Contenedorización, independencia de plataforma
- **Confiabilidad:** Manejo de errores, validación, transacciones
- **Compatibilidad:** Navegadores, APIs, estándares
- **Observabilidad:** Métricas, trazabilidad, dashboards
- **Cumplimiento Legal:** Protección de datos, privacidad

**Total:** 46 requisitos no funcionales

---

#### 👥 [Historias de Usuario](./historias-de-usuario.md)
Historias de usuario organizadas por roles y épicas, siguiendo metodología ágil:

**Roles:**
- Cliente/Viajero (26 historias)
- Empleado (8 historias)
- Administrador (8 historias)

**Épicas:**
- EP-01: Autenticación y Registro
- EP-02: Búsqueda y Descubrimiento
- EP-03: Reservas
- EP-04: Pagos
- EP-05: Perfil de Usuario
- EP-06: Reseñas y Valoraciones
- EP-07: Favoritos
- EP-08: Notificaciones
- EP-09: Gestión de Hoteles
- EP-10: Gestión de Clientes
- EP-11: Reportes y Analytics
- EP-12: Paquetes Turísticos
- EP-13: Cancelaciones

**Total:** 42 historias de usuario con estimaciones y criterios de aceptación

---

### Documentación Técnica

#### 🏗️ Referencia Técnica
Ubicación: `./referencia-tecnica/`

Documentación técnica detallada sobre arquitectura, API, y decisiones técnicas del proyecto.

---

#### 📖 Conceptos
Ubicación: `./conceptos/`

Explicaciones de conceptos clave utilizados en el proyecto.

---

#### 🚀 Setup e Instalación
Ubicación: `./setup/`

Guías paso a paso para configurar el entorno de desarrollo y desplegar la aplicación.

---

## 🎯 Cómo Usar esta Documentación

### Para Product Owners y Stakeholders
- Comienza con [Historias de Usuario](./historias-de-usuario.md) para entender funcionalidades desde perspectiva del usuario
- Revisa [Requisitos Funcionales](./requisitos-funcionales.md) para visión completa del sistema
- Consulta el backlog priorizado en historias de usuario para planificación

### Para Desarrolladores
- Lee [Requisitos Funcionales](./requisitos-funcionales.md) para entender qué construir
- Revisa [Requisitos No Funcionales](./requisitos-no-funcionales.md) para estándares de calidad
- Consulta documentación técnica en `./referencia-tecnica/` para detalles de implementación

### Para Testers/QA
- Usa los criterios de aceptación en [Historias de Usuario](./historias-de-usuario.md)
- Verifica cumplimiento de [Requisitos Funcionales](./requisitos-funcionales.md)
- Valida [Requisitos No Funcionales](./requisitos-no-funcionales.md) como rendimiento y seguridad

### Para Arquitectos
- Estudia [Requisitos No Funcionales](./requisitos-no-funcionales.md) para decisiones arquitectónicas
- Revisa documentación en `./referencia-tecnica/` para entender arquitectura actual

---

## 📊 Resumen del Proyecto

### Alcance Funcional
- **Módulos:** 15 módulos funcionales principales
- **Requisitos Funcionales:** 50 requisitos clasificados
- **Historias de Usuario:** 42 historias con 202 story points estimados

### Estándares de Calidad
- **Requisitos No Funcionales:** 46 requisitos de calidad
- **Prioridad Crítica:** Seguridad, disponibilidad, backup
- **Objetivos de Rendimiento:** 
  - API < 200ms (p95)
  - Páginas < 2.5s LCP
  - Uptime 99.5%

### Metodología
- **Desarrollo Ágil:** Historias de usuario con criterios de aceptación
- **Priorización MoSCoW:** Must Have, Should Have, Could Have
- **Estimación:** Story points (1, 2, 3, 5, 8, 13)
- **Sprints:** 8 sprints planificados en backlog

---

## 🔄 Actualizaciones

Esta documentación se mantiene actualizada conforme evoluciona el proyecto.

**Última actualización:** Agosto 2026  
**Versión:** 1.0

---

## 📞 Contacto

Para consultas o sugerencias sobre esta documentación, contacta al equipo de AlecTours.

---

## 📝 Convenciones

### Nomenclatura de Requisitos
- **RF-XXX-NNN:** Requisito Funcional (XXX=módulo, NNN=número)
- **RNF-XXX-NNN:** Requisito No Funcional (XXX=categoría, NNN=número)
- **HU-NNN:** Historia de Usuario (NNN=número secuencial)
- **EP-NN:** Épica (NN=número)

### Niveles de Prioridad
- **Crítica:** Imprescindible para operación del sistema
- **Alta:** Necesario para funcionalidad core
- **Media:** Importante pero no bloqueante
- **Baja:** Deseable, mejora la experiencia

### Estados de Documentación
- ✅ **Completado:** Documento finalizado y revisado
- 🚧 **En Progreso:** Documento en desarrollo
- 📋 **Planificado:** Documento por crear

---

## 📂 Estructura de Carpetas

```
docs/
├── README.md (este archivo)
├── requisitos-funcionales.md ✅
├── requisitos-no-funcionales.md ✅
├── historias-de-usuario.md ✅
├── conceptos/
│   └── (documentos conceptuales)
├── referencia-tecnica/
│   └── (arquitectura, API, decisiones técnicas)
├── setup/
│   └── (guías de instalación)
└── Documentacion_Alektours/
    └── (documentación adicional)
```

---

**AlecTours** - Sistema de Gestión Turística  
*Plataforma moderna para descubrir destinos, reservar hoteles y gestionar experiencias de viaje*
