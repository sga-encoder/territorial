# Tech stack y convenciones

> Contrato de dominio completo en `../../spec.md` (solo lectura). Reglas técnicas en `../../CLAUDE.md` y `../../.claude/CLAUDE.md`. Este archivo resume; ante conflicto, mandan esos.

## Tecnologías

- **Lenguaje:** TypeScript 6 estricto (sin `any`).
- **Framework / runtime:** Angular 22 standalone + signals, SSR con Express 5.
- **Estilos:** Tailwind CSS v4 (config CSS-first) + SCSS para animaciones.
- **Mapas:** `maplibre-gl`. **Auth:** Firebase Auth. **Tiempo real:** `socket.io-client`. **Iconos:** `@ng-icons/lucide`.
- **Base de datos:** no aplica (API Flask en `../territorial_backend`).
- **Tests:** Vitest vía `@angular/build:unit-test`; los tests se generan desde la sección Validation de `spec.md`.

## Archivos / módulos clave

- `src/app/core/http/` — `BaseRepository` genérico (7 verbos) y `ResourceMapper`.
- `src/app/core/auth/` — `AuthService`, `authInterceptor`, `authGuard`, `roleGuard`.
- `src/app/components/ui/` — UI Kit (barrel `index.ts`, tipos en `types.ts`).
- `src/app/components/dynamic/` — FormGenerator, Filter, DynamicTable, PageHeader, Chatbot.
- `src/app/pages/<recurso>/` — una carpeta por feature; referencia CRUD: `pages/entities/`.
- `src/app/pages/map/`, `pages/neighborhoods/polygon-editor/` — hexagonal ligero (domain/data/ui).
- `src/styles/_variables.scss` — tokens de color (única fuente de verdad).
- `src/docs/` — documentación en español de features y componentes.

## Comandos

- `npm start` — arranca el entorno local (`http://localhost:4200`).
- `npm test` — ejecuta los tests (Vitest).
- `npx prettier --write <archivos>` — formato (no hay linter).
- `npm run build` — compila para producción (browser + SSR).

## Modelo de datos / dominio

- DTO (`snake_case`) — contrato exacto del backend; nunca sale de repository/mapper.
- Modelo UI (`camelCase`) — lo único que ven los componentes; cumple `Identifiable` (`id`).
- PK del backend — siempre `id_<recurso>`, nunca `id`; el mapper la traduce.
- Roles — `admin`, `official`, `citizen`; resueltos por el backend según el email.

## Convenciones

- Flujo: Component → Service (signals + `firstValueFrom`) → Repository → HttpClient.
- `inject()`, `input()`/`output()`, `computed()`, control flow nativo; sin `ngOnInit` para datos (constructor + `isPlatformBrowser`).
- Archivos de `pages/` sin `.component.`; signals privados `xSignal`, públicos sin sufijo.
- Formularios solo con `<ui-form-generator>`; tablas con filtros solo con `<ui-filter>` + `<ui-dynamic-table>` (RN-GEN).
- Código y comentarios en inglés; docs en español.

## Estilo visual

- Tokens en `_variables.scss` / `tailwind.css`; dark por defecto, light vía `[data-theme='light']` (`ThemeService`).
- Glass donde flota (modal, toast, sidebar…), sólido donde se lee (inputs, tabla).
- Mobile-first.

## Límites duros

- Nunca modificar `spec.md`.
- Nunca utilidades Tailwind fuera de `components/ui` ni colores hardcodeados.
- Nunca crear componentes del kit fuera de la lista acordada sin aprobación (RN-UI-05).
- Nunca subir claves (`groqApiKey`, Firebase) al repo.
