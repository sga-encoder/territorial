# Dropdown — `<ui-dropdown>`

Menú flotante reusable en cualquier parte (acciones de fila en tablas,
formularios, modales, navbar). El **disparador es el contenido proyectado** (un
texto, un icono de puntos `more`, un avatar, etc.) y el **panel es glass casi
opaco** (`--color-glass-strong`). El panel usa **`position: fixed`** posicionado
por JS, así **nunca lo recorta** un contenedor con `overflow` (tablas, áreas de
scroll) y se voltea hacia arriba si no hay espacio abajo. Abre con clic o flecha
abajo, cierra con clic fuera, `Escape`, scroll o al seleccionar; emite `selected`
con el `value` del ítem. Un ítem con `separator: true` dibuja una línea
divisoria; se puede proyectar un encabezado con `[uiDropdownHeader]`.

## Uso

```ts
protected readonly rowActions: readonly DropdownItem[] = [
  { value: 'view', label: 'Ver detalle', icon: 'eye' },
  { value: 'edit', label: 'Editar', icon: 'edit' },
  { value: 'delete', label: 'Eliminar', icon: 'trash', danger: true },
];
```

```html
<!-- Disparador con etiqueta -->
<ui-dropdown [items]="rowActions" (selected)="onAction($event)">
  Acciones
  <ui-icon name="chevron-down" size="sm" />
</ui-dropdown>

<!-- Kebab de puntos alineado a la derecha (típico en tablas) -->
<ui-dropdown align="end" [items]="rowActions" (selected)="onAction($event)">
  <ui-icon name="more" size="sm" />
</ui-dropdown>

<!-- Menú de usuario: encabezado (avatar+nombre+correo) + separador + logout -->
<ui-dropdown align="end" [items]="userMenu" (selected)="onUserAction($event)">
  <ui-avatar seed="..." size="sm" />
  <div uiDropdownHeader class="border-b border-glass-border px-3 py-2.5">…</div>
</ui-dropdown>
```
Con `userMenu = [{ value:'profile', label:'Perfil personal', icon:'user' }, { separator:true }, { value:'logout', label:'Cerrar sesión', icon:'close', danger:true }]`.

Dentro de una [Table](table.md), va en un slot de celda (`uiTableCell`) con
`align="end"` para las acciones de cada fila.

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `items` | `readonly DropdownItem[]` (requerido) | — | `{ value, label, icon?, disabled?, danger?, separator? }`. |
| `align` | `'start' \| 'end'` | `'start'` | Alinea el panel a la izquierda o derecha del disparador. |
| `disabled` | `boolean` | `false` | Deshabilita el disparador. |

| Output | Payload | Notas |
| --- | --- | --- |
| `selected` | `string` | `value` del ítem elegido (no emite en ítems `disabled`). |

## Accesibilidad

- Disparador: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`.
- Panel `role="menu"`, ítems `role="menuitem"` (son `<button>`).
- Al abrir, el foco entra al primer ítem; flechas ↑/↓ navegan; `Escape` cierra y
  **devuelve el foco al disparador** (WCAG 2.4.3). Clic fuera cierra.
- Entra con el rebote del sistema (`animate.enter="animate-modal-pop"`).
- **Auto-volteo:** si no hay espacio debajo del disparador (p. ej. la última fila
  de una tabla), el panel se abre **hacia arriba** para no quedar cortado.
