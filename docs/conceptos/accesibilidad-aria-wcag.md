# Accesibilidad Web — ARIA y WCAG (AlecTours)

> **Estándar de referencia**: [WCAG 2.1 — W3C](https://www.w3.org/TR/WCAG21/)
> **Especificación ARIA**: [WAI-ARIA 1.2 — W3C](https://www.w3.org/TR/wai-aria-1.2/)

---

## ¿Qué es la Accesibilidad Web?

La accesibilidad web garantiza que **todas las personas** puedan usar aplicaciones web,
independientemente de sus capacidades. Esto incluye personas que:

- Usan **lectores de pantalla** (NVDA, VoiceOver, JAWS) por discapacidad visual
- Navegan **solo con teclado** (sin ratón) por limitaciones motrices
- Tienen **daltonismo** y no pueden distinguir colores como información
- Usan **software de amplificación** por baja visión
- Tienen **dislexia** u otras diferencias cognitivas

### Los 4 principios WCAG — POUR

| Principio          | Descripción                                                       | Ejemplo                                         |
| ------------------ | ----------------------------------------------------------------- | ----------------------------------------------- |
| **P**erceptible    | La info debe presentarse de forma que el usuario pueda percibirla | Alt text en imágenes, contraste de colores      |
| **O**perable       | Los componentes deben ser operables por el usuario                | Navegación por teclado, sin trampas de foco     |
| **U**nderstandable | La información y UI deben ser comprensibles                       | Labels en formularios, mensajes de error claros |
| **R**obust         | El contenido debe interpretarse por tecnologías asistivas         | HTML semántico, ARIA roles                      |

---

## Niveles de Conformidad WCAG

| Nivel   | Descripción                                                            | Ejemplos de criterios                            |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| **A**   | Requisito mínimo — sin esto, el contenido es completamente inaccesible | Alternativas textuales (1.1.1), teclado (2.1.1)  |
| **AA**  | Estándar recomendado para la mayoría de sitios                         | Contraste 4.5:1 (1.4.3), reflow (1.4.10)         |
| **AAA** | Máxima accesibilidad — difícil de cumplir en todos los contenidos      | Contraste 7:1 (1.4.6), lenguaje de señas (1.2.6) |

> **Objetivo de este proyecto**: Conformidad **WCAG 2.1 AA** — el nivel exigido por
> regulaciones gubernamentales. El proyecto habilita **eslint-plugin-jsx-a11y** para
> detectar problemas de accesibilidad en desarrollo (configurado como warning, no blocker).

---

## ¿Qué es ARIA?

**ARIA** (Accessible Rich Internet Applications) es una especificación del W3C que
añade semántica adicional al HTML para describir comportamientos interactivos que
HTML nativo no puede expresar por sí solo.

```html
<!-- HTML nativo — el navegador ya sabe que esto es un botón -->
<button>Enviar</button>

<!-- ARIA necesario — un div actuando como botón necesita rol explícito -->
<div role="button" tabindex="0" onclick="...">Enviar</div>

<!-- ARIA para estado dinámico — no existe en HTML nativo -->
<button aria-busy="true">Guardando...</button>
<input aria-invalid="true" aria-describedby="email-error" />
```

### Regla de oro: **Primero HTML semántico**

> Usar ARIA solo cuando HTML nativo no es suficiente.
> `<button>` es mejor que `<div role="button">`.
> `<nav>` es mejor que `<div role="navigation">`.

---

## Estado de Accesibilidad — AlecTours

El proyecto usa **shadcn/ui sobre Radix UI**. Radix inyecta automáticamente la
mayoría de los atributos ARIA críticos (roles, `aria-expanded`, `aria-controls`,
`aria-modal`, `aria-labelledby`) y gestiona el foco (focus trap, Escape para cerrar,
restauración de foco) en diálogos, menús, popovers y sheets.

### Resumen por área

| Área | Patrón usando | Nivel | Notas |
|---|---|---|---|
| `ui/` (42 componentes shadcn) | Radix primitives | ✅ AA | ARIA + focus gestionados por Radix |
| `hotel/HotelCard.tsx` | `aria-label` + `aria-pressed` | ✅ AA | Botón de favoritos accesible |
| `BannersPromocionales.tsx` | `aria-label` en carrusel | ✅ AA | Navegación del banner |
| `Login/Register/ResetPassword` | `aria-label` + `onKeyDown` Enter | ✅ AA | Toggle de contraseña accesible |
| `form.tsx` | `htmlFor` + `aria-describedby` | ✅ AA | Asociación label→input |
| `theme.css` | Contraste WCAG AA | ✅ AA | `--muted-foreground` ajustado a 4.5:1 |
| `WhatsAppButton.tsx` | `aria-hidden` en SVG decorativo | ✅ AA | Ícono decorativo |
| `Alert.tsx` | `role="alert"` | ✅ AA | Mensajes de error anunciados |
| `ReservationLoader.tsx` | `aria-live="polite"` | ✅ AA | Estado de carga anunciado |

---

## Implementaciones por criterio WCAG

---

### WCAG 1.1.1 — Non-text Content (Nivel A)

**¿Qué?** Todo contenido no textual debe tener una alternativa textual.

**Implementación en `WhatsAppButton.tsx`** — Íconos decorativos ocultados del
árbol de accesibilidad:

```tsx
{/* ✅ aria-hidden="true" oculta el ícono decorativo del AT */}
<svg aria-hidden="true" ...>  {/* El texto del enlace ya comunica */}
  <path ... />
</svg>
```

**Implementación en `HotelCard.tsx`** — Botón de favoritos con solo ícono necesita
`aria-label` (el ícono es EL ÚNICO contenido):

```tsx
<button
  aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
  aria-pressed={isFavorite}
  onClick={toggleFavorite}
>
  <Heart />
</button>
```

**Regla práctica**: Un ícono es "decorativo" si el texto adyacente ya comunica lo mismo
→ `aria-hidden="true"`. Si el ícono es el ÚNICO contenido del botón → necesita `aria-label`.

---

### WCAG 1.3.1 — Info and Relationships (Nivel A)

**¿Qué?** La información, estructura y relaciones deben ser determinables programáticamente.

**Landmarks semánticos** presentes:
- `<main>` en `faq.tsx`, `SearchResults.tsx`, `Profile.tsx`, `Admindashboard.tsx`
- `<nav>` en `AdminSidebar.tsx`, `ProfileSidebar.tsx`, `HotelDetail.tsx`, `ui/breadcrumb.tsx`
- `<footer>` en `Footer.tsx`
- `<header>` en `AdminHeader.tsx`

**Asociación label→input en `ui/form.tsx`**:

```tsx
{/* ✅ htmlFor + id asocian el label con su input */}
<label htmlFor={formItemId}>{children}</label>
<input
  id={formItemId}
  aria-describedby={errorMessageId || descriptionId}
  aria-invalid={!!error}
/>
```

---

### WCAG 1.4.1 — Use of Color (Nivel A)

**¿Qué?** El color no debe ser el ÚNICO medio para transmitir información.

**Patrón seguro**: Cualquier badge de estado indica la condición con **texto** y
`aria-label`, no solo con color:

```tsx
{/* ✅ El texto + aria-label cumplen 1.4.1, el color es refuerzo visual */}
<span
  className="... bg-green-100 text-green-800 ..."
  aria-label={`Estado: Activo`}
>
  Activo
</span>
```

**❌ Patrón inseguro** (no hagas esto):
```tsx
{/* Solo color — inaccesible para daltónicos y lectores de pantalla */}
<span className={activo ? "bg-green-500" : "bg-red-500"} />;
```

---

### WCAG 1.4.3 — Contrast (Nivel AA)

**¿Qué?** El texto debe tener contraste suficiente: mínimo **4.5:1** para texto normal.

**Implementación en `theme.css`** — El color `--muted-foreground` (#73686a) fue
deliberadamente oscurecido para pasar contraste AA sobre fondos `--muted`, con el
comentario documentando la verificación por luminancia relativa:

```css
/* Comentario en theme.css:
   --muted-foreground oscurecido deliberadamente para
   pasar WCAG AA (4.5:1) sobre fondos --muted */
```

**Paletas del proyecto (Checkout hero sobre blanco):**
```
#6e1832 (granate) sobre white  → contraste alto ✅ AA
#111827 (texto) sobre white    → ~16:1 ✅ AAA
#b8912e (gold) sobre white     → verificar contraste para texto pequeño
```

> Herramienta: https://webaim.org/resources/contrastchecker/

---

### WCAG 1.4.10 — Reflow (Nivel AA)

**¿Qué?** El contenido debe reordenarse sin pérdida de información a 320px de ancho.

El proyecto usa **Tailwind responsive utilities** (`sm:`, `md:`, `lg:`, grid, flex
con wrap) en toda la app, permitiendo reflow. Se debe verificar que ningún diálogo
o tabla horizontal supere el viewport en móvil.

---

### WCAG 2.4.1 — Bypass Blocks (Nivel A)

**¿Qué?** Debe existir un mecanismo para saltar bloques repetitivos (la navbar).

**Estado actual**: Los landmarks `<main>` y `<nav aria-label>` ayudan a los lectores
de pantalla. ✅ Verificar **skip link**.

**⚠️ Gap detectado**: No hay *skip-to-content link* (`<a href="#main-content">`) ni
`id="main-content"` consistente. Considerar añadir:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50"
>
  Saltar al contenido
</a>
<main id="main-content">...</main>
```

**`Navbar.tsx`**: Usa `<motion.button>` para el menú móvil sin `aria-expanded`.
Recomendación: añadir `aria-expanded={menuOpen}` y `aria-controls="mobile-menu"`.

---

### WCAG 2.1.1 — Keyboard (Nivel A)

**¿Qué?** Toda la funcionalidad debe ser operable por teclado.

**Implementación en `ui/carousel.tsx`** — Navegación con flechas:

```tsx
handleKeyDown(e) {
  if (e.key === "ArrowLeft") prev();
  if (e.key === "ArrowRight") next();
}
<CarouselContent onKeyDownCapture={handleKeyDown} />
```

**Implementación en formularios** — Enter dispara acciones:

```tsx
// Login.tsx — Enter en "olvidé contraseña"
<button onKeyDown={(e) => e.key === "Enter" && handleForgot()}>...</button>
```

**Focus rings**: toda la app usa `focus-visible:*` (Tailwind) y clases como
`focus:ring-2 focus:ring-primary` para que el foco del teclado sea **visible**.

---

### WCAG 2.1.2 / Focus management (Nivel A)

**¿Qué?** El foco no debe quedar atrapado y debe restaurarse al cerrar.

**Vía Radix** (shadcn): `dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`, `dropdown-menu.tsx`,
`popover.tsx`, `command.tsx`, `sidebar.tsx` — Radix gestiona focus trap, Escape para
cerrar y restauración de foco automáticamente.

**⚠️ Gap en modales hechos a mano** (`LoginModal`, `RegisterModal`, `TerminosModal`,
`PrivacidadModal`, `ModalCancelacion`, `ModalResena`):
- Solo bloquean el scroll (`document.body.style.overflow`)
- **No** tienen `role="dialog"` / `aria-modal` / `aria-labelledby`
- **No** implementan focus trap ni restauración de foco ni cierre con Escape

**Buen patrón de referencia (Radix `ui/dialog.tsx`)** — hace esto automáticamente:

```tsx
<DialogPrimitive.Root>      {/* Radix: focus trap + Escape + restore */}
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay />
    <DialogPrimitive.Content>  {/* role="dialog" aria-modal + aria-labelledby */}
      <DialogPrimitive.Title>...</DialogPrimitive.Title>
      <DialogPrimitive.Description>...</DialogPrimitive.Description>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
```

> **Recomendación**: Migrar los modales hechos a mano a `ui/dialog.tsx` para heredar
> el manejo de foco y ARIA de Radix.

---

### WCAG 3.3.1 / 4.1.2 — Error identification y Name Role Value (Nivel A)

**¿Qué?** Los errores deben identificarse y notificarse programáticamente.

**Implementación en `ui/form.tsx`**:

```tsx
<input
  aria-invalid={!!error}                      // 4.1.2: estado de validación
  aria-describedby={descriptionId || errorId} // conecta input con su error
/>

{error && <p id={errorId} className="text-destructive">...</p>}
```

**Implementación en `ui/alert.tsx`** — mensajes de alerta:

```tsx
<div role="alert" className="...">  {/* anuncia el error cuando cambia (role=alert = aria-live assertive) */}
  {message}
</div>
```

---

### WCAG 4.1.3 / 2.4.4 — Status messages (Nivel AA)

**¿Qué?** Los mensajes de estado (cargas, confirmaciones) deben notificarse a AT sin
necesidad de enfocar.

**Implementación en `ReservationLoader.tsx`** — estado de carga de reserva:

```tsx
<div aria-live="polite">  {/* polite: espera a que el usuario termine de leer */}
  <p>Procesando tu reserva...</p>
</div>
```

**Diferencia entre `aria-live` values:**

| Valor | Comportamiento | Cuándo usar |
|-------|---------------|-------------|
| `polite` | Espera a que el usuario termine de leer | Mensajes de estado no urgentes |
| `assertive` | Interrumpe inmediatamente | Errores críticos (no abusar) |
| `off` | No anuncia cambios | Contenido que se actualiza frecuentemente |

---

## Elementos sr-only

El proyecto usa la clase **Tailwind `sr-only`** (y `focus:not-sr-only`) en lugar de un
componente dedicado:

```tsx
{/* Visible solo para AT — invisible visualmente */}
<span className="sr-only">Acciones</span>

{/* Equivalente CSS (definido en tailwind.css): */}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Ejemplos en el código: `RegisterModal.tsx` (checkbox de términos), `ui/carousel.tsx`
(labels "Anterior/Siguiente"), `ui/dialog.tsx` / `ui/sheet.tsx` / `ui/sidebar.tsx`
(botón "Cerrar"), `Personalization.tsx` (radio input detrás de label custom).

---

## Herramientas de Testing de Accesibilidad

### Automáticas

| Herramienta | Tipo | Qué detecta |
|---|---|---|
| `eslint-plugin-jsx-a11y` | ESLint | ~57% de issues (configurado en eslint.config.js como warning) |
| [axe DevTools](https://www.deque.com/axe/) | Extensión navegador | Issues automáticos |
| [WAVE](https://wave.webaim.org/) | Extensión / online | Errores, alertas, estructura |
| [Lighthouse](https://developers.google.com/web/tools/lighthouse) | Chrome DevTools | Score de accesibilidad |
| `@axe-core/react` | Librería | Detecta en dev mode |

> **Importante**: Las herramientas automáticas solo detectan ~30-40% de los problemas
> reales. El testing manual con lectores de pantalla reales es indispensable.

### Manuales

```bash
# Test básico de navegación por teclado:
# 1. Abrir la app en el navegador
# 2. Presionar Tab repetidamente — verificar que:
#    - Cada elemento interactivo recibe foco
#    - El foco es visible (outline)
#    - El orden de foco es lógico (top-left → bottom-right)
#    - No hay "trampas de foco" (loops infinitos)

# Test con lector de pantalla (macOS):
# Activar: Cmd + F5 para VoiceOver

# Test con lector de pantalla (Windows):
# NVDA (gratis): https://www.nvaccess.org/download/
# Activar: Control + Alt + N
```

---

## Checklist de Accesibilidad — Para Pull Requests

Antes de hacer merge de cualquier PR con cambios de UI:

- [ ] ¿Todos los `<img>` tienen `alt`? (vacío `alt=""` para decorativas)
- [ ] ¿Todos los íconos decorativos tienen `aria-hidden="true"`?
- [ ] ¿Todos los botones con solo ícono tienen `aria-label`? (ej. favoritos en HotelCard)
- [ ] ¿Todos los `<input>` tienen `<label>` asociada con `htmlFor`? (usar `ui/form.tsx`)
- [ ] ¿Los mensajes de error usan `role="alert"` o `aria-live`?
- [ ] ¿Los estados de carga usan `role="status"` o `aria-live`? (ej. ReservationLoader)
- [ ] ¿Las regiones principales tienen landmarks semánticos (`<main>`, `<nav>`, `<header>`)?
- [ ] ¿El foco es visible (`focus-visible:ring`, `focus:ring-2`)?
- [ ] ¿El color no es el único indicador de información (`1.4.1`)?
- [ ] ¿La jerarquía de headings es correcta (`<h1>` → `<h2>` → `<h3>`)?
- [ ] ¿Los toggle buttons tienen `aria-pressed`? (ej. favoritos, tema)
- [ ] ¿Se puede completar todo el flujo solo con teclado?
- [ ] ¿El menú móvil de la Navbar tiene `aria-expanded` / `aria-controls`?

**Deuda pendiente conocida**:
1. No hay skip-to-content link
2. Los modales hechos a mano (LoginModal, RegisterModal, TerminosModal, etc.) carecen
   de `role="dialog"`/`aria-modal`/`aria-labelledby`, focus trap y cierre con Escape
3. Muchos `<label>` de formularios carecen de `htmlFor`
4. Navbar mobile menu toggle sin `aria-expanded`

---

## Recursos de Aprendizaje

| Recurso | URL | Para qué |
|---|---|---|
| WCAG 2.1 Quick Reference | https://www.w3.org/WAI/WCAG21/quickref/ | Criterios filtrables por nivel |
| WAI-ARIA Authoring Practices | https://www.w3.org/WAI/ARIA/apg/ | Patrones de diseño accesible con ejemplos |
| A11y Project Checklist | https://www.a11yproject.com/checklist/ | Checklist práctica |
| MDN ARIA | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA | Referencia completa |
| Radix UI primitives | https://www.radix-ui.com/ | Automatiza ARIA + focus |

---

> **Conclusión pedagógica**: La accesibilidad no es una característica extra que se añade
> al final — es una **forma de construir** que beneficia a todos. En AlecTours, el uso de
> **Radix+shadcn** cubre gran parte del trabajo de forma automática (diálogos, menús,
> focus), pero los componentes hechos a mano (modales, navbar) requieren cuidado manual.
> `<button>` en lugar de `<div onClick>` es más fácil, más semántico y más accesible.
