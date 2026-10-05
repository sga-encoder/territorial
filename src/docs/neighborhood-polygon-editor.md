# Editor de polígonos de barrio (CU-09 / CU-10)

Pantalla para que un Funcionario **demarque** el polígono de un barrio sobre un
mapa MapLibre GL: crear, mover, eliminar y reordenar vértices, cargar el polígono
existente del backend y guardarlo respetando el contrato de puntos. Se integra
como una vista más del Shell (hereda el panel glass sobre partículas) y se compone
**solo con el UI kit** — el mapa es la única superficie nueva, enmarcada por un
`<ui-card [padded]="false">`.

Construye sobre el agregado de solo lectura descrito en
[neighborhood-polygon.md](neighborhood-polygon.md): el editor añade la edición y
la persistencia, sin recalcular geometría en el frontend (solo ordena, valida y
diffea).

## Acceso

Entrada propia en el sidebar (**Territorio → Demarcación**), ruta
`/territory/demarcation`. La página trae su propio selector de barrio, así que una
sola ruta basta.

### Selección en cascada (RN-13)

El panel derecho elige el barrio siguiendo la jerarquía territorial:
**Departamento → Ciudad → Comuna → Barrio**. Cada selector aparece al elegir el
anterior y lista solo sus hijos (departamento y ciudad con búsqueda). La comuna
solo se muestra si la ciudad tiene comunas; si no, un aviso indica que no hay
barrios para demarcar. El barrio es opcionalmente filtrable por comuna: sin comuna
lista todos los de la ciudad. Cambiar un nivel limpia los inferiores y el
polígono cargado; el mapa muestra el resumen de polígonos del alcance actual
(ciudad o comuna) hasta que se elige un barrio. TODO(CU-07): proteger con `authGuard` + `roleGuard(['official'])`
— solo el Funcionario demarca (RN-23).

## Arquitectura — responsabilidades separadas

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Funciones puras | `polygon-editor/polygon-geometry.ts` | Transformar (agregado→vértices), validar el anillo, construir GeoJSON y **diffear** para persistir. Sin Angular/MapLibre/HTTP. |
| Tipos del editor | `polygon-editor/polygon-editor.types.ts` | `EditableVertex`, `EditorMode`, `RingValidation`, `PolygonPersistenceDiff`… (tipos internos de la feature, no del dominio ni del kit). |
| Estado de edición | `polygon-editor/polygon-editor-state.ts` | Signals: vértices, modo, selección, validación, *dirty*, historial (undo). **Sin I/O.** Provisto a nivel de página (sesión por navegación), compartido con el mapa por DI. |
| Persistencia | `neighborhood-polygon.service.ts` | `getPolygon()` (lee) y `savePolygon()` (escribe con diff & sync). Único lugar donde viven los DTO snake_case. |
| Render + interacción | `polygon-editor/polygon-map.ts` | Componente MapLibre. Refleja el estado en fuentes GeoJSON y traduce gestos del mapa en mutaciones del estado. No guarda estado propio. |
| Página contenedora | `polygon-editor/polygon-editor.ts` (+`.html`) | Orquesta el flujo (elegir barrio → cargar → editar → guardar) y compone el kit. |

### Flujo de datos

```
Mapa (gestos) ─▶ PolygonEditorState (signals) ─▶ efecto ─▶ fuentes GeoJSON ─▶ Mapa (render)
                       ▲                                   │
   Página ◀── validación / dirty / vértices ───────────────┘
     │
     └─ getPolygon()/savePolygon() ─▶ NeighborhoodPolygonService ─▶ /api/points
```

El mapa es un **efecto secundario del estado**: undo, validación y guardado nunca
consultan al mapa. Eso mantiene la lógica testeable y el render reemplazable.

## Render del mapa (MapLibre)

- No se usa ninguna librería de *draw* externa (traen su propia estética). El
  polígono se dibuja con **una fuente GeoJSON + 3 capas**: `fill` (área), `line`
  (perímetro) y `circle` (vértices). Arrastrar un vértice es un `setData`, no
  cientos de nodos DOM → todo en la GPU (coherente con la regla "nunca
  `backdrop-filter` en contenido repetido").
- **Colores desde tokens, no hardcodeados:** el componente lee
  `--color-primary`, `--color-primary-soft`, `--color-primary-strong` y
  `--color-on-primary` con `getComputedStyle` y los reaplica cuando el
  `ThemeService` cambia de tema. El mapa es ciego al esquema, como el resto del
  kit (sin variantes `dark:`).
- **SSR:** MapLibre carga solo en el browser (`afterNextRender` + `import()`
  dinámico). El servidor renderiza un contenedor vacío. El chunk `maplibre-gl`
  (~1.6 MB) es lazy: solo se descarga al entrar al editor.
- **Carga de MapLibre:** siempre con `loadMapLibre()` (`components/map`), nunca
  `await import('maplibre-gl')` directo. MapLibre es un bundle UMD: en `ng serve`
  expone `Map`, pero en el build de producción solo trae export `default`, así
  que `(await import('maplibre-gl')).Map` es `undefined` y el mapa falla con
  `Map is not a constructor`. El helper lee `default` cuando existe.

### Mapa base (temable, configurable)

El basemap es el **estilo vectorial coloreado por tokens** compartido (azul
oscuro, se re-pinta al cambiar de tema) — ver [map-point-picker.md](map-point-picker.md).
`environment.mapStyleUrl` lo sobrescribe con un estilo propio (MapTiler,
OpenFreeMap…) sin tocar código; en ese caso se omite el re-pintado por tokens.

## Interacción (modo edición)

| Gesto | Efecto |
| --- | --- |
| Clic en vacío | Agrega un vértice al final y lo selecciona. |
| Clic en vértice | Lo selecciona. |
| Arrastrar vértice | Lo mueve en vivo (un solo snapshot de undo al iniciar). |
| Doble clic en vértice | Lo elimina. |
| Panel "Vértices" | Seleccionar, **reordenar** (subir/bajar) y eliminar; reordenar cambia el `order` del anillo. |

En modo **vista** el mapa es de solo lectura. El modo se alterna con "Editar
polígono". Toolbar: deshacer, quitar vértice seleccionado, limpiar, y controles de
mapa (centrar, acercar, alejar) — todos botones del kit.

## Validación del anillo y persistencia

- `validateRing` exige **≥ 3 vértices distintos** (el anillo se cierra
  implícitamente, RN-24) y rechaza **vértices superpuestos**. El estado expone
  `validation()`; el botón Guardar solo se habilita si el anillo es válido **y**
  hay cambios (`isDirty`).
- **Diff & sync** (`diffPolygonPoints`): al guardar se comparan los vértices
  editados contra la línea base cargada y se emiten solo los cambios — `POST` los
  nuevos, `PUT` los movidos/reordenados, `DELETE` los quitados; los inalterados no
  cuestan petición. El `order` se deriva de la posición 1-based en el anillo.
  Cada vértice persiste con `id_neighborhood` y `id_annotation: null` (XOR
  `ck_point_xor_owner`). Tras guardar, la página recarga para que los vértices
  nuevos tomen su `id_point` del backend.
- **Knob de política (`COORDINATE_EPSILON`):** tolerancia (~1,1 cm) que decide
  cuándo un vértice arrastrado cuenta como "movido" (→ PUT) o intacto, y qué hace
  "duplicados" a dos vértices. Subirla envía menos PUTs; bajarla captura
  micro-ajustes. *Extensión natural (pendiente, decisión de dominio):* rechazar
  también anillos **auto-intersectados** (un "moño") añadiendo un
  `hasSelfIntersection` y enchufándolo en `validateRing`.

## Estados (mismo tono que el resto del sistema)

- **Sin barrio elegido:** empty-state ("Elige un barrio para demarcar").
- **Cargando / Guardando:** spinner del kit en la tarjeta de Estado; Guardar
  muestra spinner inline y bloquea.
- **Error de carga/guardado:** tarjeta danger con "Reintentar" (mismo patrón que
  las listas CRUD).
- **Aún no demarcado:** badge "Sin demarcar" + lista de vértices con su
  empty-state.
- **Incompleto / Demarcado:** badge `warning` / `success` con la pista de
  validación.

## Extensiones del UI kit (autorizadas por el brief)

- **`<ui-split>`** (nuevo átomo de layout): zona principal + panel lateral,
  responsivo. Ver [ui-kit/split.md](ui-kit/split.md).
- **`<ui-card [padded]="false">`**: body a sangre para enmarcar el mapa.
- **Íconos** nuevos: `move`, `undo`, `save`, `locate`, `minus`, `chevron-up`,
  `waypoints` (RN-UI-06).

> **Utilidades de layout en la feature:** el editor usa Tailwind **solo** para
> layout/medidas (`h-136`, `max-w-sm`, `grid`, `sr-only`) donde el `Container` del
> kit no alcanza; **todo lo visual** (superficies, color, texto, botones) sale del
> kit. Es la lectura coherente de "Tailwind para layout/espaciado" + principio
> atómico (estilo visual solo dentro de `components/ui`).

## Accesibilidad

- Controles, toolbar y lista de vértices son componentes del kit, navegables por
  teclado; los botones solo-ícono llevan `sr-only`.
- El contenedor del mapa expone `role="application"` + `aria-label` según el modo.
- **Limitación conocida:** agregar un vértice requiere clic en el mapa (canvas
  WebGL, no operable solo por teclado). La inspección, selección, reordenamiento y
  borrado sí son accesibles desde el panel de vértices. Pendiente: alternativa de
  alta por teclado (p. ej. capturar coordenadas a mano).
