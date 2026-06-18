# CRUD Department — `/api/departments`

Réplica del patrón de referencia [Entity](entity.md), en su **variante JSON pura**
(sin archivo, sin relaciones padre, sin estado). Es el caso más simple del CRUD.

## Diferencias frente a Entity

| Aspecto | Entity | Department |
| --- | --- | --- |
| Cuerpo create/update | `multipart/form-data` (logo `file`) | **JSON** |
| Repository | sobreescribe `create`/`update` | **genérico** (`BaseRepository` tal cual) |
| Campos | name, nit, phone, email, address, status, logo | **name, daneCode** |
| Estado (badge) | `active`/`inactive` | — (no aplica) |

## Archivos

| Capa | Archivo |
| --- | --- |
| Model | `models/department.model.ts` (`{ id, name, daneCode }`) |
| DTO | `models/department.dto.ts` (`dane_code` snake_case) |
| Mapper | `pages/departments/department.mapper.ts` |
| Repository | `pages/departments/department.repository.ts` (sin overrides) |
| Service | `pages/departments/department.service.ts` (signals) |
| UI lista | `pages/departments/department-list/` |
| UI form | `pages/departments/department-form-dialog.ts` (modal) |
| Rutas | `pages/departments/departments.routes.ts` → `/territory/departments` |

## Búsqueda

Como en Entity, la lista carga todo con `listAll()` y filtra **en el cliente** con
`<ui-filter>` (campos `name` y `daneCode`, `matchMode: 'contains'`). El endpoint
`/api/departments/search?q=` queda disponible en `BaseRepository.search` para uso
server-side si más adelante se pagina contra el backend.

## Validación del código DANE (punto de extensión)

`department-form-dialog.ts` expone `daneCodeValidators` con solo `required`. Los
códigos DANE de departamento son 2 dígitos ("17" Caldas, "05" Antioquia); la regla
de formato (`pattern`/`minLength`) se decide ahí según qué tan estricto se quiera
el front. Ver el TODO en el componente.

## Reutilización

- `ConfirmDialog` se **reutiliza** desde `pages/shared/confirm-dialog` (ya
  relocalizado allí; lo comparten todos los CRUD). Ver [crud-resources.md](crud-resources.md).
- Entrada de navegación: `NAV_ITEMS` del `sidebar` (`/territory/departments`,
  `enabled: true`).
