# spec.md — Domain Contract

# Sistema de Valoración Territorial — Frontend Angular

> **Read this file before implementing any functionality.**
> Never generate code that contradicts this contract.
> Tests are generated from the Validation section — never written manually.

---

## 1. Project Overview

Plataforma para alcaldías colombianas: reconocimiento, caracterización y cuidado
del territorio. Tres componentes: **Espacial** (polígonos en mapa), **Social**
(anotaciones geolocalizadas), **Comunitario** (reportes y calificaciones ciudadanas).

**Actores:** Administrador, Funcionario (Official), Ciudadano (Citizen).

---

## 2. Architecture — Hybrid (decided)

Pragmatic hybrid, optimized for maintainability and delivery time.

| Part of system | Architecture | Reason |
|---|---|---|
| 16 uniform CRUDs | `BaseRepository<TDto, TModel>` generic + mapper per resource | Backend repeats the same 7 verbs ×16 |
| Map / annotations / polygons | Light hexagonal (`domain` / `data` / `ui`) | Real domain complexity |
| Reports (charts) | Strategy pattern (`pie` / `bar` / `line`) | Open/Closed, backend dictates type |

### Non-negotiable rule

A backend DTO (`snake_case`) MUST NEVER reach a component.
Every resource has a **mapper** translating DTO ↔ UI model. This is the only
piece of "hexagonal" respected everywhere, because the backend is immutable.

### Data flow

```
Component  →  Service (signals)  →  Repository  →  HttpClient  →  Backend
   ↑                                    ↓
   └────────  Mapper: DTO → Model  ─────┘
```

| Layer | Single responsibility | Knows |
|---|---|---|
| Component | Presentation + events | Service |
| Service | State (signals) + orchestration | Repository |
| Repository | HTTP calls (extends BaseRepository) | HttpClient + Mapper |
| Mapper | Pure DTO ↔ Model translation | Nothing |
| Model | UI shape (camelCase) | Nothing |
| DTO | Exact backend contract (snake_case) | Nothing |

### Angular patterns in use (Angular 22 / TS 6)

| Concern | Pattern | API |
|---|---|---|
| State | Signals | `signal()`, `computed()`, `.asReadonly()` |
| DI | Inject function | `inject(Token)` |
| Guards | Functional | `CanActivateFn` |
| Interceptors | Functional | `HttpInterceptorFn` |
| Async HTTP | `firstValueFrom` | `await firstValueFrom(obs$)` |
| Lifecycle | Constructor + PLATFORM_ID | Sin `ngOnInit` para carga de datos |
| File naming | Sin sufijo `.component.` en pages | `entity-list.ts`, `entity-list.html` |
| Template | Control flow nativo | `@if`, `@for` — no `*ngIf`, `*ngFor` |

---

## 3. Backend Contract (immutable)

- **Base URL:** `http://127.0.0.1:5000` (env variable `baseUrl`)
- **API prefix:** `/api`
- **Convention:** every resource exposes the same 7 endpoints:

```
GET    /api/{resource}              List all
GET    /api/{resource}?page=&size=  List paginated
GET    /api/{resource}/{id}         Get by id
GET    /api/{resource}/search       Search by filter
POST   /api/{resource}              Create
PUT    /api/{resource}/{id}         Update
DELETE /api/{resource}/{id}         Delete
```

### Resource routes

| Resource | Route |
|---|---|
| Department | `/api/departments` |
| City | `/api/cities` |
| Commune | `/api/communes` |
| Neighborhood | `/api/neighborhoods` |
| Point | `/api/points` |
| Annotation | `/api/annotations` |
| Category | `/api/categories` |
| Entity | `/api/entities` |
| Interested Party | `/api/interested-parties` |
| Vote | `/api/votes` |
| Citizen | `/api/citizens` |
| Annotation Category | `/api/annotation-categories` |
| Evidence | `/api/evidences` |
| Official | `/api/officials` |
| Images | `/api/images/logos/{file}` |

### Special (non-CRUD) endpoints

```
POST /api/tracking/start      body: { "ids": [1,2,3] }
POST /api/tracking/stop       body: { "ids": [1,2,3] }
GET  /api/images/...          View image
POST /api/reports             body: { "query": "comuna con mas barrios" }  (Gemini)
GET  /api/reports/test/pie|bar|line
```

### DTO shapes (snake_case — backend truth)

```jsonc
// Department
{ "name": "Caldas", "dane_code": "17" }

// City
{ "id_department": 1, "name": "Manizales", "dane_code": "17001" }

// Commune
{ "id_city": 1, "name": "...", "status": "..." }

// Neighborhood
{ "id_commune": 1, "name": "...", "status": "..." }

// Point (polygon vertex)
{ "id_neighborhood": 1, "id_annotation": 1, "latitude": 5.095,
  "longitude": 5.095, "order": 1, "point_type": "..." }

// Annotation
{ "id_neighborhood": 1, "id_citizen": 1, "description": "...",
  "latitude": 5.095, "longitude": 5.095, "status": "..." }

// Interested Party
{ "id_entity": 1, "id_annotation": 1 }

// Vote
{ "id_citizen": 1, "id_annotation": 1, "stars": 1, "comment": "..." }

// Citizen
{ "name": "...", "email": "...", "phone": "...", "address": "...",
  "latitude": 5.095, "longitude": 5.095, "status": "..." }

// Annotation Category (junction)
{ "id_category": 1, "id_annotation": 1 }

// Official
{ "id_entity": 1, "name": "...", "email": "...", "phone": "...",
  "role": "...", "status": "...", "last_latitude": 5.095,
  "last_longitude": 5.095, "last_gps_update": "...", "gps_active": true }
```

> Category and Entity DTOs not provided in collection — confirm shape before mapping.

---

## 4. Authentication — Firebase

- OAuth only: **Google / Microsoft / GitHub**. No password registration.
- Firebase provides **identity**, not role.
- Role is resolved against backend: match email in `Official` or `Citizen`.
- Firebase token is injected by `AuthInterceptor` into every backend request.
- Routes protected by `authGuard` (auth) and `roleGuard` (authorization).

### Auth flow

```
Login → Firebase OAuth popup → token + email
      → query backend (Official/Citizen by email) → resolve role
      → email not found → redirect to "complete profile" (CU-07 alt 4a)
```

---

## 5. Business Rules

### Entities (CU-01)

- RN-01 Entity name must be unique.
- RN-02 Type is `public` or `private` only.
- RN-03 State is `active` or `inactive`.
- RN-04 Cannot delete an entity with officials or interested parties — list dependents.
- RN-05 Required fields: name, description, type, NIT, phone, email, address, logo.

### Officials (CU-02)

- RN-06 Email must be unique system-wide.
- RN-07 Must belong to an existing entity.
- RN-08 Cannot delete if it has annotations or demarcations.
- RN-09 Role assigned at creation.

### Citizens (CU-03)

- RN-10 Address is a geolocated pin (lat/long), not free text.

### Categories (CU-04)

- RN-11 Hierarchical: a subcategory has a parent category.
- RN-12 Cannot delete if it has subcategories or annotations — suggest reassign first.

### Territorial hierarchy (CU-05, CU-06)

- RN-13 Strict hierarchy: Department → City → Commune → Neighborhood.
- RN-14 Commune name unique within its city.
- RN-15 Neighborhood name unique within its commune.
- RN-16 Commune needs an existing city; neighborhood needs an existing commune.
- RN-17 Cannot delete a commune with neighborhoods.
- RN-18 Cannot delete a neighborhood with points or annotations.
- RN-19 Department/city data validated/autocompleted via API Colombia (external truth).

### Authentication (CU-07, CU-08)

- RN-20 OAuth only (Firebase): Google / Microsoft / GitHub.
- RN-21 Unregistered authenticated user → must complete profile before access.
- RN-22 Role assigned by system per registered user, not chosen by user.

### Polygons / demarcation (CU-09, CU-10)

- RN-23 Only the Official demarcates territories.
- RN-24 An open polygon auto-closes (last point joins first).
- RN-25 Points are editable in real time (add, move, delete).
- RN-26 Polygon belongs to a specific neighborhood.

### Real-time tracking (CU-11)

- RN-27 Show only officials with active session and GPS enabled.
- RN-28 Disconnected official → dimmed marker at last known position.
- RN-29 Tracking filterable by entity.

### Annotations (CU-12)

- RN-30 Create requires authenticated user + at least one demarcated neighborhood.
- RN-31 Fields: coordinates, description, category(ies), photos, interested entities.
- RN-32 Annotation outside a demarcated neighborhood → explicit confirmation to save without neighborhood.
- RN-33 Auto-associated to the neighborhood containing the point.

### Votes / ratings (CU-13)

- RN-34 Only the Citizen rates annotations.
- RN-35 Rating: 1–5 stars + comment.
- RN-36 One rating per citizen per annotation — if exists, edit (no duplicate).

### Map filters (CU-14)

- RN-37 Parent category + child subcategory selected → show ALL annotations of the parent (incl. all subcategories).
- RN-38 Category and territory (neighborhood/commune) filters are combinable simultaneously.
- RN-39 Each marker colored by its main category.

### Smart reports (CU-15)

- RN-40 Frontend does NOT choose chart type — reads `type` from backend response
  (`pie` / `bar` / `line`) and renders the matching ApexCharts component (Strategy).
- RN-41 Uninterpretable query → ask to rephrase WITH example suggestions.
- RN-42 Only one chart type applies → disable others indicating the reason.
- RN-43 Error contract: `400` empty/malformed query, `422` query not mappable to a chart, `500` internal error.

---

## 6. Reports Contract — `POST /api/reports`

Request: `{ "query": "ventas por región del último trimestre" }`

Responses (frontend reads `type` and renders accordingly):

```jsonc
// pie — proportional distribution
{ "type": "pie", "labels": ["A","B","C"], "series": [44,55,13] }

// bar — comparison between categories
{ "type": "bar", "series": [{ "name": "Servings", "data": [44,55,41] }] }

// line — trend over time
{ "type": "line", "series": [{ "name": "2013", "data": [28,29,33] }] }
```

HTTP: `200` ok · `400` empty/malformed query · `422` no chart type · `500` server error.

ApexCharts references:

- pie:  <https://apexcharts.com/angular-chart-demos/pie-charts/simple-pie/>
- bar:  <https://apexcharts.com/angular-chart-demos/bar-charts/basic-bar/>
- line: <https://apexcharts.com/angular-chart-demos/line-charts/line-with-data-labels/>

---

## 7. Tech Stack

```
Architecture:  Hybrid — BaseRepository<T> for CRUDs, light hexagonal for map/reports
State:         Signals + services (SignalStore only if map state grows)
Auth:          Firebase Auth + AuthService + AuthInterceptor + guards
Roles:         Resolved via backend (Official / Citizen by email)
Maps:          Leaflet + leaflet-draw
Real-time:     Tracking endpoints (start/stop) — confirm WS vs polling
Charts:        ng-apexcharts (backend dictates type)
HTTP:          HttpClient + AuthInterceptor + generic BaseRepository
Styles:        Tailwind + SCSS, permanent dark mode
External:      API Colombia (department/city autocomplete)
State:         Signals (signal/computed/asReadonly) — NO BehaviorSubject
DI:            inject() function — NO constructor injection
Guards:        CanActivateFn — NO clase CanActivate
Interceptors:  HttpInterceptorFn — NO clase HttpInterceptor
Lifecycle:     constructor + isPlatformBrowser — NO ngOnInit para datos
HTTP async:    async/await + firstValueFrom — NO .subscribe() en componentes
Router extras: withComponentInputBinding, withInMemoryScrolling
```

---

## 8. Color Palette (CSS variables in styles/_variables.scss)

```scss
:root {
  --color-background: #0f172a;
  --color-surface:    #1e293b;
  --color-primary:    #6366f1;
  --color-text:       #e2e8f0;
}
```

---

## 9. Folder Structure

```
src/
├── app/
│   ├── core/
│   │   ├── http/
│   │   │   ├── base-repository.ts   # repositorio genérico 7 verbos
│   │   │   ├── create-model.ts
│   │   │   ├── identifiable.ts
│   │   │   └── resource-mapper.ts
│   │   └── auth/                    # AuthService, interceptor, guards
│   ├── components/                  # componentes reutilizables
│   │   ├── ui/                      # design system: Button, Card, Table, ...
│   │   ├── dynamic/                 # DynamicTable, Filter, FormGenerator, ...
│   │   └── visual/                  # GlassStage, ParticlesBackground
│   ├── layout/
│   │   ├── shell/                   # shell con router-outlet
│   │   ├── navbar/
│   │   └── sidebar/
│   ├── pages/                       # una carpeta por feature/módulo
│   │   ├── entities/                # CRUD entidades (BaseRepository)
│   │   │   ├── entity-list/
│   │   │   ├── entity-form/
│   │   │   ├── entity.repository.ts
│   │   │   ├── entity.service.ts
│   │   │   ├── entity.mapper.ts
│   │   │   └── entities.routes.ts
│   │   ├── map/                     # hexagonal: domain / data / ui
│   │   ├── reports/                 # Strategy: pie / bar / line
│   │   └── ui-components/           # showcase del UI Kit
│   ├── models/                      # una interfaz por archivo (model + dto)
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.ts
├── docs/                            # documentación de componentes (.md)
├── environments/
├── styles/
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── styles.scss
└── spec.md
```

---

## 10. Open Risks

- Category / Entity DTO shapes not in Postman collection — confirm before mapping.
- Tracking real-time mechanism (WebSocket vs polling) not specified — confirm.
- API Colombia consumed directly by frontend or proxied by backend — confirm.

---

## 12. Coding Standards

### Patrones prohibidos (Angular < 17, legacy)

| ❌ Prohibido | ✅ Usar en su lugar |
|---|---|
| `constructor(private svc: Service)` | `private readonly svc = inject(Service)` |
| `implements OnInit` + `ngOnInit()` | constructor + guard `isPlatformBrowser` |
| `implements CanActivate` (clase) | `export const guard: CanActivateFn = () => {...}` |
| `implements HttpInterceptor` (clase) | `export const interceptor: HttpInterceptorFn = (req, next) => {...}` |
| `new BehaviorSubject()` para estado | `signal()` + `.asReadonly()` |
| `.subscribe()` en componentes para HTTP | `async/await` + `firstValueFrom()` en el service |
| Tipos DTO en archivos de componente | Solo tipos de modelo UI; los DTOs quedan en repository/mapper |
| `CommonModule` en imports | Solo directivas específicas o control flow nativo |
| `*ngIf` / `*ngFor` en templates | `@if` / `@for` (control flow nativo Angular 17+) |
| `<form>` + controles sueltos / inputs HTML | `<ui-form-generator [schema]>` (FormGenerator) |
| `<table>` manual o lista con filtros ad-hoc | `<ui-filter>` + `<ui-dynamic-table>` |

### RN-GEN — Formularios y tablas siempre con los generadores

- **Todo formulario** se construye con `<ui-form-generator>` a partir de un
  `FormSchema` (metadatos): nunca un `<form>` con controles del kit sueltos ni
  inputs HTML crudos. Prefill (editar) vía `initialValue` por campo; el schema se
  expone como **referencia estable** (`computed`/`readonly`). Validación con la
  unión `FormFieldValidator` (RN-UI-07). Ejemplo de referencia:
  `pages/entities/entity-form-dialog.ts`.
- **Toda tabla con filtros** se construye con `<ui-filter>` (`FilterConfig`) +
  `<ui-dynamic-table>` (`DynamicColumn[]` + `DynamicRowAction[]`): nunca una
  `<table>` manual ni filtros ad-hoc. Ejemplo: `pages/entities/entity-list/`.

### Convenciones de nombres

| Artefacto | Convención | Ejemplo |
|---|---|---|
| Archivo de componente (pages/) | `kebab-case.ts` sin `.component.` | `entity-list.ts` |
| Clase de componente | `PascalCase` sin sufijo `Component` | `EntityList` |
| Guard | `camelCase` + sufijo `Guard` | `authGuard`, `roleGuard` |
| Interceptor | `camelCase` + sufijo `Interceptor` | `authInterceptor` |
| Service | `PascalCase` + sufijo `Service` | `EntityService` |
| Repository | `PascalCase` + sufijo `Repository` | `EntityRepository` |
| Mapper | `PascalCase` + sufijo `Mapper` | `EntityMapper` |
| DTO interface | `PascalCase` + sufijo `Dto` | `EntityDto` |
| UI Model interface | `PascalCase` sin sufijo | `Entity` |
| Signal privado | `camelCaseSignal` | `loadingSignal` |
| Signal público (readonly) | `camelCase` sin sufijo | `isLoading` |

### Checklist por feature nueva

- [ ] Usa `inject()` — sin constructor injection
- [ ] Estado en `signal()` dentro del service — sin propiedades planas en el componente
- [ ] Async HTTP con `async/await` + `firstValueFrom()` en el service
- [ ] El componente no llama `.subscribe()` sobre observables HTTP
- [ ] Carga de datos protegida con `isPlatformBrowser` (SSR)
- [ ] DTOs no salen del repository/mapper
- [ ] Template usa `@if` / `@for`
- [ ] Guard es función `CanActivateFn`
- [ ] Archivos de pages/ sin `.component.` en el nombre
- [ ] Formularios con `<ui-form-generator>` (schema), nunca `<form>` manual (RN-GEN)
- [ ] Tablas con filtro vía `<ui-filter>` + `<ui-dynamic-table>` (RN-GEN)

---

## 13. UI Kit Business Rules (RN-UI-*)

> El spec.md original (dominio §1–§8) se recuperó referenciado en el código
> (paleta §8 en `src/styles/_variables.scss`, roles/autenticación §4 en
> `src/app/core/auth/auth.service.ts`). Estas reglas gobiernan el design system.

- **RN-UI-01 · Tipos centralizados:** todos los tipos públicos de la UI
  (union types de los inputs de los componentes del kit) viven en UN solo
  archivo: `src/app/components/ui/types.ts`. Los archivos de componente contienen
  solo implementación (mapas de clases, defaults). Los consumidores importan
  componentes y tipos únicamente desde el barrel `src/app/components/ui/index.ts`.
- **RN-UI-02 · Principio atómico:** los componentes de `components/ui` son los
  únicos átomos de estilo; las utilidades de Tailwind solo se usan dentro del
  kit. Las features componen, nunca estilizan (detalle en `CLAUDE.md` y
  `src/docs/ui-kit/theming.md`).
- **RN-UI-03 · Tema oscuro por defecto:** la app arranca siempre en dark; el
  tema claro es una elección explícita del usuario, persistida en
  `localStorage` (`territorial-ui-theme`). Decisión registrada el 2026-06-11.
- **RN-UI-04 · Precedencia en Container:** el preset `center` siembra valores
  por defecto y los inputs granulares `align`/`justify` ganan en su propio
  eje. Decisión registrada el 2026-06-12.
- **RN-UI-05 · Kit mínimo:** no se crean componentes fuera de la lista
  acordada por capas sin aprobación explícita (se descartó un componente
  CodeBlock el 2026-06-12; los ejemplos de código viven en `src/docs/ui-kit/`).
- **RN-UI-06 · Íconos:** provienen de la librería `@ng-icons/lucide` envuelta
  por `<ui-icon>`; el kit expone un subset curado y tipado (`IconName` en
  `types.ts`). Añadir un ícono = importar el `lucide*` en `icon/icon.ts` y
  ampliar el union type. Decisión registrada el 2026-06-12.
- **RN-UI-07 · Errores de formulario solo tras enviar:** los campos permanecen
  en silencio hasta el primer intento de envío; después, el mensaje se corrige
  en vivo. Implementación única en `fieldErrorMessage(control, submitted,
  overrides?)` (`components/ui/forms/field-error.ts`): el consumidor mantiene un
  signal `submitted` que activa en `ngSubmit`. Mensajes por defecto en español
  con overrides por validador. Decisión registrada el 2026-06-12.
- **RN-UI-08 · Toasts:** pila en la esquina inferior derecha, máximo 3
  visibles (al llegar una nueva se descarta la más antigua), auto-dismiss a
  los 5 s; `duration: 0` = persistente hasta cierre manual. Un solo
  `<ui-toast-outlet>` montado en el Shell. Decisión registrada el 2026-06-12.

---

## 11. Validation
>
> Tests are generated here from the rules above — not written manually.
