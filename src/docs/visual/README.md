# Capa `visual` — chrome decorativo dirigido por canvas

`src/app/components/visual/` es una capa **hermana** del UI Kit y de `dynamic`, no
parte de ninguna de las dos. Su razón de existir:

- El kit (`components/ui`) son **átomos de estilo sin lógica** (RN-UI-02) y se
  mantiene **mínimo** (RN-UI-05). Un fondo de partículas lleva lógica real
  (canvas, `requestAnimationFrame`, física, interacción de puntero), así que no
  cabe ahí.
- La capa `dynamic` existe para **componer el kit** a partir de configuración
  (tablas, formularios, filtros). Una pieza `visual` **no compone el kit**:
  pinta sus propios píxeles sobre un `<canvas>`.

Por eso `visual` es su propia capa: piezas **ornamentales** que dibujan a mano
(Canvas 2D o WebGL vía three.js), siempre alimentadas por los **tokens** del
sistema (nunca colores hardcodeados).

## Reglas de la capa

- **Pinta desde tokens, no desde literales.** El canvas no entiende
  `var(--color-…)`, así que el componente **resuelve** el valor real del token
  con `getComputedStyle(documentElement)` y lo reparsea a `rgb`. El color sigue
  saliendo del token y reacciona al tema vía `effect(() => theme.scheme())`.
- **Ciego al tema.** Sin ramas `dark:`/`light:`; el color se vuelve a resolver
  cuando `ThemeService` cambia el esquema.
- **Fuera de la zona de Angular.** El bucle `requestAnimationFrame` y los
  listeners de puntero corren en `NgZone.runOutsideAngular` y solo mutan campos
  planos: el render a 60 fps nunca dispara detección de cambios.
- **SSR y accesibilidad.** Inicialización con `afterNextRender` (solo browser);
  respeta `prefers-reduced-motion` (un frame estático, sin animación ni
  interacción); decorativo ⇒ `pointer-events-none` + `aria-hidden`.
- **Tipos centralizados:** todas las uniones públicas viven en
  `src/app/components/visual/types.ts` (espejo de RN-UI-01) y se importan desde el
  barrel `src/app/components/visual`, nunca de los archivos sueltos. El selector
  conserva el prefijo `ui-` por ergonomía; la separación es estructural.
- **Dirección de dependencia:** `visual` → `ui`. Nunca al revés.

## Componentes

| Componente | Selector | Doc |
| --- | --- | --- |
| `ParticlesBackground` | `<ui-particles-background>` | [particles-background.md](particles-background.md) |
| `GlassStage` | `<ui-glass-stage>` | [glass-stage.md](glass-stage.md) |

> `GlassStage` es el **compañero** del fondo: una superficie glass que flota
> sobre el canvas (`z-20` sobre el `z-10` del fondo) para que el contenido quede
> nítido encima mientras el fondo se percibe desenfocado a través del cristal.

Demo viva en `/ui-kit` (grupo «Capa visual» del índice).
