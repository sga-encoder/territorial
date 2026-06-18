import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { InterestedParty } from '../../models/interested-party.model';
import { InterestedPartyRepository } from './interested-party.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar los interesados. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar el interesado. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE = 'No fue posible eliminar el interesado.';

/** State (signals) + orchestration for the InterestedParty CRUD. */
@Injectable({ providedIn: 'root' })
export class InterestedPartyService {
  private readonly repository = inject(InterestedPartyRepository);

  private readonly partiesSignal = signal<InterestedParty[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly parties = this.partiesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalParties = computed(() => this.parties().length);
  readonly hasParties = computed(() => this.totalParties() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.partiesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<InterestedParty>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(party: InterestedParty): Promise<boolean> {
    return this.persist(() => this.repository.update(party.id, party));
  }

  private async persist(call: () => Observable<InterestedParty>): Promise<boolean> {
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
      this.partiesSignal.update((parties) => parties.filter((party) => party.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
