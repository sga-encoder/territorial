import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Vote } from '../../models/vote.model';
import { VoteRepository } from './vote.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar los votos. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar el voto. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE = 'No fue posible eliminar el voto.';

/** State (signals) + orchestration for the Vote CRUD. */
@Injectable({ providedIn: 'root' })
export class VoteService {
  private readonly repository = inject(VoteRepository);

  private readonly votesSignal = signal<Vote[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly votes = this.votesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalVotes = computed(() => this.votes().length);
  readonly hasVotes = computed(() => this.totalVotes() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.votesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Vote>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(vote: Vote): Promise<boolean> {
    return this.persist(() => this.repository.update(vote.id, vote));
  }

  private async persist(call: () => Observable<Vote>): Promise<boolean> {
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
      this.votesSignal.update((votes) => votes.filter((vote) => vote.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
