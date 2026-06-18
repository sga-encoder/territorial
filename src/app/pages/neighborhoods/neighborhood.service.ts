import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Neighborhood } from '../../models/neighborhood.model';
import { NeighborhoodRepository } from './neighborhood.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar los barrios. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar el barrio. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar el barrio. Si tiene puntos o anotaciones asociadas, reasígnalos primero.';

/** State (signals) + orchestration for the Neighborhood CRUD. */
@Injectable({ providedIn: 'root' })
export class NeighborhoodService {
  private readonly repository = inject(NeighborhoodRepository);

  private readonly neighborhoodsSignal = signal<Neighborhood[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly neighborhoods = this.neighborhoodsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalNeighborhoods = computed(() => this.neighborhoods().length);
  readonly hasNeighborhoods = computed(() => this.totalNeighborhoods() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.neighborhoodsSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Neighborhood>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(neighborhood: Neighborhood): Promise<boolean> {
    return this.persist(() => this.repository.update(neighborhood.id, neighborhood));
  }

  private async persist(call: () => Observable<Neighborhood>): Promise<boolean> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await firstValueFrom(call());
      await this.loadAll();
      return true;
    } catch {
      this.errorSignal.set(SAVE_ERROR_MESSAGE);
      return false;
    } finally {
      this.savingSignal.set(false);
    }
  }

  async deleteById(id: number): Promise<boolean> {
    this.errorSignal.set(null);
    try {
      await firstValueFrom(this.repository.delete(id));
      this.neighborhoodsSignal.update((neighborhoods) =>
        neighborhoods.filter((neighborhood) => neighborhood.id !== id),
      );
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
