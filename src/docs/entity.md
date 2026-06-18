# CRUD de referencia — Entity (CU-01)

Implementación plantilla del patrón híbrido (spec.md §2). **Para crear cualquier
otro recurso CRUD, replica exactamente esta estructura.**

## Archivos

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Model | `models/entity.model.ts` | Forma UI (camelCase) + unión `EntityStatus` |
| DTO | `models/entity.dto.ts` | Contrato exacto del backend (snake_case) |
| Mapper | `pages/entities/entity.mapper.ts` | Traducción pura DTO ↔ Model |
| Repository | `pages/entities/entity.repository.ts` | HTTP — extiende `BaseRepository` (7 verbos) |
| Service | `pages/entities/entity.service.ts` | Estado con signals + orquestación |
| UI (lista) | `pages/entities/entity-list/` | Tabla + filtros + acciones (CU-01) |
| UI (form) | `pages/entities/entity-form-dialog.ts` | Crear/editar en **modal** (ModalService), no en página aparte |
| Rutas | `pages/entities/entities.routes.ts` | Lazy loading (`/entities`); sin rutas de form |

## Flujo de datos (regla innegociable)

```
Componente → EntityService (signals) → EntityRepository → HttpClient → Backend
     ↑                                        ↓
     └──────── entityMapper: DTO → Entity ────┘
```

Ningún DTO snake_case toca un componente: el mapper se aplica dentro del
repositorio en los 7 verbos (`listAll`, `listPaginated`, `getById`, `search`,
`create`, `update`, `delete`).

## Uso del servicio en un componente

```ts
@Component({ /* ... */ })
export class EntityList {
  protected readonly entityService = inject(EntityService);

  constructor() {
    // Solo en navegador: SSR no debe llamar al backend al renderizar.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.entityService.loadAll();
    }
  }
}
```

```html
@if (entityService.isLoading()) {
  <p role="status">Cargando…</p>
} @else {
  @for (entity of entityService.entities(); track entity.id) {
    <!-- fila -->
  }
}
```

Signals expuestas: `entities`, `selectedEntity`, `isLoading`, `isSaving`,
`error`, y derivadas `totalEntities` / `hasEntities` (`computed`).
Las mutaciones (`create`, `update`, `deleteById`) devuelven `Promise<boolean>`
para que el componente decida la navegación.

## Checklist para replicar en un recurso nuevo (ej. Commune)

1. `models/commune.model.ts` y `models/commune.dto.ts` (un archivo por interfaz).
2. `pages/communes/commune.mapper.ts` — objeto `ResourceMapper<CommuneDto, Commune>` puro.
3. `pages/communes/commune.repository.ts` — `extends BaseRepository`, pasa ruta (`'communes'`) y mapper en `super(...)`.
4. `pages/communes/commune.service.ts` — signals privadas + lecturas `asReadonly()` + reglas de negocio del spec.
5. Componentes standalone de lista/formulario (Reactive Forms, control flow nativo).
6. `pages/communes/communes.routes.ts` y registro lazy en `app.routes.ts` + entrada en `NAV_ITEMS` del sidebar.
7. Documento de uso en `docs/`.

## Reglas de negocio cubiertas

- RN-01 nombre único → lo valida el backend; el error se muestra vía `error`.
- RN-02 tipo `public | private` → unión cerrada + `<select>`.
- RN-03 estado `active | inactive` → unión cerrada + `<select>`.
- RN-04 no eliminar con dependientes → el backend rechaza; mensaje en `error`.
- RN-05 campos obligatorios → `Validators.required` en todos los controles.

## Contrato real del backend (Postman)

`/api/entities` **crea/edita con `multipart/form-data`** (no JSON): campos
snake_case `name, nit, phone, email, address, logo_url, status` + la imagen en
`file`. **No hay `type` ni `description`** (se eliminaron del modelo). Por eso
`EntityRepository` sobreescribe `create`/`update` para enviar `FormData`; el resto
de verbos siguen el `BaseRepository` genérico.

## Pendientes (TODO — riesgos del spec §10)

- **Respuesta de create/update:** se asume que devuelve el `EntityDto` creado;
  confirmar (si no, recargar la lista tras guardar).
- **Paginación:** `listPaginated` asume arreglo plano; confirmar el envelope.
- **`/search`:** nombres de parámetros de filtro sin documentar.
- **Errores backend:** mapear errores de validación por campo (RN-01, RN-04)
  cuando se conozca el contrato de error.
- **Guards:** activar `authGuard` + `roleGuard(['admin'])` en `entities.routes.ts`
  cuando exista la pantalla de login (CU-07).
