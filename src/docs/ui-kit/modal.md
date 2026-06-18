# Modal — `ModalService` + `<ui-modal-outlet>`

Diálogo glass abierto por **servicio**: `open()` renderiza un componente
standalone dentro del panel y resuelve una Promise cuando se cierra. El
outlet está montado una sola vez en el Shell — las features solo usan el
servicio.

## Uso

```ts
// Quien abre:
private readonly modal = inject(ModalService);

protected async confirmArchive(): Promise<void> {
  const result = await this.modal.open(ConfirmArchive, {
    title: 'Archivar entidad',
    size: 'sm',
    inputs: { entityName: 'Alcaldía de Manizales' },
  });
  if (result === true) { /* archivar */ }
}
```

```ts
// El componente abierto se cierra a sí mismo:
protected readonly modal = inject(ModalService);
// <ui-button (clicked)="modal.close(true)">Confirmar</ui-button>
```

## API — `ModalService`

| Método | Notas |
| --- | --- |
| `open(component, config?)` | `config: { title?, size? ('sm'\|'md'\|'lg'), inputs? }`. Los `inputs` llegan al componente vía `NgComponentOutlet`. Devuelve `Promise<unknown>`. |
| `close(result?)` | El `result` resuelve la Promise de `open()`. ESC y backdrop cierran con `undefined`. |

Un solo modal a la vez (RN-UI-05): abrir otro cierra el anterior.

## Comportamiento del diálogo

- Foco: entra al panel al abrir y **vuelve al disparador** al cerrar
  (WCAG 2.4.3); Tab/Shift+Tab ciclan dentro (trap básico).
- Cierre: ESC, clic en backdrop o botón de cerrar (si hay `title`).
- Scroll del body bloqueado mientras está abierto.
- ARIA: `role="dialog"`, `aria-modal`, `aria-labelledby` cuando hay título.
- Material: panel **glass** (`rounded-2xl`) con un **cuerpo Solid 3D** que
  envuelve el contenido proyectado (legibilidad sobre el blur). El backdrop
  oscurecido lleva `backdrop-blur-glass` (el fondo se ve difuminado).
- **Animación** (Angular `animate.enter` / `animate.leave`, sin librería):
  el panel entra con rebote desde el centro (`animate-modal-pop`) y sale
  colapsando hacia el centro (`animate-modal-pop-out`); el backdrop hace
  fundido (`animate-fade-in` / `animate-fade-out`). Keyframes en `styles.scss`,
  todos con fallback `prefers-reduced-motion`.
- `// TODO: a11y` — aislar el ESC del drawer del sidebar.
