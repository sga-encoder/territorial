# Split — `<ui-split>`

Layout de dos paneles: una región **principal** flexible (un mapa, un editor)
junto a un **panel lateral** de ancho fijo (acciones, estado). Una sola columna
apilada en móvil; se divide desde el breakpoint `lg`. Es un **átomo de layout**
(Capa 1): solo organiza el contenido proyectado, nunca lo estiliza — ambos slots
se llenan con componentes del kit.

## Uso

```html
<ui-split aside="md">
  <div ui-split-main>
    <ui-card [padded]="false"><app-polygon-map /></ui-card>
  </div>
  <div ui-split-aside>
    <ui-card>Acciones…</ui-card>
  </div>
</ui-split>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `aside` | `'sm' \| 'md' \| 'lg'` | `'md'` | Ancho de la pista lateral desde `lg`: 18 / 22 / 26 rem. |
| `position` | `'start' \| 'end'` | `'end'` | Lado del panel lateral desde `lg` (`end` = derecha). En móvil siempre va debajo del principal. |

Slots por projection: atributo `ui-split-main` (región principal) y
`ui-split-aside` (panel lateral). En móvil ambos colapsan a una columna,
respetando el orden del DOM (principal primero).

## Notas

- Solo emite utilidades de **layout** (grid responsivo, gap, orden). Las clases
  de columnas son literales para que el scanner de Tailwind las detecte.
- El gap entre paneles usa la escala del sistema (`gap-4` móvil, `lg:gap-6`).
- Pensado para pantallas tipo *workbench* (mapa + panel). Para listas/tarjetas
  uniformes usa `<ui-container layout="grid">`.
