# Toast — `ToastService` + `<ui-toast-outlet>`

Notificaciones glass apiladas en la esquina inferior derecha. **RN-UI-08:**
máximo 3 visibles (la más antigua se descarta al llegar una nueva),
auto-dismiss a los 5 s, `duration: 0` = persistente. El outlet vive una sola
vez en el Shell; las features usan el servicio.

## Uso

```ts
private readonly toast = inject(ToastService);

this.toast.success('Entidad guardada correctamente');
this.toast.error('No se pudo conectar', { title: 'Error de red', duration: 0 });
this.toast.warning('La sesión expira en 5 minutos');
this.toast.info('Sincronización programada');
```

## API — `ToastService`

| Método | Notas |
| --- | --- |
| `success/error/info/warning(message, options?)` | Atajos de `show`. `options: { title?, duration? }` (ms). Devuelven el id. |
| `show(variant, message, options?)` | Variante explícita. |
| `dismiss(id)` / `clear()` | Cierre puntual / total (los timers se limpian siempre). |

## Animación

- Cada toast entra y sale con el **rebote del modal** (`animate-modal-pop` /
  `animate-modal-pop-out`) vía Angular `animate.enter` / `animate.leave`.
  Keyframes en `styles.scss`, con fallback `prefers-reduced-motion`.

## Accesibilidad

- Cada toast es `role="status"`: los lectores de pantalla la anuncian sin
  interrumpir; la región lleva `aria-label="Notificaciones"`.
- Botón de cierre con `aria-label` en cada toast.
- `// TODO:` pausar el auto-dismiss mientras el cursor está encima.
