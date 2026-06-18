# Glass Stage — `<ui-glass-stage>`

Superficie **glass** que aloja el contenido **por encima** del fondo de
partículas. El fondo (`ui-particles-background`) se pinta a pantalla completa en
`z-10`; este contenedor crea un contexto de apilado **superior** (`z-20`) con la
receta glass, de modo que:

- el **fondo se percibe** —desenfocado— a través del cristal (`backdrop-filter`),
- pero **todo el contenido proyectado queda nítido y legible** encima (el
  `backdrop-filter` solo desenfoca el fondo detrás del elemento, nunca sus hijos).

Resuelve el problema de «todo el contenido queda debajo del fondo»: envuelve el
contenido de la página en un `ui-glass-stage` y deja el fondo a pantalla completa
detrás.

## Uso

```html
<!-- Fondo a pantalla completa (z-10) -->
<ui-particles-background density="balanced" pointerEffect="repel" />

<!-- Contenido nítido sobre el cristal (z-20) -->
<ui-glass-stage>
  <ui-container direction="column" [gap]="8">
    <!-- … toda la página … -->
  </ui-container>
</ui-glass-stage>
```

```ts
import { GlassStage, ParticlesBackground } from '../../components/visual';

@Component({
  imports: [GlassStage, ParticlesBackground /* … */],
})
```

## Montaje global en el Shell

Desde el Shell (`src/app/layout/shell/shell.ts`) el `<ui-glass-stage>` envuelve el
`<router-outlet>`, sobre el `<ui-particles-background>` a pantalla completa. Por
eso **toda página enrutada hereda el cristal y el fondo sin importarlos**: el
cristal es un marco fijo (`h-full`) y el scroll vive dentro (`overflow-y-auto`),
mientras `main` solo recorta esquinas (`overflow-hidden rounded-2xl`).

> El showcase mantiene su propio par partículas + glass como demo autocontenida
> de la capa visual; el resto de las páginas se apoyan solo en el del Shell.

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `padded` | `boolean` | `true` | Padding interno (`p-6 md:p-8`). `false` para una superficie a ras. |

Sin tipos públicos nuevos: el componente no expone uniones (se importa desde el
barrel `src/app/components/visual`).

## Decisiones técnicas

- **z-order:** `relative z-20` gana al `fixed z-10` del fondo dentro del mismo
  contexto de apilado raíz → el cristal pinta sobre el fondo y el contenido sobre
  el cristal.
- **Glass donde flota (RN del kit):** reusa la receta glass por **tokens**
  (`bg-glass-surface`, `border-glass-border`, `backdrop-blur-glass`,
  `inset-shadow-glass-highlight`) — nunca colores hardcodeados, ciego al tema.
- **Una sola superficie, no repetida:** `backdrop-filter` es costoso en listas;
  por eso el stage envuelve bloques grandes, no ítems repetidos.
