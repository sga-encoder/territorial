# Layout — Shell, Navbar y Sidebar

Marco visual de la aplicación: barra superior, navegación lateral y área de contenido
enrutada. Vive en `src/app/layout/` y lo monta `app.routes.ts` como componente padre
de todas las rutas de features.

## Composición

```
Shell (app-shell)
├── enlace "Saltar al contenido principal" (skip link)
├── <ui-particles-background>  ← fondo a pantalla completa (z-10)
├── Sidebar (app-sidebar)      ← drawer en móvil, rail/expandido desde md
│   └── app-sidebar-item × N    ← decide link vs grupo según los datos
└── columna principal
    ├── Navbar (app-navbar)     ← botón hamburguesa (solo móvil) + marca
    └── <main> → <ui-glass-stage> con <router-outlet />   ← contenido sobre cristal
```

## Uso

No se usa directamente en templates: se registra una sola vez como ruta raíz.

```ts
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      // features con lazy loading
    ],
  },
];
```

## API

| Componente | Inputs | Outputs | Notas |
| --- | --- | --- | --- |
| `Shell` | — | — | Lee el estado del `SidebarService` (`isSidebarOpen = expanded`) |
| `Navbar` | `isSidebarOpen: boolean` (requerido) | `menuToggled` | Expone `focusMenuButton()` para devolver el foco al cerrar el drawer |
| `Sidebar` | — | `closed` | Sin input: lee el `SidebarService`. Emite `closed` (refoco del toggle) al cerrar el drawer móvil |

## Estado persistente — `SidebarService`

`src/app/layout/sidebar/sidebar.service.ts` (`providedIn: 'root'`) es la fuente de
verdad del sidebar y **persiste en `localStorage`** (mismo patrón que `ThemeService`,
SSR-safe):

| Estado | Clave | Notas |
| --- | --- | --- |
| `expanded` | `territorial-sidebar-expanded` | Panel ancho (`true`) vs rail de iconos (`false`). Default colapsado. |
| `expandedGroups` | `territorial-sidebar-groups` | Ids de los grupos (dropdowns) abiertos. |

API: `expanded` / `expandedGroups` (signals readonly), `toggle()`, `setExpanded()`,
`toggleGroup(id)`, `isGroupExpanded(id)`. El Shell y la Navbar leen `expanded`; el
Sidebar lee ambos.

### Hover-expand con rebote (solo colapsado)

Cuando el sidebar está **colapsado**, pasar el mouse por el rail lo expande de forma
**temporal** (no se persiste). Si ya está **expandido**, el hover no hace nada. La
lógica es `visualExpanded = expanded() || hovered()`, expuesta por el servicio para
que sea **estado compartido**: el sidebar ajusta su `width` y el **Shell ajusta el
`padding-left`** del frame, así **navbar y contenido se contraen y rebotan en
sincronía** con el sidebar (mismo easing `cubic-bezier(0.34,1.56,0.64,1)`), tanto al
hacer toggle como al expandir por hover. El `aria-expanded` del botón hamburguesa
usa el estado **persistido** (`expanded`), no `visualExpanded`, para no confundir a
lectores de pantalla con la vista previa.

## Agregar un módulo a la navegación

Editar `NAV_ITEMS` en `sidebar.ts`. Cada entrada es un **link** o un **grupo**
(subcategorías como dropdown); ambos llevan `icon`. Las entradas con
`enabled: false` se muestran como "Próximamente" (sin enlace) hasta que exista su
feature:

```ts
const NAV_ITEMS: readonly SidebarEntry[] = [
  { kind: 'link', label: 'Entidades', path: '/entities', enabled: true, icon: 'info' },
  {
    kind: 'group',
    id: 'territory',
    label: 'Territorio',
    icon: 'map-pin',
    children: [
      { label: 'Ciudades', path: '/territory/cities', enabled: false, icon: 'map-pin' },
      // ...
    ],
  },
];
```

El componente `app-sidebar-item` (`sidebar-item.ts`) recibe cada `SidebarEntry` y
**decide solo** si pinta un link o un grupo desplegable (según `kind`); reusa el
mismo markup de link para la entrada raíz y para los hijos del grupo. Los tipos
viven en `sidebar.model.ts`.

## Accesibilidad

- Skip link visible al recibir foco; `<main>` tiene `tabindex="-1"` como destino.
- El botón hamburguesa publica `aria-expanded` y `aria-controls="sidebar-navigation"`.
- Al abrir el drawer el foco se mueve al `<nav>`; al cerrarlo vuelve al botón (WCAG 2.4.3).
- El enlace activo se marca con `aria-current="page"` (vía `ariaCurrentWhenActive`).
- Escape cierra el drawer; el backdrop es un `<button>` con etiqueta accesible.
- Los grupos (subcategorías) son `<button>` con `aria-expanded` y
  `aria-controls="sidebar-group-<id>"` apuntando a la lista de hijos.

## Notas de diseño

- Navbar y Sidebar son **superficies glass** (blur + highlight) y usan los mismos
  tokens del kit (`bg-glass-surface` + `backdrop-blur-glass`). La marca de la
  navbar es un chip **Solid 3D** azul (texto blanco AA sobre `primary-strong`).
- El ítem de navegación activo es **glass suave + acento**: relleno translúcido
  (`bg-primary-tint`), texto `primary-soft`, borde azul tenue y un glow suave —
  sin `backdrop-filter` (regla de listas). Cada ítem trae una barra lateral con
  efecto de resorte, un barrido de luz en hover y un *dot* indicador, accionados
  solo con CSS (`group-hover` / `group-aria-[current=page]`).
- **Paneles flotantes:** desde `md`, navbar y sidebar se despegan de los bordes
  (`md:inset-y-4 md:left-4`, márgenes vía el frame del shell) y se redondean
  (`rounded-2xl`); el contenido (`<main>`) ya no lleva padding propio, el hueco
  lo da el frame del shell (`py`/`pr` + `pl` dinámico según el sidebar).
- **Rebote en el toggle:** el ancho del sidebar y el `padding-left` del frame
  comparten el easing `cubic-bezier(0.34,1.56,0.64,1)` (500 ms), así sidebar,
  navbar y contenido "rebotan" sincronizados al abrir/cerrar.
- **Blur contenido:** `--blur-glass` se mantiene bajo (12 px) y `--color-glass-surface`
  translúcido para que el fondo (partículas) se perciba a través del cristal.
- **Contenedor principal:** `<main>` solo recorta (`overflow-hidden rounded-2xl`)
  y dentro monta un [`<ui-glass-stage>`](visual/glass-stage.md) que da la
  superficie de cristal (borde, blur, highlight) sobre las partículas; el scroll
  vive dentro del cristal (`h-full overflow-y-auto`). Así toda página enrutada
  hereda el panel glass sin importar nada.
- **Scrollbar:** estilizado global en `styles.scss` (WebKit + Firefox) con tokens
  (`--color-glass-border` → `--color-border-h` en hover, pista transparente).

## Menú de usuario (navbar)

La navbar lleva a la derecha un [Dropdown](ui-kit/dropdown.md) con el avatar +
nombre del usuario; al abrirlo, el panel repite la identidad (avatar + nombre +
correo, vía `[uiDropdownHeader]`) y ofrece **Perfil personal**, un separador y
**Cerrar sesión**. Los datos son un placeholder y las acciones quedan en TODO
hasta que exista la feature de autenticación (CU-07).

## Pendientes (TODO)

- CU-07: conectar el menú de usuario (perfil/logout) al AuthService real.
- Activar `authGuard`/`roleGuard` en las rutas cuando exista la pantalla de login.
