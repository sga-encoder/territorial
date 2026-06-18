import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/http/base-repository';
import { DepartmentDto } from '../../models/department.dto';
import { Department } from '../../models/department.model';
import { departmentMapper } from './department.mapper';

const DEPARTMENT_RESOURCE_PATH = 'departments';

/**
 * HTTP access to /api/departments. The backend uses plain JSON for every verb,
 * so the generic `BaseRepository` (create/update via the mapper's `toDto`) is
 * enough — no multipart override is needed (contrast: entity.repository.ts).
 */
@Injectable({ providedIn: 'root' })
export class DepartmentRepository extends BaseRepository<DepartmentDto, Department> {
  constructor() {
    super(DEPARTMENT_RESOURCE_PATH, departmentMapper);
  }
}
