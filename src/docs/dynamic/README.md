# Capa `dynamic` — composiciones dirigidas por datos

`src/app/components/dynamic/` es una capa **hermana** del UI Kit, no parte de él. Su
razón de existir: el kit (`components/ui`) son **átomos de estilo** sin lógica
(RN-UI-02), pero la app necesita piezas reutilizables que **orquestan** esos
átomos a partir de configuración o que cargan lógica (pipelines, motores de
schema, estado conversacional). Eso no cabe en el kit sin romper su principio
atómico ni RN-UI-05 (kit mínimo).

## Reglas de la capa

- **Compone el kit, no lo reescribe.** Todo lo visual sale de `components/ui`
  (importado desde `../ui`). La capa solo añade **glue de layout** mínimo en
  Tailwind (grid, gap, flex) donde el `Container` no alcanza; nunca define
  color/superficie/tipografía a mano — eso siempre viene de tokens o componentes
  del kit.
- **Dirección de dependencia:** `dynamic` → `ui`. Nunca al revés.
- **Tipos centralizados:** todos los tipos públicos viven en
  `src/app/components/dynamic/types.ts` (espejo de RN-UI-01 para esta capa) y reutilizan
  las uniones del kit (`BadgeVariant`, `IconName`, `TableColumn`…) en vez de
  redefinirlas. Sin `any`; uniones semánticas, nunca strings de Tailwind en la config.
- **Barrel propio:** las features importan desde `src/app/components/dynamic`
  (nunca de los archivos sueltos). El selector mantiene el prefijo `ui-` por
  ergonomía; la separación es estructural (carpeta + barrel + tipos).

## Componentes

| Componente | Selector | Doc |
| --- | --- | --- |
| `DynamicTable` (+ `DynamicCell`) | `<ui-dynamic-table>` | [dynamic-table.md](dynamic-table.md) |
| `Filter` | `<ui-filter>` | [filter.md](filter.md) |
| `FormGenerator` (+ `DynamicInput`) | `<ui-form-generator>` | [form-generator.md](form-generator.md) |
| `Chatbot` | `<ui-chatbot>` | [chatbot.md](chatbot.md) |

Demo viva de los tres en `/ui-kit` (grupo «Capa dynamic» del índice).
