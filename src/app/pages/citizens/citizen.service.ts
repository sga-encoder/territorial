import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Citizen } from '../../models/citizen.model';
import { CitizenRepository } from './citizen.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar los ciudadanos. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE =
  'No fue posible guardar el ciudadano. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar el ciudadano. Si tiene anotaciones o votos asociados, reasígnalos primero.';

/** State (signals) + orchestration for the Citizen CRUD. */
@Injectable({ providedIn: 'root' })
export class CitizenService {
  private readonly repository = inject(CitizenRepository);

  private readonly citizensSignal = signal<Citizen[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly citizens = this.citizensSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalCitizens = computed(() => this.citizens().length);
  readonly hasCitizens = computed(() => this.totalCitizens() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.citizensSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Citizen>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(citizen: Citizen): Promise<boolean> {
    return this.persist(() => this.repository.update(citizen.id, citizen));
  }

  private async persist(call: () => Observable<Citizen>): Promise<boolean> {
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
      this.citizensSignal.update((citizens) => citizens.filter((citizen) => citizen.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
