import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Category } from '../../models/category.model';
import { CategoryRepository } from './category.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar las categorías. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE =
  'No fue posible guardar la categoría. Revisa los datos e intenta de nuevo.';
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar la categoría. Si tiene subcategorías o anotaciones asociadas, reasígnalas primero.';

/** State (signals) + orchestration for the Category CRUD (multipart). */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly repository = inject(CategoryRepository);

  private readonly categoriesSignal = signal<Category[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly categories = this.categoriesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalCategories = computed(() => this.categories().length);
  readonly hasCategories = computed(() => this.totalCategories() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.categoriesSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(draft: CreateModel<Category>, image?: File): Promise<boolean> {
    return this.persist(() => this.repository.persistNew(draft, image));
  }

  async update(category: Category, image?: File): Promise<boolean> {
    return this.persist(() => this.repository.persistEdit(category.id, category, image));
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
      this.categoriesSignal.update((categories) =>
        categories.filter((category) => category.id !== id),
      );
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
