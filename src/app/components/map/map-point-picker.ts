import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import { Button, Card, Container, Icon, InputText, Text, ThemeService } from '../ui';
import { environment } from '../../../environments/environment';
import { GeocodingService, type GeocodeResult } from './geocoding.service';
import {
  applyBaseMapTheme,
  createBaseMapStyle,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  loadMapLibre,
  readCssVar,
} from './map-style';

/** Parsed `"lat,lng"` form value, or null when unset/invalid. */
interface LatLng {
  readonly latitude: number;
  readonly longitude: number;
}

const POINT_SOURCE = 'picker-point';
const POINT_LAYER = 'picker-point';
const EMPTY_FC: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };

function parseLatLng(value: string | null): LatLng | null {
  if (value === null || value.trim() === '') {
    return null;
  }
  const [latText, lngText] = value.split(',');
  const latitude = Number(latText);
  const longitude = Number(lngText);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function toPointFeatureCollection(point: LatLng | null): FeatureCollection<Point> {
  if (point === null) {
    return EMPTY_FC;
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
        properties: {},
      },
    ],
  };
}

/**
 * Map-based coordinate picker (ControlValueAccessor, value = `"lat,lng"` string).
 * The user finds a place by typing an address (forward geocoding) or clicks /
 * drags the point on the map — coordinates are never typed by hand (spec.md
 * RN-10). The point is a GeoJSON circle layer (not an HTML Marker), so it renders
 * reliably even inside modals and without the global MapLibre marker CSS, and it
 * is coloured from the design tokens. Reuses the token-driven themeable basemap;
 * MapLibre loads only in the browser (SSR-safe). Used by the form generator's
 * `location` field type.
 */
@Component({
  selector: 'ui-map-point-picker',
  imports: [ReactiveFormsModule, Button, Card, Container, Icon, InputText, Text],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MapPointPicker), multi: true },
  ],
  template: `
    <div class="flex flex-col gap-3">
      @if (label() !== '') {
        <ui-text variant="label" color="muted">{{ label() }}</ui-text>
      }

      <ui-card [padded]="false">
        <div class="relative h-64 w-full sm:h-72">
          <div
            #container
            class="h-full w-full"
            role="application"
            aria-label="Mapa para fijar la ubicación. Haz clic para colocar el punto o arrástralo."
          ></div>

          <!-- Floating search + results: absolutely positioned over the map canvas.
               pointer-events-none on the wrapper lets map clicks pass through
               the transparent gaps; only the interactive controls capture them. -->
          <div class="pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-col gap-1">
            <!-- Search row -->
            <div class="pointer-events-auto flex items-center gap-2">
              <div class="min-w-0 flex-1">
                <ui-input
                  [formControl]="searchControl"
                  iconStart="search"
                  placeholder="Buscar dirección…"
                  (keydown.enter)="onEnter($event)"
                />
              </div>
              <ui-button variant="secondary" [loading]="searching()" (clicked)="onSearch()">
                Buscar
              </ui-button>
            </div>

            <!-- Results dropdown — floats below the search row, inside the map card -->
            @if (results().length > 0) {
              <div
                class="pointer-events-auto max-h-44 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
              >
                @for (result of results(); track $index) {
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-muted"
                    (click)="selectResult(result)"
                  >
                    <ui-icon name="map-pin" size="sm" />
                    <span class="min-w-0 truncate" [title]="result.label">{{ result.label }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </ui-card>

      <ui-container justify="between" center="vertical" [gap]="2" wrap>
        @if (point(); as coords) {
          <ui-text variant="caption" color="muted">
            Lat {{ format(coords.latitude) }}, Lng {{ format(coords.longitude) }}
          </ui-text>
          <ui-button variant="ghost" size="sm" (clicked)="clearPoint()">
            <ui-icon name="close" size="sm" />
            Quitar punto
          </ui-button>
        } @else {
          <ui-text variant="caption" color="muted">
            Busca una dirección o haz clic en el mapa para fijar el punto.
          </ui-text>
        }
      </ui-container>

      @if (error(); as errorMessage) {
        <ui-text variant="caption" color="danger">{{ errorMessage }}</ui-text>
      }
      @if (noResults()) {
        <ui-text variant="caption" color="warning">
          No se encontraron resultados para esa dirección.
        </ui-text>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class MapPointPicker implements ControlValueAccessor {
  /** Field label rendered above the search box. */
  readonly label = input('');
  /** Error message from the form (RN-UI-07); shown in danger when present. */
  readonly error = input<string | null>(null);

  private readonly geocoding = inject(GeocodingService);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly results = signal<readonly GeocodeResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly noResults = signal(false);
  protected readonly point = signal<LatLng | null>(null);

  private map: MapLibreMap | null = null;
  private readonly mapReady = signal(false);
  private disabled = false;
  /** Guards the click-to-place handler from firing right after a drag ends. */
  private suppressNextClick = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => void this.initMap());

    // The point layer is a pure function of the `point` signal.
    effect(() => {
      const point = this.point();
      if (this.mapReady() && this.map !== null) {
        (this.map.getSource(POINT_SOURCE) as GeoJSONSource | undefined)?.setData(
          toPointFeatureCollection(point),
        );
      }
    });

    // Tokens are the single source of truth: re-tint basemap + point on theme flip.
    effect(() => {
      this.theme.scheme();
      if (this.mapReady() && this.map !== null) {
        if (environment.mapStyleUrl === '') {
          applyBaseMapTheme(this.map, this.document.documentElement);
        }
        this.applyPointPaint(this.map);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.map?.remove();
      this.map = null;
    });
  }

  // --- ControlValueAccessor --------------------------------------------------

  writeValue(value: string | null): void {
    const coords = parseLatLng(value);
    this.point.set(coords);
    if (coords !== null && this.mapReady() && this.map !== null) {
      this.map.easeTo({ center: [coords.longitude, coords.latitude], zoom: 15, duration: 0 });
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable({ emitEvent: false });
    } else {
      this.searchControl.enable({ emitEvent: false });
    }
  }

  // --- UI ---------------------------------------------------------------------

  protected format(value: number): string {
    return value.toFixed(5);
  }

  protected onEnter(event: Event): void {
    // Don't let Enter submit the surrounding form — just run the search.
    event.preventDefault();
    void this.onSearch();
  }

  protected async onSearch(): Promise<void> {
    if (this.disabled) {
      return;
    }
    const query = this.searchControl.value;
    if (query.trim() === '') {
      return;
    }
    this.searching.set(true);
    this.noResults.set(false);
    const matches = await firstValueFrom(this.geocoding.search(query));
    this.results.set(matches);
    this.noResults.set(matches.length === 0);
    this.searching.set(false);
  }

  protected selectResult(result: GeocodeResult): void {
    this.results.set([]);
    this.commitPoint({ latitude: result.latitude, longitude: result.longitude }, true);
  }

  protected clearPoint(): void {
    if (this.disabled) {
      return;
    }
    this.point.set(null);
    this.onChange(null);
    this.onTouched();
  }

  // --- Map --------------------------------------------------------------------

  private async initMap(): Promise<void> {
    const maplibregl = await loadMapLibre();
    const style = environment.mapStyleUrl !== '' ? environment.mapStyleUrl : createBaseMapStyle();
    const initial = this.point();
    const map = new maplibregl.Map({
      container: this.container().nativeElement,
      style,
      center: initial !== null ? [initial.longitude, initial.latitude] : DEFAULT_MAP_CENTER,
      zoom: initial !== null ? 15 : DEFAULT_MAP_ZOOM,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    this.map = map;

    map.on('load', () => {
      // Often initialises inside an animating modal: recompute size so the
      // canvas and the point land correctly.
      map.resize();
      if (environment.mapStyleUrl === '') {
        applyBaseMapTheme(map, this.document.documentElement);
      }
      this.installPointLayer(map);
      this.applyPointPaint(map);
      this.bindInteractions(map);
      map.getCanvas().style.cursor = 'crosshair';
      this.mapReady.set(true);
    });
  }

  private installPointLayer(map: MapLibreMap): void {
    map.addSource(POINT_SOURCE, { type: 'geojson', data: toPointFeatureCollection(this.point()) });
    map.addLayer({
      id: POINT_LAYER,
      type: 'circle',
      source: POINT_SOURCE,
      paint: { 'circle-radius': 8, 'circle-stroke-width': 3 },
    });
  }

  private applyPointPaint(map: MapLibreMap): void {
    if (!map.getLayer(POINT_LAYER)) {
      return;
    }
    map.setPaintProperty(
      POINT_LAYER,
      'circle-color',
      readCssVar(this.document.documentElement, '--color-primary-strong', '#2d6ec7'),
    );
    map.setPaintProperty(
      POINT_LAYER,
      'circle-stroke-color',
      readCssVar(this.document.documentElement, '--color-on-primary', '#ffffff'),
    );
  }

  private bindInteractions(map: MapLibreMap): void {
    // Click empty space to place/move the point.
    map.on('click', (event) => {
      if (this.disabled) {
        return;
      }
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      this.commitPoint({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }, false);
    });

    // Drag the existing point.
    map.on('mousedown', POINT_LAYER, (event) => {
      if (this.disabled) {
        return;
      }
      event.preventDefault();
      map.dragPan.disable();
      const onMove = (move: { lngLat: { lng: number; lat: number } }): void => {
        this.commitPoint({ latitude: move.lngLat.lat, longitude: move.lngLat.lng }, false);
      };
      const onUp = (): void => {
        map.off('mousemove', onMove);
        map.dragPan.enable();
        this.suppressNextClick = true;
      };
      map.on('mousemove', onMove);
      map.once('mouseup', onUp);
    });

    map.on('mouseenter', POINT_LAYER, () => {
      if (!this.disabled) {
        map.getCanvas().style.cursor = 'move';
      }
    });
    map.on('mouseleave', POINT_LAYER, () => {
      map.getCanvas().style.cursor = this.disabled ? '' : 'crosshair';
    });
  }

  /** Sets the point from a gesture: updates state (→ layer via effect), value, view. */
  private commitPoint(coords: LatLng, fly: boolean): void {
    this.results.set([]);
    this.point.set(coords);
    this.onChange(`${coords.latitude},${coords.longitude}`);
    this.onTouched();
    if (fly && this.map !== null) {
      this.map.easeTo({
        center: [coords.longitude, coords.latitude],
        zoom: Math.max(this.map.getZoom(), 15),
        duration: 500,
      });
    }
  }
}
