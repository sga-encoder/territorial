# Particles Background — `<ui-particles-background>`

Fondo **decorativo** de partículas renderizado con **three.js (WebGL)** sobre un
`<canvas>` propio (60 fps, control total de interacción). Las partículas reposan
en su posición, reaccionan al puntero (repulsión/atracción con retorno por
resorte) y responden al clic con un efecto de **gota** (onda expansiva que las
empuja hacia afuera). El color sale del token `--color-primary` y cambia con el
tema.

La **física vive en CPU** (posición home, resorte, repulsión, ondas) y cada
frame se vuelca al búfer de un `THREE.Points`; un `ShaderMaterial` propio
convierte cada punto en un sprite redondo y suave con su propio alfa. El módulo
`three` se carga con `import()` **diferido y solo en el navegador**, así el SSR
nunca toca WebGL y no entra al bundle inicial.

Pertenece a la **capa `visual`** (no al UI Kit): lleva lógica y pinta sus
píxeles. Ver [README de la capa](README.md).

## Uso

Llena su **ancestro posicionado** más cercano (`absolute inset-0`). El contenedor
debe tener `position: relative` y una altura. Como es ornamental
(`pointer-events-none` + `aria-hidden`), nunca atrapa el cursor: la interacción
se calcula desde listeners globales convertidos a coordenadas del canvas.

```html
<!-- El padre define el lienzo: relative + alto + recorte. -->
<div class="relative h-96 overflow-hidden rounded-lg">
  <ui-particles-background density="balanced" speed="normal" pointerEffect="repel" />
  <!-- Contenido por encima del fondo… -->
</div>
```

```ts
import { ParticlesBackground } from '../../components/visual';

@Component({
  imports: [ParticlesBackground],
  // …
})
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `density` | `'sparse' \| 'balanced' \| 'dense'` | `'balanced'` | Densidad por área (más alto ⇒ más partículas). Tope de 180 para no caer de 60 fps. |
| `speed` | `'calm' \| 'normal' \| 'lively'` | `'normal'` | Velocidad base de deriva. |
| `pointerEffect` | `'repel' \| 'attract' \| 'none'` | `'repel'` | Comportamiento dentro del radio de influencia del puntero. |

Tipos en `src/app/components/visual/types.ts`; importar desde el barrel
`src/app/components/visual`.

## Comportamiento

- **Física.** Deriva a velocidad constante + rebote en bordes. Cada frame se
  suma una fuerza transitoria (puntero + ondas) que decae sola al alejarse la
  fuente; no hay fricción acumulada.
- **Puntero.** Falloff lineal: fuerza máxima bajo el cursor, cero en el borde del
  radio. `attract` invierte el signo.
- **Gota (clic).** Cada `pointerdown` crea una onda que se expande y muere; su
  frente empuja las partículas cercanas hacia afuera (ver `rippleForce`).
- **Tema.** El color se reresuelve desde `--color-primary` cuando `ThemeService`
  cambia el esquema; partículas legibles tanto en oscuro como en claro.

## Decisiones técnicas

- **three.js / WebGL.** `WebGLRenderer` con `alpha: true` y `clearColor` alfa 0
  (la página se ve a través); `OrthographicCamera` en **coordenadas de píxel**
  (y hacia abajo) para reutilizar tal cual la física en CPU. `THREE.Points` +
  `BufferGeometry` (atributos `position`/`aSize`/`aAlpha`) y un `ShaderMaterial`
  que recorta un disco suave de `gl_PointCoord`.
- **Carga diferida.** `three` se trae con `import('three')` dentro de
  `afterNextRender` (solo navegador): fuera del bundle de servidor y del crítico.
- **Tokens → color.** Se resuelve `--color-primary` con
  `getComputedStyle(documentElement)`, se reparsea a `rgb` y se vuelca al uniform
  `uColor` (en `SRGBColorSpace`): el color sigue saliendo del token (RN-UI-02) y
  reacciona al tema, sin literales.
- **Rendimiento.** Bucle `requestAnimationFrame` y listeners de puntero en
  `NgZone.runOutsideAngular`, mutando solo campos planos (cero detección de
  cambios). `ResizeObserver` reconstruye el campo y `setPixelRatio` está limitado
  a 2 (`MAX_DPR`) para nitidez retina sin coste 4×. Tope de 450 partículas.
- **SSR.** Inicialización con `afterNextRender`; en servidor no se toca WebGL ni
  el canvas. Limpieza en `DestroyRef.onDestroy` (geometría, material y renderer
  se liberan).
- **Accesibilidad.** `aria-hidden` + `pointer-events-none`; respeta
  `prefers-reduced-motion` con un único frame estático, sin animación ni
  interacción.
