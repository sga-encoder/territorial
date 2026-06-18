import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Evidence } from '../../models/evidence.model';
import { EvidenceRepository } from './evidence.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las evidencias. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE =
  'No fue posible guardar la evidencia. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE = 'No fue posible eliminar la evidencia.';

/** State (signals) + orchestration for the Evidence CRUD (multipart). */
@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly repository = inject(EvidenceRepository);

  private readonly evidencesSignal = signal<Evidence[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly evidences = this.evidencesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalEvidences = computed(() => this.evidences().length);
  readonly hasEvidences = computed(() => this.totalEvidences() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.evidencesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Evidence>, file?: File): Promise<boolean> {
    return this.persist(() => this.repository.persistNew(draft, file));
  }

  async update(evidence: Evidence, file?: File): Promise<boolean> {
    return this.persist(() => this.repository.persistEdit(evidence.id, evidence, file));
  }

  private async persist(call: () => Observable<void>): Promise<boolean> {
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
      this.evidencesSignal.update((evidences) => evidences.filter((evidence) => evidence.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
