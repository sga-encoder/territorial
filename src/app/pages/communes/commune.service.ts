import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Commune } from '../../models/commune.model';
import { CommuneRepository } from './commune.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las comunas. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar la comuna. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar la comuna. Si tiene barrios asociados, reasígnalos primero.';

/** State (signals) + orchestration for the Commune CRUD. */
@Injectable({ providedIn: 'root' })
export class CommuneService {
  private readonly repository = inject(CommuneRepository);

  private readonly communesSignal = signal<Commune[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly communes = this.communesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalCommunes = computed(() => this.communes().length);
  readonly hasCommunes = computed(() => this.totalCommunes() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.communesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Commune>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(commune: Commune): Promise<boolean> {
    return this.persist(() => this.repository.update(commune.id, commune));
  }

  private async persist(call: () => Observable<Commune>): Promise<boolean> {
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
      this.communesSignal.update((communes) => communes.filter((commune) => commune.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
