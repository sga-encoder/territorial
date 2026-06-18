import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CreateModel } from '../../core/http/create-model';
import { Department } from '../../models/department.model';
import { DepartmentRepository } from './department.repository';

const LOAD_ERROR_MESSAGE =
  'No fue posible cargar los departamentos. Verifica que el backend esté disponible.';
const SAVE_ERROR_MESSAGE =
  'No fue posible guardar el departamento. Revisa los datos e intenta de nuevo.';
// The backend rejects deleting a department that still has cities associated.
const DELETE_ERROR_MESSAGE =
  'No fue posible eliminar el departamento. Si tiene ciudades asociadas, reasígnalas primero.';

/** State (signals) + orchestration for the Department CRUD. */
@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly repository = inject(DepartmentRepository);

  private readonly departmentsSignal = signal<Department[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly departments = this.departmentsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalDepartments = computed(() => this.departments().length);
  readonly hasDepartments = computed(() => this.totalDepartments() > 0);

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      this.departmentsSignal.set(await firstValueFrom(this.repository.listAll()));
    } catch {
      this.errorSignal.set(LOAD_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /** Duplicated names are rejected by the backend and surfaced through `error`. */
  async create(draft: CreateModel<Department>): Promise<boolean> {
    return this.persist(() => this.repository.create(draft));
  }

  async update(department: Department): Promise<boolean> {
    return this.persist(() => this.repository.update(department.id, department));
  }

  /**
   * Runs a JSON save then re-reads the list, so the table reflects the backend
   * regardless of the save response body (the create/update envelope is not
   * documented yet — see base-repository.ts TODO).
   */
  private async persist(call: () => Observable<Department>): Promise<boolean> {
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

  /** Deletion fails when the department has dependent cities — the backend decides. */
  async deleteById(id: number): Promise<boolean> {
    this.errorSignal.set(null);
    try {
      await firstValueFrom(this.repository.delete(id));
      this.departmentsSignal.update((departments) =>
        departments.filter((department) => department.id !== id),
      );
      return true;
    } catch {
      this.errorSignal.set(DELETE_ERROR_MESSAGE);
      return false;
    }
  }
}
