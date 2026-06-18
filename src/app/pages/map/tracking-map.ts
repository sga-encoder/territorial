import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import type { GeoJSONSource, Map as MapLibreMap, Popup as MapLibrePopup } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import {
  Badge,
  Card,
  Container,
  EmptyState,
  Select,
  Spinner,
  ThemeService,
} from '../../components/ui';
import type { FieldOption } from '../../components/ui';
import { PageHeader } from '../../components/dynamic';
import {
  applyBaseMapTheme,
  createBaseMapStyle,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  readCssVar,
} from '../../components/map';
import { environment } from '../../../environments/environment';
import { EntityService } from '../entities/entity.service';
import { toFieldOptions, toLabelMap } from '../shared/reference-options';
import {
  TrackingMapService,
  type OfficialConnectionState,
  type TrackedOfficial,
} from './tracking-map.service';

const OFFICIALS_SOURCE = 'officials';
const OFFICIALS_HALO_LAYER = 'officials-halo';
const OFFICIALS_MARKER_LAYER = 'officials-marker';
const OFFICIALS_LABEL_LAYER = 'officials-label';
const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

const usesTokenBasemap = (): boolean => environment.mapStyleUrl === '';

interface OfficialMarkerProps {
  id: number;
  name: string;
  role: string;
  entity: string;
  state: OfficialConnectionState;
  lastUpdate: string | null;
}

function officialToFeature(
  { official, state, latitude, longitude, lastUpdate }: TrackedOfficial,
  entityName: string,
): Feature<Point, OfficialMarkerProps> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      id: official.id,
      name: official.name,
      role: official.role,
      entity: entityName,
      state,
      lastUpdate,
    },
  };
}

const STATE_LABEL: Record<OfficialConnectionState, string> = {
  online: 'En línea',
  stale: 'Sin señal',
  offline: 'Desconectado',
};

/**
 * Tracking map page (CU-tracking). Polls official GPS positions every 10 s
 * and renders them as MapLibre circle markers. Active markers are full-color;
 * offline markers are dimmed. A filter narrows the view by entity.
 */
@Component({
  selector: 'app-tracking-map',
  imports: [ReactiveFormsModule, Badge, Card, Container, EmptyState, Select, Spinner, PageHeader],
  templateUrl: './tracking-map.html',
  styleUrl: './tracking-map.scss',
})
export class TrackingMap {
  protected readonly trackingService = inject(TrackingMapService);
  private readonly entityService = inject(EntityService);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: MapLibreMap | null = null;
  private popup: MapLibrePopup | null = null;
  private readonly mapReady = signal(false);

  protected readonly entityControl = new FormControl<string | null>(null);
  private readonly entityFilter = toSignal(
    this.entityControl.valueChanges.pipe(startWith(null)),
    { initialValue: null },
  );

  private readonly entityNames = computed(() =>
    toLabelMap(this.entityService.entities(), (e) => e.name),
  );

  protected readonly entityOptions = computed<readonly FieldOption[]>(() => [
    { value: '', label: 'Todas las entidades' },
    ...toFieldOptions(this.entityService.entities(), (e) => e.name),
  ]);

  protected readonly filteredTracked = computed(() => {
    const filter = this.entityFilter();
    const all = this.trackingService.tracked();
    if (!filter) return all;
    return all.filter((t) => String(t.official.idEntity) === filter);
  });

  protected readonly onlineCount = computed(
    () => this.filteredTracked().filter((t) => t.state === 'online').length,
  );

  protected readonly staleCount = computed(
    () => this.filteredTracked().filter((t) => t.state !== 'online').length,
  );

  protected readonly hasNoMappable = computed(() => this.filteredTracked().length === 0);

  protected readonly emptyMessage = computed(() =>
    this.entityFilter()
      ? 'No hay funcionarios con posición GPS en la entidad seleccionada.'
      : 'No hay funcionarios con posición GPS activa.',
  );

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.entityService.loadAll();
      void this.trackingService.start();
    }

    inject(DestroyRef).onDestroy(() => void this.trackingService.stop());

    afterNextRender(() => void this.initMap());

    // Sync the GeoJSON source whenever the filtered set or entity names change.
    effect(() => {
      const tracked = this.filteredTracked();
      if (!this.mapReady() || this.map === null) return;
      const names = this.entityNames();
      const collection: FeatureCollection = {
        type: 'FeatureCollection',
        features: tracked.map((t) =>
          officialToFeature(t, names.get(String(t.official.idEntity)) ?? '—'),
        ),
      };
      (this.map.getSource(OFFICIALS_SOURCE) as GeoJSONSource | undefined)?.setData(collection);
    });

    effect(() => {
      this.theme.scheme();
      if (this.mapReady() && this.map !== null) {
        if (usesTokenBasemap()) applyBaseMapTheme(this.map, this.document.documentElement);
        this.applyPaint(this.map);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.trackingService.stop();
      this.popup?.remove();
      this.map?.remove();
      this.map = null;
    });
  }

  private async initMap(): Promise<void> {
    const container = this.mapContainer()?.nativeElement;
    if (container === undefined) return;

    const maplibregl = await import('maplibre-gl');
    const style = usesTokenBasemap() ? createBaseMapStyle() : environment.mapStyleUrl;

    this.popup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px', offset: 10 });

    const map = new maplibregl.Map({
      container,
      style,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    this.map = map;

    map.on('load', () => {
      if (usesTokenBasemap()) applyBaseMapTheme(map, this.document.documentElement);
      this.installLayers(map);
      this.applyPaint(map);
      this.bindInteractions(map, this.popup!);
      this.mapReady.set(true);
    });
  }

  private installLayers(map: MapLibreMap): void {
    map.addSource(OFFICIALS_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });

    // Outer glow — only shown for online officials.
    map.addLayer({
      id: OFFICIALS_HALO_LAYER,
      type: 'circle',
      source: OFFICIALS_SOURCE,
      filter: ['==', ['get', 'state'], 'online'],
      paint: { 'circle-radius': 16, 'circle-opacity': 0.15, 'circle-stroke-width': 0 },
    });

    map.addLayer({
      id: OFFICIALS_MARKER_LAYER,
      type: 'circle',
      source: OFFICIALS_SOURCE,
      paint: {
        'circle-radius': 8,
        'circle-stroke-width': 2,
        // Offline markers are dimmed; stale and online are full opacity.
        'circle-opacity': ['case', ['==', ['get', 'state'], 'offline'], 0.35, 1.0],
        'circle-stroke-opacity': ['case', ['==', ['get', 'state'], 'offline'], 0.35, 1.0],
      },
    });

    map.addLayer({
      id: OFFICIALS_LABEL_LAYER,
      type: 'symbol',
      source: OFFICIALS_SOURCE,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
      },
      paint: { 'text-halo-width': 1.2 },
    });
  }

  private applyPaint(map: MapLibreMap): void {
    const root = this.document.documentElement;
    const primary = readCssVar(root, '--color-primary', '#4a8fe7');
    const primarySoft = readCssVar(root, '--color-primary-soft', '#7aaff0');
    const warning = readCssVar(root, '--color-warning', '#fbbf24');
    const muted = readCssVar(root, '--color-text-muted', 'rgba(255,255,255,0.5)');
    const text = readCssVar(root, '--color-text', 'rgba(255,255,255,0.92)');
    const bg = readCssVar(root, '--color-background', '#181c2e');

    const markerColor = [
      'case',
      ['==', ['get', 'state'], 'online'], primary,
      ['==', ['get', 'state'], 'stale'], warning,
      muted,
    ];

    map.setPaintProperty(OFFICIALS_HALO_LAYER, 'circle-color', primary);
    map.setPaintProperty(OFFICIALS_MARKER_LAYER, 'circle-color', markerColor);
    map.setPaintProperty(OFFICIALS_MARKER_LAYER, 'circle-stroke-color', primarySoft);
    map.setPaintProperty(OFFICIALS_LABEL_LAYER, 'text-color', text);
    map.setPaintProperty(OFFICIALS_LABEL_LAYER, 'text-halo-color', bg);
  }

  private bindInteractions(map: MapLibreMap, popup: MapLibrePopup): void {
    map.on('click', OFFICIALS_MARKER_LAYER, (event) => {
      const feature = event.features?.[0];
      if (feature === undefined) return;
      const props = feature.properties as OfficialMarkerProps;
      const coords = (feature.geometry as { type: 'Point'; coordinates: [number, number] })
        .coordinates;
      const lastUpdate = props.lastUpdate
        ? new Date(props.lastUpdate).toLocaleString('es-CO')
        : 'Sin datos';

      popup
        .setLngLat(coords)
        .setHTML(
          `<div style="min-width:180px">
            <p style="margin:0 0 2px;font-weight:600;font-size:14px">${props.name}</p>
            <p style="margin:0 0 2px;font-size:12px;opacity:.75">${props.role}</p>
            <p style="margin:0 0 8px;font-size:12px;opacity:.55">${props.entity}</p>
            <p style="margin:0;font-size:11px">Estado: <strong>${STATE_LABEL[props.state]}</strong></p>
            <p style="margin:3px 0 0;font-size:11px;opacity:.6">Última pos.: ${lastUpdate}</p>
          </div>`,
        )
        .addTo(map);
    });

  }
}
