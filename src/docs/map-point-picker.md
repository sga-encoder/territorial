# Mapa: selector de punto y basemap temable

Widgets de mapa compartidos en `src/app/components/map/`, reutilizados por el
editor de polígonos y por los formularios que necesitan una ubicación. El motor
(MapLibre GL) es pesado, así que **siempre se carga de forma diferida** (rutas
lazy o `@defer`); ninguna pantalla sin mapa lo incluye en su bundle.

## Basemap temable por tokens (`map-style.ts`)

El problema: un basemap **raster** (p. ej. CARTO `dark_all`) se ve casi negro y
**no** puede seguir el tema (son imágenes de color fijo). La solución: un estilo
**vectorial** (OpenFreeMap, sin API key, esquema OpenMapTiles) cuyos colores
salen de los **tokens** y se re-pintan al cambiar de tema.

- `createBaseMapStyle()` → `StyleSpecification` mínimo (fondo, agua, parques,
  edificios, vías y etiquetas de lugar) con colores que **igualan** los tokens
  dark del `:root` (sin parpadeo inicial).
- `applyBaseMapTheme(map, root)` → lee `--color-background`, `--color-surface`,
  `--color-surface-muted`, `--color-border-h`, `--color-text` y los aplica con
  `setPaintProperty`. Se llama en el `load` del mapa **y** en cada cambio de tema
  (efecto sobre `ThemeService`). Hace no-op si la capa no existe (seguro con un
  `mapStyleUrl` propio).
- `environment.mapStyleUrl`: si trae una URL, se usa ese estilo y se omite el
  re-pintado por tokens (no conocemos sus capas).

El editor de polígonos y el selector usan el **mismo** basemap, así ambos se ven
azul oscuro y cambian con el tema.

## Geocoding (`geocoding.service.ts`)

`GeocodingService.search(query)` hace *forward geocoding* (dirección →
coordenadas) con **OpenStreetMap Nominatim** (gratis, sin key, CORS). El
interceptor de Firebase solo toca URLs del backend, así que no se filtra el token
a terceros. Sesga a Colombia (`countrycodes=co`) y limita a 5 resultados.

> TODO(prod): la política de Nominatim pide User-Agent identificable y ≤1 req/s;
> el navegador no puede fijar User-Agent. Para producción, proxyear por el backend
> (o una instancia propia) y *debounce* del input.

## Selector de punto (`<ui-map-point-picker>`)

`ControlValueAccessor` cuyo **valor es un string `"lat,lng"`** (encaja como
escalar del form-generator). El usuario fija el punto de tres formas, **nunca
escribiendo coordenadas a mano** (RN-10):

1. **Buscar dirección** → lista de coincidencias → al elegir, centra el mapa y
   coloca el pin.
2. **Clic en el mapa** → coloca/mueve el pin ahí.
3. **Arrastrar el pin** → recoloca el punto.

Detalles: SSR-safe (MapLibre solo en navegador, `afterNextRender` + import
dinámico); el pin es un `Marker` con color `--color-primary-strong`; `Enter` en
la búsqueda **no** envía el formulario contenedor (`preventDefault`). Compone solo
el UI kit (las utilidades sueltas son de layout: tamaño del lienzo, `truncate`).

## Uso en un formulario (vía el generador)

No se instancia a mano: se declara un campo `type: 'location'` en el `FormSchema`.

```ts
{ key: 'location', label: 'Ubicación en el mapa', type: 'location', span: 12,
  initialValue: citizen ? `${citizen.latitude},${citizen.longitude}` : '',
  validators: [{ type: 'required' }] }
```

```ts
// en formSubmitted:
const [latitude, longitude] = String(value['location']).split(',').map(Number);
```

Ejemplo real: `pages/citizens/citizen-form-dialog.ts`. El `dynamic-input` envuelve
el campo `location` en `@defer (on immediate)` para no cargar MapLibre en
formularios sin mapa.

## Accesibilidad

El contenedor del mapa expone `role="application"` + `aria-label`. La búsqueda por
dirección es totalmente operable por teclado (input + botón), de modo que fijar un
punto no depende solo del lienzo WebGL.
