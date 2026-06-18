import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Official } from '../../models/official.model';
import { OfficialRepository } from './official.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar los funcionarios. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE =
  'No fue posible guardar el funcionario. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE = 'No fue posible eliminar el funcionario.';
const TRACKING_START_ERROR = 'No fue posible iniciar el seguimiento de los funcionarios.';
const TRACKING_STOP_ERROR = 'No fue posible detener el seguimiento.';

/** State (signals) + orchestration for the Official CRUD and live tracking. */
@Injectable({ providedIn: 'root' })
export class OfficialService {
  private readonly repository = inject(OfficialRepository);

  private readonly officialsSignal = signal<Official[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly trackingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly officials = this.officialsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  /** True while a tracking session is being started/stopped. */
  readonly isTracking = this.trackingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalOfficials = computed(() => this.officials().length);
  readonly hasOfficials = computed(() => this.totalOfficials() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.officialsSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Official>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(official: Official): Promise<boolean> {
    return this.persist(() => this.repository.update(official.id, official));
  }

  private async persist(call: () => Observable<Official>): Promise<boolean> {
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
      this.officialsSignal.update((officials) => officials.filter((official) => official.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }

  /** Starts the live GPS tracking session for the given officials. */
  async startTracking(ids: readonly number[]): Promise<boolean> {
    return this.runTracking(() => this.repository.startTracking(ids), TRACKING_START_ERROR);
  }

  /** Stops the active live tracking session. */
  async stopTracking(): Promise<boolean> {
    return this.runTracking(() => this.repository.stopTracking(), TRACKING_STOP_ERROR);
  }

  private async runTracking(
    call: () => Observable<void>,
    errorMessage: string,
  ): Promise<boolean> {
    this.trackingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await firstValueFrom(call());
      return true;
    } catch {
      this.errorSignal.set(errorMessage);
      return false;
    } finally {
      this.trackingSignal.set(false);
    }
  }
}
