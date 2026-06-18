import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { City } from '../../models/city.model';
import { CityRepository } from './city.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las ciudades. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar la ciudad. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar la ciudad. Si tiene comunas asociadas, reasígnalas primero.';

/** State (signals) + orchestration for the City CRUD. */
@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly repository = inject(CityRepository);

  private readonly citiesSignal = signal<City[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly cities = this.citiesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalCities = computed(() => this.cities().length);
  readonly hasCities = computed(() => this.totalCities() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.citiesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<City>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(city: City): Promise<boolean> {
    return this.persist(() => this.repository.update(city.id, city));
  }

  private async persist(call: () => Observable<City>): Promise<boolean> {
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
      this.citiesSignal.update((cities) => cities.filter((city) => city.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
