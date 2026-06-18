# UI Kit — Theming por tokens (Capa 0)

Fundación del design system: todos los valores visuales de la aplicación se
definen **una sola vez** como tokens y todos los componentes los consumen.
Ningún componente del kit (ni ninguna feature) escribe colores, radios,
sombras o blur a mano.

## Principio atómico

Los componentes de `src/app/components/ui/` son los **únicos átomos de estilo**.
Las clases utilitarias de Tailwind solo se usan **dentro** de `components/ui`;
las features componen pantallas exclusivamente con componentes del kit. Si una
feature necesita algo visual que no existe, se extiende el kit — nunca se
escribe estilo suelto.

## Mapa de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `src/styles/_variables.scss` | Tokens **runtime**: todo lo que cambia entre dark y light (colores, glass, elevación) + tokens transversales (`--font-sans`). Única fuente de verdad de color. |
| `src/styles/tailwind.css` | Tokens **estáticos** (radios, blur, motion) en `@theme` + mapeo de los runtime a utilidades con `@theme inline`. Deshabilita las paletas por defecto de Tailwind. |
| `src/styles/_mixins.scss` | Recetas visuales SCSS: `glass-surface`, `solid-surface`, `solid-surface-3d`, `input-glass`, `input-filled`, `surface-highlight`, `fade-slide-in`. |
| `src/styles/styles.scss` | Entrada global: base del `body`, foco visible (3px), keyframes (`fade-slide-in`, `ripple-expand`). |
| `src/app/components/ui/theme/theme.service.ts` | `ThemeService`: signal del esquema activo, toggle y persistencia. |
| `src/index.html` | Script inline que aplica el tema persistido **antes del primer pintado**. |

## Esquema dark/light

- **Dark es el tema por defecto** (decisión de producto): `:root` define los
  valores oscuros y `color-scheme: dark`.
- El tema claro se activa con `data-theme="light"` en `<html>`: el bloque
  `[data-theme='light']` redefine **todos** los tokens themables.
- Los componentes son **ciegos al tema**: leen tokens, nunca usan variantes
  `dark:` ni preguntan por el esquema activo. Cambiar de tema es una sola
  mutación de atributo en el DOM.
- El SSR siempre renderiza dark; el script de `index.html` aplica la elección
  persistida antes del primer pintado para evitar el "flash" de tema
  incorrecto (clave de storage: `territorial-ui-theme`).

### ThemeService

```ts
import { Component, inject } from '@angular/core';
import { ThemeService } from '../../components/ui/theme/theme.service';

@Component({ /* … */ })
export class ShowcasePage {
  protected readonly theme = inject(ThemeService);
}
```

```html
<!-- theme.scheme() → 'dark' | 'light'; theme.isDark() → boolean -->
<ui-button (clicked)="theme.toggle()">Cambiar tema</ui-button>
```

API: `scheme` (signal de solo lectura), `isDark` (computed), `setScheme(s)`,
`toggle()`. La preferencia solo se persiste ante una elección explícita.

## Tokens de color

Los valores exactos y las notas de contraste viven en `_variables.scss`
(paleta base de spec.md §8). Semántica de cada grupo:

| Token (utilidad) | Uso |
| --- | --- |
| `background` | Fondo de la aplicación. |
| `surface` / `surface-muted` | Superficie sólida de componentes / franjas y hovers sutiles. |
| `foreground` (`--color-text`) / `muted` | Texto principal / texto secundario (AA garantizado). |
| `primary` / `primary-strong` / `primary-soft` / `primary-tint` | Acento de marca / fondo sólido de controles (texto blanco AA) / texto-enlace primario legible / relleno translúcido para Badge y Chip. |
| `on-primary` | Texto sobre cualquier fondo `*-strong`. |
| `border` / `border-h` | Bordes de superficies sólidas / borde resaltado (hover, línea superior, lado de luz del 3D). |
| `danger`, `success`, `warning`, `info` (+ `-strong`, `-tint`) | Familias de estado: base = texto legible sobre el fondo actual; `-strong` = fondo sólido con texto blanco; `-tint` = relleno translúcido con la base como texto. |
| `focus-ring` | Anillo de foco visible (WCAG 2.4.7). |
| `backdrop` | Velo de Modal/Drawer. |
| `glass-surface`, `glass-border`, `glass-highlight`, `surface-highlight` | Receta glass y línea de luz (ver abajo). |
| `3d-hi` / `3d-dk` | Diferencial de bordes del material Solid 3D: luz (arriba/izquierda) y sombra (abajo/derecha). |
| `input-bg` / `-h` / `-f`, `input-bdr-t` / `-b` / `-bf` | Cavidad glass de los inputs: fondo en reposo/hover/focus y bordes (superior, inferior, inferior-focus). |
| `elevation-blue/green/red` (`shadow-blue/green/red`) | Brillos de color para botones (reposo suave; el hover lo intensifica el componente). |

## Glass, sólido y highlight

Regla de aplicación: **glass donde flota, sólido donde se lee.**

- **Glass** (`@include glass-surface` o `bg-glass-surface backdrop-blur-glass
  border border-glass-border inset-shadow-glass-highlight shadow-lg`): panel del
  Modal, Toast, dropdown del Select, Tooltip, Sidebar, Navbar, Card `elevated`,
  botón `secondary`.
- **Sólido plano** (`@include solid-surface`): Table y contenido denso que se
  lee, donde el volumen 3D distraería.
- **Solid 3D mate** (`@include solid-surface-3d`, o gradiente
  `175deg, 3d-hi → surface/glass → 3d-dk` + bordes asimétricos): contenido
  activo/seleccionado — Card por defecto, cuerpo del Modal, tab activo, ítem de
  sidebar activo, input lleno, página activa de Pagination. El volumen viene del
  **diferencial de bordes** (luz arriba/izquierda, sombra abajo/derecha) y de una
  sombra trasera difusa, **nunca** de sombras internas encima del objeto.
- **Inputs = cavidad glass** (`@include input-glass`, o `CONTROL_BASE_CLASSES` +
  `controlStateClasses(hasError, filled)`): el control vacío es una cavidad
  hundida con blur y sombra interna; al tener datos se eleva a Solid 3D
  (`input-filled`). **Esto revierte la regla previa «inputs siempre sólidos»**:
  se adopta el lenguaje glass/3D manteniendo AA (texto `foreground`) y sin
  `backdrop-filter` en filas repetidas.
- **Highlight**: línea de luz en el borde superior, presente en ambas
  superficies — es el hilo visual que unifica el sistema. Está implementada
  como sombra inset, así respeta el `border-radius` y se compone con las
  sombras de elevación.
- **Rendimiento**: `backdrop-filter` es costoso. Nunca dentro de listas ni
  elementos repetidos; el mixin trae fallback sólido vía `@supports` para
  navegadores sin soporte. Por eso Chip, Badge y los botones de Pagination
  **no** llevan blur: el tinte translúcido ya da el aire glass.

## Radios, sombras, blur y motion

| Grupo | Tokens | Uso |
| --- | --- | --- |
| Radios | `rounded-sm` 8px · `rounded-md` 12px · `rounded-lg` 18px · `rounded-xl` 22px · `rounded-2xl` 24px · `rounded-full` | botón sm/controles densos · botones · inputs/selects/cards/botón md-lg · cuerpo de modal-toast-chips · panel de modal y chrome flotante · avatares/pills. Escalas por defecto de Tailwind deshabilitadas. |
| Sombras | `shadow-sm/md/lg/xl` → `--elevation-*`; `shadow-blue/green/red` → `--elevation-blue/green/red` | Elevación consciente del tema (más fuertes en dark) + brillos de color para botones. |
| Highlight | `inset-shadow-highlight` / `inset-shadow-glass-highlight` | Línea de luz superior componible con `shadow-*`. |
| Blur | `backdrop-blur-glass` (20px) | Exclusivo de superficies glass (nunca en listas/filas repetidas). |
| Motion | `--default-transition-duration` 180ms, easing `--ease-out` | Toda utilidad `transition-*` lo hereda; coincide con `fade-slide-in`. |

## Espaciado, tipografía y breakpoints

- **Espaciado**: escala dinámica por defecto de Tailwind (`--spacing: 0.25rem`,
  es decir `p-4` = 1rem). Es la escala oficial del kit.
- **Tipografía**: `--font-sans` (pila Inter → Segoe UI) es la única familia; escala de
  tamaños por defecto de Tailwind (`text-sm`, `text-base`…). Los componentes
  `Text` y `Title` (Capa 1) fijan las combinaciones permitidas.
- **Breakpoints**: por defecto de Tailwind — `sm` 40rem, `md` 48rem, `lg`
  64rem, `xl` 80rem, `2xl` 96rem.

## Cómo extender el sistema

1. **Nuevo color themable**: definirlo en `:root` **y** en
   `[data-theme='light']` de `_variables.scss`, luego mapearlo en el bloque
   `@theme inline` de `tailwind.css`.
2. **Nuevo token estático** (radio, blur…): añadirlo al bloque `@theme` de
   `tailwind.css`.
3. **Nueva receta visual**: mixin en `_mixins.scss` consumiendo solo tokens.

## Accesibilidad

- Contrastes verificados WCAG AA en ambos temas (notas junto a cada token). En
  light, varios tokens de texto de color se **oscurecen** respecto a la paleta de
  referencia porque las superficies son tintadas (más oscuras que el blanco):
  `text-muted`, `primary-soft`/`info`, `danger`, `success`, `warning`.
- `color-scheme` acompaña al tema: formularios y scrollbars nativos correctos.
- Foco visible global con `--color-focus-ring` (`:focus-visible`, outline 3px);
  los inputs usan anillo vía `box-shadow` para respetar el `border-radius`.
- `prefers-reduced-motion` respetado: recetas de animación, el `ripple-expand`
  del botón y la entrada del Toast lo desactivan.
- `// TODO: a11y` — validar con AXE el texto sobre glass con contenido dinámico
  detrás (Capa 6).

## Ejemplo de uso real (solo legal dentro de `components/ui`)

```html
<!-- Panel sólido (se lee): -->
<div class="rounded-lg bg-surface border border-border inset-shadow-highlight shadow-sm p-6">
  <p class="text-foreground">Contenido denso legible.</p>
  <p class="text-muted text-sm">Texto secundario AA.</p>
</div>

<!-- Panel glass (flota): -->
<div
  class="rounded-xl bg-glass-surface backdrop-blur-glass border border-glass-border inset-shadow-glass-highlight shadow-lg p-6"
>
  <span class="text-success">Operación exitosa</span>
</div>
```

Fuera de `components/ui`, esto mismo se expresará con `<ui-card>` (Capa 3).
