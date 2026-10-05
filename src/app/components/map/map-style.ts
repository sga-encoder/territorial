import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';

/**
 * Token-driven MapLibre basemap. Instead of a fixed-colour raster basemap (which
 * looks near-black and cannot follow the app theme), the map is a **vector**
 * style whose colours come from the design tokens and are re-applied when the
 * theme flips — so the map reads as the app's dark blue and turns light with the
 * rest of the UI. Vector tiles come from OpenFreeMap (no API key, OpenMapTiles
 * schema); only the colours are ours.
 */

const OPENFREEMAP_VECTOR_TILES = 'https://tiles.openfreemap.org/planet';
const OPENFREEMAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const LABEL_FONT = ['Noto Sans Regular'];

/** Default view: Manizales (Caldas) — sensible for Colombian municipalities. */
export const DEFAULT_MAP_CENTER: [number, number] = [-75.5138, 5.0703];
export const DEFAULT_MAP_ZOOM = 12;

type MapLibreModule = typeof import('maplibre-gl');

/**
 * Lazy-loads MapLibre. The package ships a UMD bundle: the dev server exposes its
 * named exports, but the production build exposes the library only as the default
 * export, so `(await import('maplibre-gl')).Map` is undefined there.
 */
export async function loadMapLibre(): Promise<MapLibreModule> {
  const maplibreModule = await import('maplibre-gl');
  return (
    (maplibreModule as MapLibreModule & { default?: MapLibreModule }).default ?? maplibreModule
  );
}

/** Reads a CSS custom property off the document root, with a fallback. */
export function readCssVar(root: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(root).getPropertyValue(name).trim();
  return value !== '' ? value : fallback;
}

/**
 * Minimal token-coloured vector style. The fallback colours match the dark
 * `:root` tokens so there is no flash before {@link applyBaseMapTheme} runs.
 */
export function createBaseMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: OPENFREEMAP_GLYPHS,
    sources: {
      openmaptiles: { type: 'vector', url: OPENFREEMAP_VECTOR_TILES },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#181c2e' } },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': '#141a2e' },
      },
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        paint: { 'fill-color': '#1e2338', 'fill-opacity': 0.4 },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': '#1e2338', 'fill-opacity': 0.6 },
      },
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 13,
        paint: { 'fill-color': '#252a40', 'fill-opacity': 0.6 },
      },
      {
        id: 'road',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#2c3454',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 12, 1.2, 16, 4],
        },
      },
      {
        id: 'place-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 5,
        layout: {
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': LABEL_FONT,
          'text-size': 12,
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': '#181c2e',
          'text-halo-width': 1.2,
        },
      },
    ],
  };
}

/**
 * Pushes the current token colours into the basemap layers. Call on the map's
 * `load` event and whenever the theme changes. No-ops for any missing layer, so
 * it is safe to call against a custom `mapStyleUrl` style too.
 */
export function applyBaseMapTheme(map: MapLibreMap, root: HTMLElement): void {
  const background = readCssVar(root, '--color-background', '#181c2e');
  const surface = readCssVar(root, '--color-surface', '#1e2338');
  const surfaceMuted = readCssVar(root, '--color-surface-muted', '#252a40');
  const road = readCssVar(root, '--color-border-h', 'rgba(150,170,255,0.28)');
  const text = readCssVar(root, '--color-text', 'rgba(255,255,255,0.92)');

  const setPaint = (layerId: string, property: string, value: string): void => {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, property, value);
    }
  };

  setPaint('bg', 'background-color', background);
  setPaint('water', 'fill-color', surface);
  setPaint('landcover', 'fill-color', surface);
  setPaint('park', 'fill-color', surface);
  setPaint('building', 'fill-color', surfaceMuted);
  setPaint('road', 'line-color', road);
  setPaint('place-label', 'text-color', text);
  setPaint('place-label', 'text-halo-color', background);
}
