import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { DepartmentDto } from '../../models/department.dto';
import { Department } from '../../models/department.model';

/**
 * Pure DTO ↔ model translation for Department — the only place where the
 * snake_case backend shape (`dane_code`) is visible (spec.md §2, non-negotiable).
 * Unlike Entity, create/update go out as JSON, so `toDto` is used by the generic
 * `BaseRepository.create`/`update`.
 */
export const departmentMapper: ResourceMapper<DepartmentDto, Department> = {
  toModel: (dto: DepartmentDto): Department => ({
    id: dto.id_department,
    name: dto.name,
    daneCode: dto.dane_code,
  }),

  toDto: (model: Department | CreateModel<Department>): Omit<DepartmentDto, 'id_department'> => ({
    name: model.name,
    dane_code: model.daneCode,
  }),
};
