# CLAUDE.md

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project Context

- Angular v22 (standalone, signals, SSR via Express), Tailwind CSS v4 (CSS-first config), SCSS, Vitest.
- Backend: Flask REST API in `../territorial_backend` (domain models, mockups CU-1…CU-15 and class diagram live there).
- Communication: respond to the user in Spanish. Code identifiers and comments in English. Docs under `src/docs/` are written in Spanish.
- **Always check `src/docs/` first** whenever you need to recall how something works: `src/docs/ui-kit/*.md` documents every design-system component (API, usage, decisions) and `src/docs/*.md` documents features/layout. Read the relevant doc BEFORE re-reading source code or guessing — and keep these docs updated when behavior changes.
- `spec.md` is not in the repo; its palette (§8) is preserved in `src/styles/_variables.scss` and domain/auth notes (§3, §4) are referenced from code comments.

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
- UI business rules live in `./spec.md` (RN-UI-*): all public union types in `src/app/components/ui/types.ts`, consumers import only from the barrel `src/app/components/ui/index.ts`, and the kit stays minimal (no components outside the agreed list).
- Build order and theming details: `src/docs/ui-kit/theming.md`.
