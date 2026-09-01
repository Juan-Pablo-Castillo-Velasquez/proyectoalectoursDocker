# Design System — AlecTours

---

## 1. Identidad Visual

AlecTours usa una paleta de colores basada en tonos granate/borgoña que transmite sofisticación y confianza para una plataforma turística.

### Colores de Marca

| Token | Hex | Uso |
|---|---|---|
| Primary (Granate) | `#6e1832` | Botones primarios, links, acentos |
| Primary Light (dark mode) | `#c24d6e` | Variante clara para modo oscuro |
| Gold | `#b8912e` | Badges premium, estrellas, acentos dorados |

### Paleta Completa

| Variable | Light Mode | Dark Mode |
|---|---|---|
| `--background` | `#fbf8f6` (bone) | `#0f0f10` |
| `--foreground` | `#1a0a10` | `#f0ebe8` |
| `--card` | `#ffffff` | `#18181b` |
| `--primary` | `#6e1832` | `#c24d6e` |
| `--primary-foreground` | `#ffffff` | `#ffffff` |
| `--secondary` | `#f5f0ec` | `#27272a` |
| `--muted` | `#f0ebe8` | `#27272a` |
| `--accent` | `#b8912e` | `#d4a940` |
| `--destructive` | `#dc2626` | `#f87171` |
| `--border` | `#e8e0da` | `#2a2a2e` |
| `--ring` | `#6e1832` | `#c24d6e` |

---

## 2. Stack de Estilos

| Tecnología | Versión | Propósito |
|---|---|---|
| Tailwind CSS | 4.1.12 | Utility-first CSS framework |
| `@tailwindcss/vite` | — | Plugin Vite para Tailwind 4 |
| `tw-animate-css` | 1.3.8 | Animaciones Tailwind |
| shadcn/ui | — | Componentes base (Radix UI) |
| MUI | 7.3.5 | Componentes complejos (admin) |
| `@emotion/react` + `@emotion/styled` | — | CSS-in-JS para MUI |

---

## 3. Tema Claro / Oscuro

### Implementación

- **Toggle**: `ThemeToggle.tsx` — alterna clase `.dark` en `<html>`
- **Persistencia**: `localStorage` key `"theme"`
- **Fallback**: `prefers-color-scheme: dark` del sistema
- **Variant dark**: `@custom-variant dark (&:is(.dark *))` en Tailwind

### Archivos CSS

| Archivo | Contenido |
|---|---|
| `src/styles/theme.css` | Variables CSS, utilidades `.card-elevated`, `.btn-primary-depth`, `.badge-gold`, etc. |
| `src/styles/tailwind.css` | Configuración Tailwind con `@source` y dark variant |
| `src/styles/index.css` | Master CSS con imports de fonts, tailwind, theme |
| `src/styles/fonts.css` | Fuentes (Google Fonts CDN en `index.html`) |

---

## 4. Utilidades CSS del Proyecto

| Clase | Propósito |
|---|---|
| `.card-elevated` | Tarjeta con sombra elevada y borde sutil |
| `.btn-primary-depth` | Botón primario con efecto de profundidad |
| `.badge-gold` | Badge dorado premium |
| `.hero-brand` | Gradiente de hero con colores de marca |
| `.navbar-surface` | Superficie de navbar con blur |
| `.footer-brand` | Estilo de footer con colores de marca |
| `.banner-textured` | Banner con textura de fondo |

---

## 5. Componentes UI

### shadcn/ui (42 componentes base)

Accordion, Alert, Avatar, Badge, Button, Calendar, Card, Checkbox, Collapsible, Command, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, InputOTP, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Sonner (Toast), Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip.

### MUI (componentes admin)

DataGrid, DatePicker, Breadcrumbs, IconButton, LinearProgress, Chip, Collapse, Divider, List, ListItem, ListItemIcon, ListItemText.

---

## 6. Icons

- **Primario**: `lucide-react` (0.487) — iconos ligeros y consistentes
- **Secundario**: `@mui/icons-material` — iconos para componentes MUI en admin

---

## 7. Animación

| Librería | Uso |
|---|---|
| `motion` (Framer Motion) 12.23 | Transiciones de página, modales, animaciones de entrada |
| GSAP 3.15 | Animaciones complejas de scroll y hero |
| `canvas-confetti` 1.9 | Efecto confetti en confirmaciones |

---

## 8. Responsive Design

- **Mobile-first**: todos los componentes se diseñan primero para móvil
- **Breakpoints**: Tailwind estándar (sm, md, lg, xl)
- **Admin Sidebar**: Colapsable en móvil, siempre visible en desktop
- **Navbar**: Menú hamburguesa en móvil, navegación horizontal en desktop

---

## 9. Patrones de Uso en Componentes

### Botón primario

```tsx
// Correcto — usa colores del design system
<button className="bg-primary hover:bg-primary/90 text-primary-foreground ...">
  Reservar
</button>
```

### Card con elevación

```tsx
<div className="card-elevated">
  <h3>Hotel Paraíso</h3>
  <p>Desde $150.000/noche</p>
</div>
```

### Badge dorado

```tsx
<span className="badge-gold">Premium</span>
```

### Dark mode

```tsx
// Tailwind maneja automáticamente la transición
<div className="bg-card text-foreground border-border">
  {/* Se adapta automáticamente a light/dark */}
</div>
```

---

## 10. Fuentes

| Fuente | Uso | Carga |
|---|---|---|
| Playfair Display | Títulos principales, hero | Google Fonts CDN |
| Inter | Body text, UI | Google Fonts CDN |

---

## 11. Despliegue

- **Frontend**: Vercel (`https://proyectoalectours-docker.vercel.app/`)
- **Build**: Vite produce `/dist` → servido por nginx en Docker prod
- **Meta tags**: Open Graph, Schema.org JSON-LD, SEO optimizado en `index.html`
