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
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import {
  Badge,
  Card,
  Container,
  EmptyState,
  Select,
  Spinner,
  Text,
  ThemeService,
} from '../../../components/ui';
import type { FieldOption } from '../../../components/ui';
import { PageHeader } from '../../../components/dynamic';
import {
  applyBaseMapTheme,
  createBaseMapStyle,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  readCssVar,
} from '../../../components/map';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { AnnotationService } from '../annotation.service';
import { NeighborhoodService } from '../../neighborhoods/neighborhood.service';
import { CitizenService } from '../../citizens/citizen.service';
import { EntityService } from '../../entities/entity.service';
import { InterestedPartyService } from '../../interested-parties/interested-party.service';
import { CityService } from '../../cities/city.service';
import { CommuneService } from '../../communes/commune.service';
import { DepartmentService } from '../../departments/department.service';
import { toFieldOptions, toLabelMap } from '../../shared/reference-options';
import { ACTIVE_STATUS_OPTIONS } from '../../shared/status';
import type { ActiveStatus } from '../../shared/status';
import type { Annotation } from '../../../models/annotation.model';

const ANNOTATIONS_SOURCE = 'annotations';
const ANNOTATIONS_HALO_LAYER = 'annotations-halo';
const ANNOTATIONS_MARKER_LAYER = 'annotations-marker';
const ANNOTATIONS_LABEL_LAYER = 'annotations-label';
const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

const usesTokenBasemap = (): boolean => environment.mapStyleUrl === '';

interface AnnotationMarkerProps {
  id: number;
  description: string;
  neighborhood: string;
  citizen: string;
  status: ActiveStatus;
}

function annotationToFeature(
  annotation: Annotation,
  neighborhood: string,
  citizen: string,
): Feature<Point, AnnotationMarkerProps> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [annotation.longitude, annotation.latitude] },
    properties: {
      id: annotation.id,
      description: annotation.description,
      neighborhood,
      citizen,
      status: annotation.status,
    },
  };
}

const STATUS_LABEL: Record<ActiveStatus, string> = {
  active: 'Activa',
  inactive: 'Inactiva',
};

/**
 * Annotations map page. Loads annotations, neighborhoods, citizens, entities
 * and interested-parties once, then filters in memory via computed signals.
 * The entity filter works through the interested_parties join table:
 *   Annotation ─ InterestedParty ─ Entity
 *
 * Also supports filtering by city (via commune → neighborhood lookup) and
 * department (to cascade city options). Officials see only their entity's
 * annotations via AuthService.officialEntityId.
 */
@Component({
  selector: 'app-annotation-map',
  imports: [
    ReactiveFormsModule,
    Badge,
    Card,
    Container,
    EmptyState,
    Select,
    Spinner,
    Text,
    PageHeader,
  ],
  templateUrl: './annotation-map.html',
  styleUrl: './annotation-map.scss',
})
export class AnnotationMap {
  private readonly annotationService = inject(AnnotationService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly citizenService = inject(CitizenService);
  private readonly entityService = inject(EntityService);
  private readonly interestedPartyService = inject(InterestedPartyService);
  private readonly cityService = inject(CityService);
  private readonly communeService = inject(CommuneService);
  private readonly departmentService = inject(DepartmentService);
  private readonly authService = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: MapLibreMap | null = null;
  private readonly mapReady = signal(false);

  protected readonly neighborhoodControl = new FormControl<string | null>(null);
  protected readonly statusControl = new FormControl<string | null>(null);
  protected readonly entityControl = new FormControl<string | null>(null);
  protected readonly cityControl = new FormControl<string | null>(null);
  protected readonly departmentControl = new FormControl<string | null>(null);

  /** Annotation selected on map click — drives the detail sidebar. */
  protected readonly selectedAnnotation = signal<AnnotationMarkerProps | null>(null);

  private readonly neighborhoodFilter = toSignal(
    this.neighborhoodControl.valueChanges.pipe(startWith(null)),
    { initialValue: null },
  );
  private readonly statusFilter = toSignal(
    this.statusControl.valueChanges.pipe(startWith(null)),
    { initialValue: null },
  );
  private readonly entityFilter = toSignal(
    this.entityControl.valueChanges.pipe(startWith(null)),
    { initialValue: null },
  );
  private readonly cityFilter = toSignal(
    this.cityControl.valueChanges.pipe(startWith(null)),
    { initialValue: null },
  );
  private readonly departmentFilter = toSignal(
    this.departmentControl.valueChanges.pipe(startWith(null)),
    { initialValue: null },
  );

  private readonly neighborhoodNames = computed(() =>
    toLabelMap(this.neighborhoodService.neighborhoods(), (n) => n.name),
  );
  private readonly citizenNames = computed(() =>
    toLabelMap(this.citizenService.citizens(), (c) => c.name),
  );

  /**
   * annotation id → Set of entity ids, built from the interested_parties join.
   * Used to decide which annotations belong to a selected entity without a
   * server-side join or a per-annotation request.
   */
  protected readonly annotationEntityIndex = computed(() => {
    const index = new Map<number, Set<number>>();
    for (const party of this.interestedPartyService.parties()) {
      const existing = index.get(party.idAnnotation) ?? new Set<number>();
      existing.add(party.idEntity);
      index.set(party.idAnnotation, existing);
    }
    return index;
  });

  /** city id → Set of neighborhood ids (for city filter). */
  private readonly neighborhoodIdsByCity = computed(() => {
    const map = new Map<number, Set<number>>();
    const communesByCity = new Map<number, number[]>();

    for (const commune of this.communeService.communes()) {
      const existing = communesByCity.get(commune.idCity) ?? [];
      existing.push(commune.id);
      communesByCity.set(commune.idCity, existing);
    }

    for (const neighborhood of this.neighborhoodService.neighborhoods()) {
      // Find city via commune
      for (const [cityId, communeIds] of communesByCity.entries()) {
        if (communeIds.includes(neighborhood.idCommune)) {
          const existing = map.get(cityId) ?? new Set<number>();
          existing.add(neighborhood.id);
          map.set(cityId, existing);
          break;
        }
      }
    }
    return map;
  });

  /** entity id → name map for the sidebar display. */
  protected readonly entityNames = computed(() =>
    toLabelMap(this.entityService.entities(), (e) => e.name),
  );

  protected readonly departmentOptions = computed<readonly FieldOption[]>(() => [
    { value: '', label: 'Todos los departamentos' },
    ...[...toFieldOptions(this.departmentService.departments(), (d) => d.name)].sort((a, b) =>
      a.label.localeCompare(b.label, 'es'),
    ),
  ]);

  protected readonly cityOptions = computed<readonly FieldOption[]>(() => {
    const dept = this.departmentFilter();
    const cities = dept
      ? this.cityService.cities().filter((c) => String(c.idDepartment) === dept)
      : this.cityService.cities();
    return [
      { value: '', label: 'Todas las ciudades' },
      ...[...toFieldOptions(cities, (c) => c.name)].sort((a, b) =>
        a.label.localeCompare(b.label, 'es'),
      ),
    ];
  });

  protected readonly neighborhoodOptions = computed<readonly FieldOption[]>(() => [
    { value: '', label: 'Todos los barrios' },
    ...toFieldOptions(this.neighborhoodService.neighborhoods(), (n) => n.name),
  ]);

  protected readonly entityOptions = computed<readonly FieldOption[]>(() => [
    { value: '', label: 'Todas las entidades' },
    ...toFieldOptions(this.entityService.entities(), (e) => e.name),
  ]);

  protected readonly statusOptions: readonly FieldOption[] = [
    { value: '', label: 'Todos los estados' },
    ...ACTIVE_STATUS_OPTIONS,
  ];

  protected readonly filtered = computed(() => {
    const neighborhood = this.neighborhoodFilter();
    const status = this.statusFilter();
    const entity = this.entityFilter();
    const city = this.cityFilter();
    const index = this.annotationEntityIndex();
    const neighborhoodIdsByCity = this.neighborhoodIdsByCity();
    const officialEntityId = this.authService.officialEntityId();
    const role = this.authService.role();

    return this.annotationService.annotations().filter((a) => {
      // Official role: only show annotations belonging to their entity.
      if (role === 'official' && officialEntityId !== null) {
        if (!index.get(a.id)?.has(officialEntityId)) return false;
      }

      if (neighborhood && String(a.idNeighborhood) !== neighborhood) return false;
      if (status && a.status !== status) return false;
      if (entity && !index.get(a.id)?.has(Number(entity))) return false;

      // City filter: annotation's neighborhood must belong to the selected city.
      if (city) {
        const cityNeighborhoods = neighborhoodIdsByCity.get(Number(city));
        if (cityNeighborhoods === undefined || !cityNeighborhoods.has(a.idNeighborhood)) {
          return false;
        }
      }

      return true;
    });
  });

  protected readonly activeCount = computed(
    () => this.filtered().filter((a) => a.status === 'active').length,
  );
  protected readonly inactiveCount = computed(
    () => this.filtered().filter((a) => a.status === 'inactive').length,
  );
  protected readonly isLoading = computed(
    () =>
      this.annotationService.isLoading() ||
      this.neighborhoodService.isLoading() ||
      this.citizenService.isLoading() ||
      this.entityService.isLoading() ||
      this.interestedPartyService.isLoading() ||
      this.cityService.isLoading() ||
      this.communeService.isLoading() ||
      this.departmentService.isLoading(),
  );
  protected readonly hasNone = computed(() => this.filtered().length === 0);

  protected readonly emptyMessage = computed(() => {
    const hasFilters =
      this.neighborhoodFilter() ||
      this.statusFilter() ||
      this.entityFilter() ||
      this.cityFilter() ||
      this.departmentFilter();
    return hasFilters
      ? 'No hay anotaciones que coincidan con los filtros seleccionados.'
      : 'No hay anotaciones registradas con coordenadas.';
  });

  /** Entity names for the selected annotation sidebar. */
  protected readonly selectedAnnotationEntities = computed(() => {
    const ann = this.selectedAnnotation();
    if (ann === null) return [];
    const entityIds = this.annotationEntityIndex().get(ann.id);
    if (entityIds === undefined) return [];
    const names = this.entityNames();
    return [...entityIds].map((id) => names.get(String(id)) ?? `Entidad #${id}`);
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.annotationService.loadAll();
      void this.neighborhoodService.loadAll();
      void this.citizenService.loadAll();
      void this.entityService.loadAll();
      void this.interestedPartyService.loadAll();
      void this.cityService.loadAll();
      void this.communeService.loadAll();
      void this.departmentService.loadAll();
    }

    afterNextRender(() => void this.initMap());

    effect(() => {
      const annotations = this.filtered();
      if (!this.mapReady() || this.map === null) return;
      const neighborhoods = this.neighborhoodNames();
      const citizens = this.citizenNames();
      const collection: FeatureCollection = {
        type: 'FeatureCollection',
        features: annotations.map((a) =>
          annotationToFeature(
            a,
            neighborhoods.get(String(a.idNeighborhood)) ?? '—',
            citizens.get(String(a.idCitizen)) ?? '—',
          ),
        ),
      };
      (this.map.getSource(ANNOTATIONS_SOURCE) as GeoJSONSource | undefined)?.setData(collection);
    });

    effect(() => {
      this.theme.scheme();
      if (this.mapReady() && this.map !== null) {
        if (usesTokenBasemap()) applyBaseMapTheme(this.map, this.document.documentElement);
        this.applyPaint(this.map);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.map?.remove();
      this.map = null;
    });
  }

  protected closeSidebar(): void {
    this.selectedAnnotation.set(null);
  }

  private async initMap(): Promise<void> {
    const container = this.mapContainer()?.nativeElement;
    if (container === undefined) return;

    const maplibregl = await import('maplibre-gl');
    const style = usesTokenBasemap() ? createBaseMapStyle() : environment.mapStyleUrl;

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
      this.bindInteractions(map);
      this.mapReady.set(true);
    });
  }

  private installLayers(map: MapLibreMap): void {
    map.addSource(ANNOTATIONS_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });

    map.addLayer({
      id: ANNOTATIONS_HALO_LAYER,
      type: 'circle',
      source: ANNOTATIONS_SOURCE,
      filter: ['==', ['get', 'status'], 'active'],
      paint: { 'circle-radius': 16, 'circle-opacity': 0.15, 'circle-stroke-width': 0 },
    });

    map.addLayer({
      id: ANNOTATIONS_MARKER_LAYER,
      type: 'circle',
      source: ANNOTATIONS_SOURCE,
      paint: {
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-opacity': ['case', ['==', ['get', 'status'], 'inactive'], 0.35, 1.0],
        'circle-stroke-opacity': ['case', ['==', ['get', 'status'], 'inactive'], 0.35, 1.0],
      },
    });

    map.addLayer({
      id: ANNOTATIONS_LABEL_LAYER,
      type: 'symbol',
      source: ANNOTATIONS_SOURCE,
      layout: {
        'text-field': ['slice', ['get', 'description'], 0, 30],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
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
    const muted = readCssVar(root, '--color-text-muted', 'rgba(255,255,255,0.5)');
    const text = readCssVar(root, '--color-text', 'rgba(255,255,255,0.92)');
    const bg = readCssVar(root, '--color-background', '#181c2e');

    map.setPaintProperty(ANNOTATIONS_HALO_LAYER, 'circle-color', primary);
    map.setPaintProperty(ANNOTATIONS_MARKER_LAYER, 'circle-color', [
      'case', ['==', ['get', 'status'], 'active'], primary, muted,
    ]);
    map.setPaintProperty(ANNOTATIONS_MARKER_LAYER, 'circle-stroke-color', primarySoft);
    map.setPaintProperty(ANNOTATIONS_LABEL_LAYER, 'text-color', text);
    map.setPaintProperty(ANNOTATIONS_LABEL_LAYER, 'text-halo-color', bg);
  }

  private bindInteractions(map: MapLibreMap): void {
    map.on('click', ANNOTATIONS_MARKER_LAYER, (event) => {
      const feature = event.features?.[0];
      if (feature === undefined) return;
      const props = feature.properties as AnnotationMarkerProps;
      this.selectedAnnotation.set(props);
    });
  }
}

