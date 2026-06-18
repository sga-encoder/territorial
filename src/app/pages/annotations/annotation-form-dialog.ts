import { isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import {
  Button,
  ModalService,
  Select,
  Spinner,
  Text,
  TextArea,
  Title,
  fieldErrorMessage,
} from '../../components/ui';
import type { FieldOption } from '../../components/ui';
import { DynamicTable, Filter } from '../../components/dynamic';
import type { DynamicColumn, FilterConfig } from '../../components/dynamic';
import type { TableRow } from '../../components/ui';
import { MapPointPicker } from '../../components/map';
import type { Annotation } from '../../models/annotation.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../shared/status';
import { toFieldOptions } from '../shared/reference-options';
import { AnnotationService } from './annotation.service';
import { NeighborhoodService } from '../neighborhoods/neighborhood.service';
import { CitizenService } from '../citizens/citizen.service';
import { EntityService } from '../entities/entity.service';
import { InterestedPartyService } from '../interested-parties/interested-party.service';
import { CityService } from '../cities/city.service';
import { DepartmentService } from '../departments/department.service';
import { CommuneService } from '../communes/commune.service';
import type { CreateModel } from '../../core/http/create-model';

/** Create/Edit Annotation — 3-step wizard: zone info → entities → location on map. */
@Component({
  selector: 'app-annotation-form-dialog',
  imports: [
    ReactiveFormsModule,
    Button,
    DynamicTable,
    Filter,
    MapPointPicker,
    Select,
    Spinner,
    Text,
    TextArea,
    Title,
  ],
  template: `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <!-- Step indicator -->
      <div style="display:flex;gap:0.5rem;align-items:center">
        @for (s of [1, 2, 3]; track s) {
          <span
            style="display:inline-flex;align-items:center;justify-content:center;width:1.75rem;height:1.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;transition:background 0.15s"
            [style.background]="step() === s ? 'var(--color-primary)' : step() > s ? 'var(--color-success)' : 'var(--color-surface-raised)'"
            [style.color]="step() >= s ? 'var(--color-text-on-primary)' : 'var(--color-text-muted)'"
          >{{ s }}</span>
          @if (s < 3) {
            <div style="flex:1;height:2px;background:var(--color-border)"></div>
          }
        }
      </div>

      <!-- ── STEP 1: Información ─────────────────────────────────── -->
      @if (step() === 1) {
        <div style="display:flex;flex-direction:column;gap:1rem">
          <ui-title [level]="5">Información de la anotación</ui-title>

          @if (annotationService.error(); as msg) {
            <ui-text color="danger">{{ msg }}</ui-text>
          }

          <!-- Zone cascade (for map pre-loading only, not sent to backend) -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <ui-select
              [formControl]="deptControl"
              label="Departamento"
              placeholder="Seleccionar…"
              [options]="deptOptions()"
              [searchable]="true"
              [sort]="true"
            />
            <ui-select
              [formControl]="cityControl"
              label="Ciudad"
              placeholder="Seleccionar…"
              [options]="cityOptions()"
              [searchable]="true"
              [sort]="true"
            />
          </div>

          <ui-select
            [formControl]="neighborhoodControl"
            label="Barrio *"
            placeholder="Seleccionar…"
            [options]="neighborhoodOptions()"
            [searchable]="true"
            [sort]="true"
            [error]="step1Submitted() ? fieldErrorMessage(neighborhoodControl, true) : null"
          />

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <ui-select
              [formControl]="citizenControl"
              label="Ciudadano *"
              placeholder="Seleccionar…"
              [options]="citizenOptions()"
              [searchable]="true"
              [error]="step1Submitted() ? fieldErrorMessage(citizenControl, true) : null"
            />
            <ui-select
              [formControl]="statusControl"
              label="Estado *"
              placeholder="Seleccionar…"
              [options]="statusOptions"
              [error]="step1Submitted() ? fieldErrorMessage(statusControl, true) : null"
            />
          </div>

          <ui-textarea
            [formControl]="descriptionControl"
            label="Descripción *"
            placeholder="Describe la anotación…"
            [error]="step1Submitted() ? fieldErrorMessage(descriptionControl, true) : null"
          />

          <div style="display:flex;justify-content:flex-end">
            <ui-button (clicked)="goToStep2()">Siguiente</ui-button>
          </div>
        </div>
      }

      <!-- ── STEP 2: Entidades interesadas ─────────────────────── -->
      @if (step() === 2) {
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div>
            <ui-title [level]="5">Entidades interesadas</ui-title>
            <ui-text size="sm" color="muted">
              Selecciona las entidades vinculadas a esta anotación (opcional).
            </ui-text>
          </div>

          @if (entityService.isLoading()) {
            <ui-spinner size="sm" color="muted" label="Cargando entidades" />
          } @else {
            <ui-filter
              [config]="entityFilterConfig"
              [data]="entityRows()"
              (filteredChange)="filteredEntityRows.set($event)"
            />
            <ui-dynamic-table
              [formControl]="selectedEntitiesControl"
              [columns]="entityColumns"
              [rows]="filteredEntityRows()"
              selectionMode="multiple"
              emptyMessage="No hay entidades para los filtros aplicados."
            />
          }

          <div style="display:flex;justify-content:space-between">
            <ui-button variant="secondary" (clicked)="goBack()">Anterior</ui-button>
            <ui-button (clicked)="goToStep3()">Siguiente</ui-button>
          </div>
        </div>
      }

      <!-- ── STEP 3: Ubicación en el mapa ──────────────────────── -->
      @if (step() === 3) {
        <div style="display:flex;flex-direction:column;gap:1rem">
          <ui-title [level]="5">Ubicación en el mapa</ui-title>

          @if (step3Submitted() && !locationControl.value) {
            <ui-text color="danger">Selecciona la ubicación en el mapa.</ui-text>
          }

          <ui-map-point-picker
            [formControl]="locationControl"
            label="Haz clic en el mapa para fijar el punto de la anotación."
          />

          <div style="display:flex;justify-content:space-between">
            <ui-button variant="secondary" (clicked)="goBack()">Anterior</ui-button>
            <ui-button
              [loading]="annotationService.isSaving()"
              (clicked)="onSave()"
            >{{ isEdit() ? 'Guardar cambios' : 'Crear anotación' }}</ui-button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AnnotationFormDialog {
  readonly annotation = input<Annotation | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly annotationService = inject(AnnotationService);
  protected readonly entityService = inject(EntityService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly citizenService = inject(CitizenService);
  private readonly interestedPartyService = inject(InterestedPartyService);
  private readonly cityService = inject(CityService);
  private readonly departmentService = inject(DepartmentService);
  private readonly communeService = inject(CommuneService);

  protected readonly step = signal<1 | 2 | 3>(1);
  protected readonly step1Submitted = signal(false);
  protected readonly step3Submitted = signal(false);
  protected readonly isEdit = computed(() => this.annotation() !== null);

  // Step 1 — zone cascade (not sent to backend)
  protected readonly deptControl = new FormControl<string | null>(null);
  protected readonly cityControl = new FormControl<string | null>(null);

  // Step 1 — annotation fields
  protected readonly neighborhoodControl = new FormControl<string | null>(null, Validators.required);
  protected readonly citizenControl = new FormControl<string | null>(null, Validators.required);
  protected readonly descriptionControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly statusControl = new FormControl<string | null>('active');

  // Step 2 — entity selection
  protected readonly selectedEntitiesControl = new FormControl<readonly TableRow[]>([], { nonNullable: true });

  // Step 3 — location
  protected readonly locationControl = new FormControl<string>('', { nonNullable: true });

  protected readonly statusOptions: readonly FieldOption[] = [...ACTIVE_STATUS_OPTIONS];

  protected readonly entityColumns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Entidad' },
    { key: 'status', header: 'Estado', type: 'badge', align: 'center', typeConfig: STATUS_BADGE_CONFIG },
  ];

  protected readonly entityFilterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Buscar entidad', type: 'text', matchMode: 'contains', placeholder: 'Nombre de entidad' },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        matchMode: 'equals',
        options: [{ value: 'active', label: 'Activa' }, { value: 'inactive', label: 'Inactiva' }],
      },
    ],
  };

  protected readonly filteredEntityRows = signal<readonly TableRow[]>([]);

  protected readonly entityRows = computed<readonly TableRow[]>(() =>
    this.entityService.entities().map((e) => ({ id: e.id, name: e.name, status: e.status })),
  );

  private readonly selectedDept = toSignal(
    this.deptControl.valueChanges.pipe(startWith(null)), { initialValue: null },
  );
  private readonly selectedCity = toSignal(
    this.cityControl.valueChanges.pipe(startWith(null)), { initialValue: null },
  );

  protected readonly deptOptions = computed<readonly FieldOption[]>(() =>
    toFieldOptions(this.departmentService.departments(), (d) => d.name),
  );

  protected readonly cityOptions = computed<readonly FieldOption[]>(() => {
    const dept = this.selectedDept();
    const cities = dept
      ? this.cityService.cities().filter((c) => String(c.idDepartment) === dept)
      : this.cityService.cities();
    return toFieldOptions(cities, (c) => c.name);
  });

  protected readonly neighborhoodOptions = computed<readonly FieldOption[]>(() => {
    const city = this.selectedCity();
    if (!city) {
      return toFieldOptions(this.neighborhoodService.neighborhoods(), (n) => n.name);
    }
    const communeIds = new Set(
      this.communeService.communes()
        .filter((c) => String(c.idCity) === city)
        .map((c) => c.id),
    );
    return toFieldOptions(
      this.neighborhoodService.neighborhoods().filter((n) => communeIds.has(n.idCommune)),
      (n) => n.name,
    );
  });

  protected readonly citizenOptions = computed<readonly FieldOption[]>(() =>
    toFieldOptions(this.citizenService.citizens(), (c) => c.name),
  );

  // Expose for template access (method call avoids closure over stale values)
  protected readonly fieldErrorMessage = fieldErrorMessage;

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (isBrowser) {
      if (!this.neighborhoodService.hasNeighborhoods()) void this.neighborhoodService.loadAll();
      if (!this.citizenService.hasCitizens()) void this.citizenService.loadAll();
      if (!this.entityService.hasEntities()) void this.entityService.loadAll();
      if (!this.interestedPartyService.hasParties()) void this.interestedPartyService.loadAll();
      if (!this.cityService.hasCities()) void this.cityService.loadAll();
      if (!this.departmentService.hasDepartments()) void this.departmentService.loadAll();
      if (!this.communeService.hasCommunes()) void this.communeService.loadAll();
    }

    // Prefill controls when editing an existing annotation.
    effect(() => {
      const annotation = this.annotation();
      if (annotation === null) return;
      this.neighborhoodControl.setValue(String(annotation.idNeighborhood), { emitEvent: false });
      this.citizenControl.setValue(String(annotation.idCitizen), { emitEvent: false });
      this.descriptionControl.setValue(annotation.description, { emitEvent: false });
      this.statusControl.setValue(annotation.status, { emitEvent: false });
      this.locationControl.setValue(`${annotation.latitude},${annotation.longitude}`, { emitEvent: false });
    });

    // Prefill entity selection when editing.
    effect(() => {
      const annotation = this.annotation();
      if (annotation === null) return;
      const allRows = this.entityRows();
      const parties = this.interestedPartyService.parties();
      const linkedEntityIds = new Set(
        parties.filter((p) => p.idAnnotation === annotation.id).map((p) => p.idEntity),
      );
      const selectedRows = allRows.filter((row) => linkedEntityIds.has(Number(row['id'])));
      this.selectedEntitiesControl.setValue(selectedRows, { emitEvent: false });
    });

    // Reset city when department changes.
    effect(() => {
      this.selectedDept();
      this.cityControl.setValue(null, { emitEvent: false });
      this.neighborhoodControl.setValue(null, { emitEvent: false });
    });

    // Reset neighborhood when city changes.
    effect(() => {
      this.selectedCity();
      this.neighborhoodControl.setValue(null, { emitEvent: false });
    });
  }

  protected goToStep2(): void {
    if (
      this.neighborhoodControl.invalid ||
      this.citizenControl.invalid ||
      this.descriptionControl.invalid
    ) {
      this.step1Submitted.set(true);
      return;
    }
    this.step.set(2);
  }

  protected goToStep3(): void {
    this.step.set(3);
  }

  protected goBack(): void {
    this.step.update((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  }

  protected async onSave(): Promise<void> {
    if (!this.locationControl.value) {
      this.step3Submitted.set(true);
      return;
    }
    const [latitude, longitude] = this.locationControl.value.split(',').map(Number);
    const draft: CreateModel<Annotation> = {
      idNeighborhood: Number(this.neighborhoodControl.value),
      idCitizen: Number(this.citizenControl.value),
      description: this.descriptionControl.value,
      latitude,
      longitude,
      status: (this.statusControl.value ?? 'active') as ActiveStatus,
    };

    const selectedEntityIds = this.selectedEntitiesControl.value.map((row) => String(row['id']));
    const annotation = this.annotation();

    if (annotation !== null) {
      const success = await this.annotationService.update({ id: annotation.id, ...draft });
      if (success) {
        await this.syncInteresados(annotation.id, selectedEntityIds);
        this.modal.close(true);
      }
    } else {
      const created = await this.annotationService.createAndReturn(draft);
      if (created !== null) {
        await this.syncInteresados(created.id, selectedEntityIds);
        this.modal.close(true);
      }
    }
  }

  private async syncInteresados(annotationId: number, selectedEntityIds: string[]): Promise<void> {
    const currentParties = this.interestedPartyService
      .parties()
      .filter((p) => p.idAnnotation === annotationId);
    const currentEntityIds = new Set(currentParties.map((p) => String(p.idEntity)));
    const nextEntityIds = new Set(selectedEntityIds);

    const toDelete = currentParties.filter((p) => !nextEntityIds.has(String(p.idEntity)));
    const toAdd = selectedEntityIds.filter((id) => !currentEntityIds.has(id));

    await Promise.all([
      ...toDelete.map((p) => this.interestedPartyService.deleteById(p.id)),
      ...toAdd.map((id) =>
        this.interestedPartyService.create({ idEntity: Number(id), idAnnotation: annotationId }),
      ),
    ]);
  }
}
