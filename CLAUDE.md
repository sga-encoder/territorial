# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Context

- Angular v22 (standalone, signals, SSR via Express), Tailwind CSS v4 (CSS-first config), SCSS, Vitest.
- Backend: Flask REST API, repo `sga-encoder/territorial-backend` (local clone `~/Code/territorial-backend`), PostgreSQL on Neon, deployed on Render. Demo data: `scripts/seed_demo.py` (see `spec/features/001-demo-seed/`). Mockups CU-1…CU-15 and class diagram live in the original course repo (`~/Code/territorial_backend`).
- Communication: respond to the user in Spanish. Code identifiers and comments in English. Docs under `src/docs/` are written in Spanish.
- **Always check `src/docs/` first** whenever you need to recall how something works: `src/docs/ui-kit/*.md` documents every design-system component (API, usage, decisions) and `src/docs/*.md` documents features/layout. Read the relevant doc BEFORE re-reading source code or guessing — and keep these docs updated when behavior changes.
- `spec.md` (repo root) is the **domain contract** and is READ-ONLY: backend DTOs/routes (§3), auth (§4), business rules CU-01…CU-15 (§5), coding standards (§12), UI Kit rules RN-UI-* (§13). Read the relevant section before implementing. Note: §7 lists Leaflet/ApexCharts, but the code actually uses `maplibre-gl` for maps and a custom `ReportChart` for reports.

## Working Agreements

- **Reply style:** always answer the user in Spanish using caveman **ultra** mode (`/caveman ultra`). Code, comments, commits and docs stay in normal prose.
- **Code search:** always use the `codebase-memory-mcp` graph first (project `home-x-x-Proyectos-territorial`): `search_graph` for symbols, `trace_path` for callers/callees, `get_code_snippet` for source, `get_architecture` for overview. Fall back to grep/Read only for literals, HTML/SCSS content, or index coverage gaps.
- **Spec Driven Development (`spec/`):** no feature code before its spec. Flow: `spec/features/NNN-name/spec.md` (what + acceptance criteria) → `plan.md` (how, respecting `spec/constitution/tech-stack.md`) → `tasks.md` (checklist) → implement → validate → move to "Hecho" in `spec/constitution/roadmap.md`. The constitution wins: if a feature clashes with `mission.md`/`tech-stack.md`, rethink the feature. Copy `spec/features/_template/` for new features.

## Commands

- `npm start` — dev server at `http://localhost:4200`. Both environments point `baseUrl` to the deployed API `https://territorial-backend.onrender.com` (free tier: first request after idle takes ~50 s); switch to `http://127.0.0.1:5000` in `environment.development.ts` to use a local backend.
- `npm run build` — production build to `dist/territorial/` (browser + SSR server).
- `npm run serve:ssr:territorial` — run the built SSR Express server.
- `npm test` — Vitest via `@angular/build:unit-test`. Single file: `npx ng test --include='src/app/path/file.spec.ts'`. No spec files exist yet; per `.claude/CLAUDE.md`, tests come from the Validation section of `spec.md`, never written ad hoc.
- Formatting: Prettier (`npx prettier --write <files>`); no linter configured.

## Architecture (big picture)

- **Hybrid architecture (spec.md §2):**
  - Uniform CRUDs: `core/http/base-repository.ts` (generic 7 verbs) + one `ResourceMapper` per resource. Each resource under `pages/<resource>/` has model · dto · mapper · repository · service · list · form-dialog. Reference implementation: `pages/entities/` (doc: `src/docs/entity.md`, shared variants in `src/docs/crud-resources.md`).
  - Map/polygons/tracking: light hexagonal (`pages/map/{domain,data,ui}`, `pages/neighborhoods/polygon-editor/`), built on `maplibre-gl`; base style in `components/map/map-style.ts`.
  - Reports: `pages/reports/` (backend dictates chart type; Groq-backed chat in `groq-chat.service.ts`).
- **Data flow:** Component → Service (signals, `firstValueFrom`) → Repository → HttpClient → Backend. Snake_case DTOs never leave repository/mapper; UI models are camelCase.
- **Gotcha:** backend PKs are `id_<resource>` (e.g. `id_city`), never `id`. Mappers translate to model `id`; reading `dto.id` silently breaks edit/delete and `toLabelMap` parent resolution.
- **Auth:** Firebase Auth in `core/auth/auth.service.ts` (role resolved via backend by email), `authInterceptor`, `authGuard`, `roleGuard([...roles])`. Routes in `app.routes.ts`: `/login` public, everything else lazy-loaded inside `layout/shell` behind guards.
- **SSR:** data loading goes in the constructor guarded by `isPlatformBrowser` (no `ngOnInit` for data).
- **Component layers:** `components/ui` (design system atoms, barrel `index.ts`, types in `types.ts`), `components/dynamic` (FormGenerator, Filter, DynamicTable, PageHeader, Chatbot; docs in `src/docs/dynamic/`), `components/visual` (GlassStage, Particles), `components/map`.
- **Naming (spec.md §12):** pages files without `.component.` (`entity-list.ts`, class `EntityList`); private signals `xSignal`, public readonly without suffix.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## UI Kit (Design System) — `src/app/components/ui/`

- **Atomic principle (non-negotiable):** UI Kit components are the ONLY style atoms of the app. Tailwind utility classes are allowed exclusively inside `components/ui` components (and the pre-kit layout chrome until it is migrated). Features compose UI Kit components — never loose utilities, inline styles, or ad-hoc CSS. If a feature needs something visual, extend the UI Kit.
- **Generators are mandatory (RN-GEN, non-negotiable):** every form is built with `<ui-form-generator>` from a `FormSchema` (never a raw `<form>` with loose kit controls or HTML inputs; prefill via each field's `initialValue`, schema as a stable `computed`/`readonly`). Every table with filters is built with `<ui-filter>` (`FilterConfig`) + `<ui-dynamic-table>` (`DynamicColumn[]` + `DynamicRowAction[]`) — never a manual `<table>` or ad-hoc filters. Reference: `pages/entities/`.
- **Tokens are the single source of truth.** Runtime (themable) tokens: `src/styles/_variables.scss`. Static tokens + utility mapping: `src/styles/tailwind.css` (`@theme` / `@theme inline`). Visual recipes: `src/styles/_mixins.scss`. Never hardcode colors, radii, shadows, or blur values.
- **Theming:** dark is the default (`:root`); light applies via `[data-theme='light']` on `<html>`, owned by `ThemeService` (`src/app/components/ui/theme/theme.service.ts`). Components stay theme-blind: no `dark:` variants, no scheme branching — tokens flip instead.
- **Glass where it floats, solid where it reads.** Glass (`glass-surface` mixin / `backdrop-blur-glass`): Modal, Toast, Select dropdown, Tooltip, Sidebar, Navbar, Card `elevated`. Solid (`solid-surface` mixin): inputs, Table, default Card, dense content. Never use `backdrop-filter` on list items or repeated content (performance).
- **Highlight:** the top light line (`surface-highlight` mixin / `inset-shadow-highlight` utilities) is the unifying visual thread on both glass and solid surfaces.
- Every UI Kit component: standalone, inputs typed with union types (never free strings), `input()`/`output()`/`computed()`, plus a Spanish doc entry in `src/docs/ui-kit/<component>.md` with usage and example.
- Form components implement `ControlValueAccessor` and use solid surfaces (legibility).
- UI business rules live in `./spec.md` §13 (RN-UI-*): all public union types in `src/app/components/ui/types.ts`, consumers import only from the barrel `src/app/components/ui/index.ts`, and the kit stays minimal (no components outside the agreed list).
- Build order and theming details: `src/docs/ui-kit/theming.md`.
