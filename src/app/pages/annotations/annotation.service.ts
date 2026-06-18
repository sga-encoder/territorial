import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Annotation } from '../../models/annotation.model';
import { AnnotationRepository } from './annotation.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las anotaciones. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE =
  'No fue posible guardar la anotación. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar la anotación. Si tiene evidencias, votos o interesados asociados, reasígnalos primero.';

/** State (signals) + orchestration for the Annotation CRUD. */
@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly repository = inject(AnnotationRepository);

  private readonly annotationsSignal = signal<Annotation[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly annotations = this.annotationsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalAnnotations = computed(() => this.annotations().length);
  readonly hasAnnotations = computed(() => this.totalAnnotations() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.annotationsSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Annotation>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async createAndReturn(draft: CreateModel<Annotation>): Promise<Annotation | null> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const annotation = await firstValueFrom(this.repository.create(draft));
      await this.loadAll();
      return annotation;
    } catch {
      this.errorSignal.set(SAVE_ERROR_MESSAGE);
      return null;
    } finally {
      this.savingSignal.set(false);
    }
  }

  async update(annotation: Annotation): Promise<boolean> {
    return this.persist(() => this.repository.update(annotation.id, annotation));
  }

  private async persist(call: () => Observable<Annotation>): Promise<boolean> {
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
      this.annotationsSignal.update((annotations) =>
        annotations.filter((annotation) => annotation.id !== id),
      );
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
