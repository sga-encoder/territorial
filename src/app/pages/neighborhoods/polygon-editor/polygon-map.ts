import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  Map as MapLibreMap,
} from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { ThemeService } from '../../../components/ui';
import {
  applyBaseMapTheme,
  createBaseMapStyle,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from '../../../components/map';
import { environment } from '../../../../environments/environment';
import { PolygonEditorState } from './polygon-editor-state';
import {
  toRingFeatureCollection,
  toVertexFeatureCollection,
  verticesBounds,
} from './polygon-geometry';

const EMPTY_FEATURE_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

const RING_SOURCE = 'polygon-ring';
const VERTEX_SOURCE = 'polygon-vertices';
const OVERVIEW_SOURCE = 'overview-rings';
const RING_FILL_LAYER = 'ring-fill';
const RING_LINE_LAYER = 'ring-line';
const VERTEX_LAYER = 'vertices';
const OVERVIEW_FILL_LAYER = 'overview-fill';
const OVERVIEW_LINE_LAYER = 'overview-line';

/** True while the token-driven basemap is in use (env has no custom style URL). */
const usesTokenBasemap = (): boolean => environment.mapStyleUrl === '';

/**
 * MapLibre GL surface for the polygon editor — the RENDER + INTERACTION layer
 * only. It holds no editing state: it reflects {@link PolygonEditorState} (shared
 * via DI from the page) into GeoJSON sources and turns map gestures back into
 * state mutations (add / move / delete vertices). The map is a pure side effect
 * of the signals, so undo/validation/saving never query the map.
 *
 * Colours are read from the design tokens at runtime (never hardcoded) and
 * re-applied when the theme flips. Loaded only in the browser (afterNextRender +
 * dynamic import), so SSR never touches WebGL. The structural `h-full w-full`
 * utilities only size the canvas — all surface/visual styling stays in the kit
 * (the page wraps this in a `<ui-card>`).
 */
@Component({
  selector: 'app-polygon-map',
  template: `<div #container class="h-full w-full" role="application" [attr.aria-label]="ariaLabel()"></div>`,
  host: { class: 'block h-full w-full' },
})
export class PolygonMap {
  /** Read-only multi-polygon overview for the selected city (empty = hidden). */
  readonly overviewPolygons = input<FeatureCollection>(EMPTY_FEATURE_COLLECTION);

  private readonly state = inject(PolygonEditorState);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  private map: MapLibreMap | null = null;
  private readonly mapReady = signal(false);

  /** Guards the click-to-add handler from firing right after a drag ends. */
  private suppressNextClick = false;

  protected readonly ariaLabel = () =>
    this.state.isEditing()
      ? 'Mapa de demarcación. Clic para agregar vértices; arrastra para moverlos; doble clic para eliminar.'
      : 'Mapa de demarcación del barrio (solo lectura).';

  constructor() {
    afterNextRender(() => void this.initMap());

    // Reflect the working vertices into the two GeoJSON sources whenever the
    // state (or the selected vertex) changes — and once the map becomes ready.
    effect(() => {
      const vertices = this.state.vertices();
      const selected = this.state.selectedClientId();
      if (!this.mapReady() || this.map === null) {
        return;
      }
      this.ringSource()?.setData(toRingFeatureCollection(vertices));
      this.vertexSource()?.setData(toVertexFeatureCollection(vertices, selected));
    });

    // Base cursor follows the mode: a crosshair invites adding in draw mode.
    effect(() => {
      const editing = this.state.isEditing();
      if (this.mapReady() && this.map !== null) {
        this.map.getCanvas().style.cursor = editing ? 'crosshair' : '';
      }
    });

    // Push the city overview FeatureCollection into its source whenever it changes.
    effect(() => {
      const overview = this.overviewPolygons();
      if (!this.mapReady() || this.map === null) {
        return;
      }
      (this.map.getSource(OVERVIEW_SOURCE) as GeoJSONSource | undefined)?.setData(overview);
    });

    // Tokens are the single source of truth: re-read paint colours on theme flip
    // (both the basemap and the polygon overlay).
    effect(() => {
      this.theme.scheme();
      if (this.mapReady() && this.map !== null) {
        if (usesTokenBasemap()) {
          applyBaseMapTheme(this.map, this.document.documentElement);
        }
        this.applyPaint(this.map);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.map?.remove();
      this.map = null;
    });
  }

  /** Centers and zooms to fit the current ring (used by the page toolbar). */
  fitToPolygon(): void {
    const bounds = verticesBounds(this.state.vertices());
    if (this.map === null || bounds === null) {
      return;
    }
    this.map.fitBounds(bounds, { padding: 72, maxZoom: 17, duration: 600 });
  }

  fitToFeatureCollection(fc: FeatureCollection): void {
    if (this.map === null) {
      return;
    }
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const feature of fc.features) {
      if (feature.geometry.type !== 'Polygon') {
        continue;
      }
      for (const ring of feature.geometry.coordinates) {
        for (const [lng, lat] of ring) {
          if (lng < minLng) minLng = lng;
          if (lat < minLat) minLat = lat;
          if (lng > maxLng) maxLng = lng;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
    if (isFinite(minLng)) {
      this.map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: 48,
        maxZoom: 14,
        duration: 600,
      });
    }
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  private async initMap(): Promise<void> {
    const maplibregl = await import('maplibre-gl');
    const style = usesTokenBasemap() ? createBaseMapStyle() : environment.mapStyleUrl;
    const map = new maplibregl.Map({
      container: this.container().nativeElement,
      style,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    this.map = map;

    map.on('load', () => {
      if (usesTokenBasemap()) {
        applyBaseMapTheme(map, this.document.documentElement);
      }
      this.installLayers(map);
      this.applyPaint(map);
      this.bindInteractions(map);
      this.mapReady.set(true);
      this.fitToPolygon();
    });
  }

  private installLayers(map: MapLibreMap): void {
    map.addSource(OVERVIEW_SOURCE, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
    map.addSource(RING_SOURCE, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
    map.addSource(VERTEX_SOURCE, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });

    // Overview layers go beneath the editable ring.
    map.addLayer({
      id: OVERVIEW_FILL_LAYER,
      type: 'fill',
      source: OVERVIEW_SOURCE,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-opacity': 0.08 },
    });
    map.addLayer({
      id: OVERVIEW_LINE_LAYER,
      type: 'line',
      source: OVERVIEW_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-width': 1.5, 'line-dasharray': [3, 2] },
    });

    map.addLayer({
      id: RING_FILL_LAYER,
      type: 'fill',
      source: RING_SOURCE,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-opacity': 0.2 },
    });
    map.addLayer({
      id: RING_LINE_LAYER,
      type: 'line',
      source: RING_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-width': 2.5 },
    });
    map.addLayer({
      id: VERTEX_LAYER,
      type: 'circle',
      source: VERTEX_SOURCE,
      paint: {
        'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 8, 6],
        'circle-stroke-width': 2,
      },
    });
  }

  /** Pushes the current token colours into the map's paint properties. */
  private applyPaint(map: MapLibreMap): void {
    const primary = this.readToken('--color-primary', '#4a8fe7');
    const primarySoft = this.readToken('--color-primary-soft', '#7aaff0');
    const primaryStrong = this.readToken('--color-primary-strong', '#2d6ec7');
    const onPrimary = this.readToken('--color-on-primary', '#ffffff');

    const muted = this.readToken('--color-foreground-muted', '#888888');
    map.setPaintProperty(OVERVIEW_FILL_LAYER, 'fill-color', muted);
    map.setPaintProperty(OVERVIEW_LINE_LAYER, 'line-color', muted);
    map.setPaintProperty(RING_FILL_LAYER, 'fill-color', primary);
    map.setPaintProperty(RING_LINE_LAYER, 'line-color', primarySoft);
    map.setPaintProperty(VERTEX_LAYER, 'circle-color', [
      'case',
      ['boolean', ['get', 'selected'], false],
      onPrimary,
      primaryStrong,
    ]);
    map.setPaintProperty(VERTEX_LAYER, 'circle-stroke-color', primarySoft);
  }

  private bindInteractions(map: MapLibreMap): void {
    // Click empty space to add a vertex; click a vertex to select it.
    map.on('click', (event) => {
      if (!this.state.isEditing()) {
        return;
      }
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      const hits = map.queryRenderedFeatures(event.point, { layers: [VERTEX_LAYER] });
      const clientId: unknown = hits[0]?.properties?.['clientId'];
      if (typeof clientId === 'string') {
        this.state.select(clientId);
        return;
      }
      this.state.addVertex(event.lngLat.lng, event.lngLat.lat);
    });

    // Drag a vertex (mouse + touch).
    map.on('mousedown', VERTEX_LAYER, (event) => this.startMouseDrag(map, event));
    map.on('touchstart', VERTEX_LAYER, (event) => this.startTouchDrag(map, event));

    // Double-click a vertex removes it (and never zooms).
    map.on('dblclick', VERTEX_LAYER, (event) => {
      if (!this.state.isEditing()) {
        return;
      }
      event.preventDefault();
      const clientId: unknown = event.features?.[0]?.properties?.['clientId'];
      if (typeof clientId === 'string') {
        this.state.removeVertex(clientId);
      }
    });

    // Hover affordance over vertices.
    map.on('mouseenter', VERTEX_LAYER, () => {
      if (this.state.isEditing()) {
        map.getCanvas().style.cursor = 'move';
      }
    });
    map.on('mouseleave', VERTEX_LAYER, () => {
      map.getCanvas().style.cursor = this.state.isEditing() ? 'crosshair' : '';
    });
  }

  private startMouseDrag(map: MapLibreMap, event: MapLayerMouseEvent): void {
    if (!this.state.isEditing()) {
      return;
    }
    const clientId = event.features?.[0]?.properties?.['clientId'];
    if (typeof clientId !== 'string') {
      return;
    }
    event.preventDefault(); // stop the map from panning
    this.state.beginInteraction();
    this.state.select(clientId);
    map.dragPan.disable();

    const onMove = (move: { lngLat: { lng: number; lat: number } }): void => {
      this.state.moveVertex(clientId, move.lngLat.lng, move.lngLat.lat);
    };
    const onUp = (): void => {
      map.off('mousemove', onMove);
      map.dragPan.enable();
      this.suppressNextClick = true;
    };
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
  }

  private startTouchDrag(map: MapLibreMap, event: MapLayerTouchEvent): void {
    if (!this.state.isEditing() || event.points.length !== 1) {
      return;
    }
    const clientId = event.features?.[0]?.properties?.['clientId'];
    if (typeof clientId !== 'string') {
      return;
    }
    event.preventDefault();
    this.state.beginInteraction();
    this.state.select(clientId);

    const onMove = (move: { lngLat: { lng: number; lat: number } }): void => {
      this.state.moveVertex(clientId, move.lngLat.lng, move.lngLat.lat);
    };
    const onEnd = (): void => {
      map.off('touchmove', onMove);
      this.suppressNextClick = true;
    };
    map.on('touchmove', onMove);
    map.once('touchend', onEnd);
  }

  private ringSource(): GeoJSONSource | undefined {
    return this.map?.getSource(RING_SOURCE) as GeoJSONSource | undefined;
  }

  private vertexSource(): GeoJSONSource | undefined {
    return this.map?.getSource(VERTEX_SOURCE) as GeoJSONSource | undefined;
  }

  private readToken(name: string, fallback: string): string {
    const value = getComputedStyle(this.document.documentElement).getPropertyValue(name).trim();
    return value !== '' ? value : fallback;
  }
}
