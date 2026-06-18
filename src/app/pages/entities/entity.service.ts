import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Entity } from '../../models/entity.model';
import { EntityRepository } from './entity.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las entidades. Verifica que el backend esté disponible.';
const LOAD_ONE_ERROR_MESSAGE = 'No fue posible cargar la entidad solicitada.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar la entidad. Revisa los datos e intenta de nuevo.';
// RN-04 — the backend rejects deleting entities with officials or interested parties.
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar la entidad. Si tiene funcionarios o interesados asociados, reasígnalos primero.';

/** State (signals) + orchestration for the Entity CRUD (CU-01). */
@Injectable({ providedIn: 'root' })
export class EntityService {
  private readonly repository = inject(EntityRepository);

  private readonly entitiesSignal = signal<Entity[]>([]);
  private readonly selectedEntitySignal = signal<Entity | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly entities = this.entitiesSignal.asReadonly();
  readonly selectedEntity = this.selectedEntitySignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalEntities = computed(() => this.entities().length);
  readonly hasEntities = computed(() => this.totalEntities() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.entitiesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadById(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.selectedEntitySignal.set(null);
    try {
      this.selectedEntitySignal.set(await firstValueFrom(this.repository.getById(id)));
    } catch {
      this.errorSignal.set(LOAD_ONE_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /** RN-01: duplicated names are rejected by the backend and surfaced through `error`. */
  async create(draft: CreateModel<Entity>, logo?: File): Promise<boolean> {
    return this.persist(() => this.repository.persistNew(draft, logo));
  }

  async update(entity: Entity, logo?: File): Promise<boolean> {
    return this.persist(() => this.repository.persistEdit(entity.id, entity, logo));
  }

  /**
   * Runs a multipart save then re-reads the list, so the table reflects the
   * backend regardless of the save response body (PUT may answer 200 with no JSON).
   */
  private async persist(call: () => Observable<void>): Promise<boolean> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await firstValueFrom(call());
      await this.loadAll();
      return true;
    } catch {
      // TODO(backend): map field-level validation errors (e.g. RN-01 duplicated
      // name) once the backend error contract is known.
      this.errorSignal.set(SAVE_ERROR_MESSAGE);
      return false;
    } finally {
      this.savingSignal.set(false);
    }
  }

  /** RN-04: deletion fails when the entity has dependents — the backend decides. */
  async deleteById(id: number): Promise<boolean> {
    this.errorSignal.set(null);
    try {
      await firstValueFrom(this.repository.delete(id));
      this.entitiesSignal.update((entities) => entities.filter((entity) => entity.id !== id));
      return true;
    } catch {
      // TODO(RN-04): list the blocking dependents once the backend error contract is known.
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
