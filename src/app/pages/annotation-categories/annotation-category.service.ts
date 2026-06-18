import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { AnnotationCategory } from '../../models/annotation-category.model';
import { AnnotationCategoryRepository } from './annotation-category.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las categorías de anotación. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE = 'No fue posible guardar el vínculo. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE = 'No fue posible eliminar el vínculo.';

/** State (signals) + orchestration for the AnnotationCategory CRUD. */
@Injectable({ providedIn: 'root' })
export class AnnotationCategoryService {
  private readonly repository = inject(AnnotationCategoryRepository);

  private readonly linksSignal = signal<AnnotationCategory[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly links = this.linksSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalLinks = computed(() => this.links().length);
  readonly hasLinks = computed(() => this.totalLinks() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.linksSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<AnnotationCategory>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(link: AnnotationCategory): Promise<boolean> {
    return this.persist(() => this.repository.update(link.id, link));
  }

  private async persist(call: () => Observable<AnnotationCategory>): Promise<boolean> {
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
      this.linksSignal.update((links) => links.filter((link) => link.id !== id));
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
