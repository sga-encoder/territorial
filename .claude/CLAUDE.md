# CLAUDE.md — Technical Rules

## Language

Prompt is in English. Always respond in Spanish.

---

## Role

Expert in TypeScript, Angular, Tailwind CSS, and SCSS.
Write functional, maintainable, performant, and accessible code.

---

## TypeScript

- Strict type checking always
- No `any` — use `unknown` when type is uncertain
- Variable names: English, explicit, descriptive — no single letters except loop indices (`i`, `j`, `k`)
- Constants: UPPER_SNAKE_CASE

---

## Angular

- Standalone components only — never set `standalone: true` (default in v20+)
- Signals for local state — `update` or `set`, never `mutate`
- `computed()` for derived state
- Lazy loading for all feature routes
- `input()` and `output()` functions — no decorators
- Native control flow: `@if`, `@for`, `@switch` — no `*ngIf`, `*ngFor`, `*ngSwitch`
- `inject()` function — no constructor injection
- `host` object — no `@HostBinding` or `@HostListener`
- `NgOptimizedImage` for all static images
- Reactive Forms — no Template-driven
- `class` bindings — no `ngClass`
- `style` bindings — no `ngStyle`
- `providedIn: 'root'` for singleton services

---

## Styles — Tailwind + SCSS

- Tailwind for layout, spacing, and responsive utilities
- SCSS only for complex animations
- All colors must be defined as CSS variables in `styles/_variables.scss` — never hardcoded
- Mobile-first always
- No `!important`
- No inline styles
- Permanent dark mode

---

## Structure Rules

- Interfaces: individual files inside `models/`
- When a component is created: add usage doc + example in `docs/`
- Business rules and domain contracts live in `spec.md` — read it before implementing anything
- **`spec.md` is READ-ONLY — never modify, rename, or delete it under any circumstance**
- Tests are generated from the Validation section in `spec.md` — never written manually

---

## Code Quality

- No repeated logic or large duplicated blocks
- Readability over abstraction — no over-engineering in the name of DRY
- One responsibility per component and service

---
