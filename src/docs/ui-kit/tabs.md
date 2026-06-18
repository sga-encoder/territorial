# Tabs — `<ui-tabs>`

Grupo de pestañas con el patrón WAI-ARIA tabs: roving tabindex, activación
automática y navegación con flechas. El contenido de cada pestaña se proyecta
con `ng-template uiTabPanel` y solo se renderiza el panel activo.

## Uso

```ts
protected readonly tabs: readonly TabItem[] = [
  { id: 'general', label: 'General', icon: 'info' },
  { id: 'map', label: 'Mapa', icon: 'map-pin' },
  { id: 'history', label: 'Historial', disabled: true },
];
```

```html
<ui-tabs [tabs]="tabs" (tabChanged)="onTab($event)">
  <ng-template uiTabPanel="general">…contenido…</ng-template>
  <ng-template uiTabPanel="map">…contenido…</ng-template>
  <ng-template uiTabPanel="history">…contenido…</ng-template>
</ui-tabs>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `tabs` | `readonly TabItem[]` (requerido) | — | `{ id, label, icon?, disabled? }` |

| Output | Payload | Notas |
| --- | --- | --- |
| `tabChanged` | `string` | id de la pestaña activada. |

La pestaña inicial es la primera no deshabilitada (se recalcula si cambia la
lista y el usuario aún no eligió — `linkedSignal`).

## Accesibilidad

- `role="tablist|tab|tabpanel"`, `aria-selected`, `aria-controls`,
  `aria-labelledby` con ids únicos por instancia.
- Flechas izquierda/derecha ciclan entre pestañas habilitadas.
- `// TODO: a11y` — mover también el foco DOM al tab recién seleccionado y
  soportar Home/End.
