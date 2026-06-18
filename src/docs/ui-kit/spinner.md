# Spinner — `<ui-spinner>`

Indicador de progreso indeterminado: una **onda líquida** continua (patrón "l16",
keyframes en `spinner.scss`). Dos capas idénticas, una espejada y desfasada media
vuelta: el recorte revela las gotas una a una (los **puntos**), llega a pleno y
las desvanece mientras la otra hace lo opuesto → la línea **gira en forma de
infinito** de forma continua. Timing 2.4s con `ease-in-out` (frena suave en los
extremos).

Sin máscara punteada (las gotas de la onda son los puntos) y con `padding`
interno para que ninguna línea toque el borde. `blur` mínimo (1px) → bordes
rígidos, no difuminados. Sin caja opaca (contenedor transparente) → flota sobre
cualquier superficie; el color sale de `currentColor` (input `color`).

## Uso

```html
<ui-spinner />
<ui-spinner size="lg" color="muted" />

<!-- Dentro de Button lo gestiona el propio botón vía [loading] -->
<ui-button [loading]="true">Guardando…</ui-button>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Barra ancha (aspecto ≈ 3): 48/80/128px de ancho. |
| `color` | `'inherit' \| 'default' \| 'muted' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` | `inherit` para seguir al contexto (p. ej. dentro de Button). |
| `label` | `string` | `'Cargando'` | Anuncio para lectores de pantalla (`role="status"` + `aria-label`). |

## Accesibilidad

Publica `role="status"`; respeta `prefers-reduced-motion` a nivel global del
sistema de animaciones. `// TODO: a11y` — evaluar variante con
`animation: none` + texto visible para reduced-motion estricto.
