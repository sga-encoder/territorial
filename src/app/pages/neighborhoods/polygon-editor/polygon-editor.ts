import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { FeatureCollection } from 'geojson';
import {
  Badge,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  EmptyState,
  Icon,
  ModalService,
  Select,
  Spinner,
  Text,
  Title,
  ToastService,
} from '../../../components/ui';
import type { BadgeVariant, FieldOption } from '../../../components/ui';
import { PageHeader } from '../../../components/dynamic';
import type { PageHeaderAction } from '../../../components/dynamic';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { CityService } from '../../cities/city.service';
import { CommuneService } from '../../communes/commune.service';
import { NeighborhoodService } from '../neighborhood.service';
import { NeighborhoodPolygonService } from '../neighborhood-polygon.service';
import type { NeighborhoodPolygon } from '../../../models/neighborhood-polygon';
import { PolygonEditorState } from './polygon-editor-state';
import { PolygonMap } from './polygon-map';
import { toOverviewFeatureCollection } from './polygon-geometry';

const PAGE_SUBTITLE =
  'Traza y ajusta sobre el mapa el polígono que delimita cada barrio (CU-09 / CU-10).';

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

/**
 * Page container for the neighborhood polygon editor. It orchestrates the flow —
 * pick a city → pick a neighborhood → load its polygon → edit on the map → save —
 * while every concern stays in its own layer: editing state in {@link PolygonEditorState}
 * (provided here, shared with the child map), persistence in
 * {@link NeighborhoodPolygonService}, render/interaction in {@link PolygonMap}.
 */
@Component({
  selector: 'app-polygon-editor',
  imports: [
    ReactiveFormsModule,
    Badge,
    Button,
    Card,
    Chip,
    Container,
    Divider,
    EmptyState,
    Icon,
    Select,
    Spinner,
    Text,
    Title,
    PageHeader,
    PolygonMap,
  ],
  templateUrl: './polygon-editor.html',
  providers: [PolygonEditorState],
})
export class PolygonEditor {
  protected readonly state = inject(PolygonEditorState);
  private readonly cityService = inject(CityService);
  private readonly communeService = inject(CommuneService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly polygonService = inject(NeighborhoodPolygonService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly map = viewChild(PolygonMap);

  protected readonly subtitle = PAGE_SUBTITLE;

  protected readonly cityControl = new FormControl<string | null>(null);
  protected readonly neighborhoodControl = new FormControl<string | null>(null);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly toolsOpen = signal(true);

  /** GeoJSON passed to PolygonMap to render all city boundaries when no neighborhood is selected. */
  protected readonly overviewPolygons = signal<FeatureCollection>(EMPTY_FC);

  private readonly cityValue = toSignal(this.cityControl.valueChanges, { initialValue: null });

  protected readonly cityOptions = computed<readonly FieldOption[]>(() =>
    this.cityService.cities().map((city) => ({ value: String(city.id), label: city.name })),
  );

  /** Neighborhoods filtered by the selected city (all if no city selected). */
  protected readonly neighborhoodOptions = computed<readonly FieldOption[]>(() => {
    const cityId = Number(this.cityValue());
    if (!cityId) {
      return this.neighborhoodService
        .neighborhoods()
        .map((n) => ({ value: String(n.id), label: n.name }));
    }
    const communeIds = new Set(
      this.communeService.communes()
        .filter((c) => c.idCity === cityId)
        .map((c) => c.id),
    );
    return this.neighborhoodService
      .neighborhoods()
      .filter((n) => communeIds.has(n.idCommune))
      .map((n) => ({ value: String(n.id), label: n.name }));
  });

  /** The neighborhood currently loaded into the editor (from state). */
  protected readonly neighborhood = this.state.neighborhood;

  protected readonly canSave = computed(
    () =>
      this.state.validation().isValid &&
      this.state.isDirty() &&
      !this.saving() &&
      !this.loading(),
  );

  protected readonly headerActions = computed<readonly PageHeaderAction[]>(() => {
    if (this.neighborhood() === null) {
      return [];
    }
    return [
      {
        id: 'save',
        label: 'Guardar',
        icon: 'save',
        variant: 'primary',
        disabled: !this.canSave(),
        loading: this.saving(),
        run: () => void this.save(),
      },
      {
        id: 'discard',
        label: 'Descartar',
        icon: 'close',
        variant: 'secondary',
        disabled: !this.state.isDirty() || this.saving(),
        run: () => void this.discard(),
      },
    ];
  });

  protected readonly statusBadge = computed<{ readonly label: string; readonly variant: BadgeVariant }>(
    () => {
      if (this.state.vertexCount() === 0) return { label: 'Sin demarcar', variant: 'neutral' };
      if (!this.state.validation().isValid) return { label: 'Incompleto', variant: 'warning' };
      return { label: 'Demarcado', variant: 'success' };
    },
  );

  protected readonly validationHint = computed<string | null>(() => {
    const issues = this.state.validation().issues;
    if (issues.includes('too-few-vertices')) return 'Un polígono necesita al menos 3 vértices.';
    if (issues.includes('duplicate-vertices'))
      return 'Hay vértices superpuestos; sepáralos para cerrar el anillo.';
    return null;
  });

  constructor() {
    if (this.isBrowser) {
      void this.cityService.loadAll();
      void this.communeService.loadAll();
      void this.neighborhoodService.loadAll();
    }

    // When the city changes: reset neighborhood selection and load the city overview.
    this.cityControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((cityId) => {
      this.neighborhoodControl.setValue(null, { emitEvent: false });
      this.state.reset();
      this.loadError.set(null);
      if (cityId !== null) {
        void this.loadCityOverview(Number(cityId));
      } else {
        this.overviewPolygons.set(EMPTY_FC);
      }
    });

    this.neighborhoodControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => void this.onNeighborhoodSelected(id));
  }

  private async onNeighborhoodSelected(id: string | null): Promise<void> {
    // When the user clears the neighborhood, show the city overview again.
    if (id === null) {
      const cityId = Number(this.cityControl.value);
      if (cityId) {
        void this.loadCityOverview(cityId);
      }
      this.state.reset();
      return;
    }
    // Guard unsaved edits before switching neighborhoods.
    if (this.state.isDirty() && !(await this.confirmDiscard())) {
      const current = this.neighborhood();
      this.neighborhoodControl.setValue(current !== null ? String(current.id) : null, {
        emitEvent: false,
      });
      return;
    }
    // Hide overview while editing a specific neighborhood.
    this.overviewPolygons.set(EMPTY_FC);
    await this.loadPolygon(Number(id));
  }

  /** Loads all polygons for the given city and sends them to the map overview layer. */
  private async loadCityOverview(cityId: number): Promise<void> {
    const communeIds = new Set(
      this.communeService.communes()
        .filter((c) => c.idCity === cityId)
        .map((c) => c.id),
    );
    const cityNeighborhoods = this.neighborhoodService
      .neighborhoods()
      .filter((n) => communeIds.has(n.idCommune));

    if (cityNeighborhoods.length === 0) {
      this.overviewPolygons.set(EMPTY_FC);
      return;
    }

    this.loading.set(true);
    const results = await Promise.allSettled(
      cityNeighborhoods.map((n) => firstValueFrom(this.polygonService.getPolygon(n))),
    );
    this.loading.set(false);

    const polygons = results
      .filter((r): r is PromiseFulfilledResult<NeighborhoodPolygon> => r.status === 'fulfilled')
      .map((r) => r.value);

    const fc = toOverviewFeatureCollection(polygons);
    this.overviewPolygons.set(fc);

    if (fc.features.length > 0) {
      queueMicrotask(() => this.map()?.fitToFeatureCollection(fc));
    }
  }

  private async loadPolygon(id: number): Promise<void> {
    const neighborhood = this.neighborhoodService.neighborhoods().find((n) => n.id === id);
    if (neighborhood === undefined) return;
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const polygon = await firstValueFrom(this.polygonService.getPolygon(neighborhood));
      this.state.loadFrom(polygon, neighborhood);
      queueMicrotask(() => this.map()?.fitToPolygon());
    } catch (error) {
      this.loadError.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  protected reloadCurrent(): void {
    const neighborhood = this.neighborhood();
    if (neighborhood !== null) {
      void this.loadPolygon(neighborhood.id);
    }
  }

  protected async save(): Promise<void> {
    const neighborhood = this.neighborhood();
    if (neighborhood === null || !this.canSave()) return;
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.polygonService.savePolygon(neighborhood, this.state.baseline(), this.state.vertices()),
      );
      await this.loadPolygon(neighborhood.id);
      this.toast.success('Polígono guardado correctamente.');
    } catch (error) {
      this.toast.error((error as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  protected async discard(): Promise<void> {
    if (this.state.isDirty() && (await this.confirmDiscard())) {
      this.state.reset();
    }
  }

  protected async clearAll(): Promise<void> {
    if (this.state.vertexCount() === 0) return;
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Limpiar vértices',
      size: 'sm',
      inputs: {
        message: '¿Eliminar todos los vértices del polígono? Podrás deshacer esta acción.',
        confirmLabel: 'Limpiar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) this.state.clearAll();
  }

  private async confirmDiscard(): Promise<boolean> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Descartar cambios',
      size: 'sm',
      inputs: {
        message: 'Tienes cambios sin guardar en el polígono. ¿Descartarlos?',
        confirmLabel: 'Descartar',
        confirmVariant: 'danger',
      },
    });
    return confirmed === true;
  }

  protected toggleEdit(): void { this.state.toggleMode(); }
  protected fitToPolygon(): void { this.map()?.fitToPolygon(); }
  protected zoomIn(): void { this.map()?.zoomIn(); }
  protected zoomOut(): void { this.map()?.zoomOut(); }

  protected formatCoordinate(value: number): string {
    return value.toFixed(5);
  }
}
