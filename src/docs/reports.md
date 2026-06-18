# Reportes — `/reports` (panel, no CRUD)

Panel de consulta en lenguaje natural: el usuario escribe una pregunta, el
backend (Gemini) responde con `{ type, labels, series }` y se dibuja como gráfico.

## Archivos

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Model | `models/report.model.ts` | Unión `ReportResponse` (`pie` \| `bar` \| `line`) |
| Service | `pages/reports/report.service.ts` | `generate(query)` → POST `/reports` (signals) |
| Gráfico | `pages/reports/report-chart.ts` | Render **SVG** (pie/bar/line), sin dependencias |
| Página | `pages/reports/reports-page.ts` | Caja de consulta (form-generator) + gráfico |
| Rutas | `pages/reports/reports.routes.ts` | Lazy (`/reports`) |

## Contrato

- **POST `/reports`** body `{ "query": "comuna con mas barrios" }`. **Ojo:** la URL
  es `${baseUrl}/reports`, **sin** el prefijo `/api`, por eso `ReportService` usa
  `HttpClient` directo y **no** `BaseRepository`.
- Respuesta: unión discriminada por `type`:
  - `pie`: `series: number[]` (un valor por etiqueta).
  - `bar` / `line`: `series: { name, data: number[] }[]` (una o más series).

## Por qué SVG y no ApexCharts/Chart.js

El prompt sugería ApexCharts o Chart.js, pero el proyecto no tenía librería de
gráficos y ambas añaden peso y fricción con SSR (render solo-navegador,
`afterNextRender`, etc.). `report-chart.ts` dibuja **SVG puro**: temable con los
tokens (`var(--color-primary|success|warning|danger|info)`), seguro en SSR, cero
dependencias y alineado con la filosofía del design system. Si se prefiere
ApexCharts, basta reemplazar `ReportChart` manteniendo el mismo `input` `report`.

## Detalles del render (`report-chart.ts`)

- **Geometría calculada en TS** (computed) y template declarativo con `[attr.*]`
  y `[style.fill|stroke]` (las CSS vars se aplican como estilo, no como atributo
  de presentación).
- **pie:** ángulos acumulados → `path` de arco; una sola porción no nula se dibuja
  como `<circle>` (un arco no puede cerrar 360°). Leyenda con valor y porcentaje.
- **bar:** barras agrupadas por etiqueta (una por serie), escala al máximo global.
- **line:** una `<polyline>` + puntos por serie.
- **Paleta** cíclica de 5 tokens para >5 series/porciones.

## Formulario

La caja de consulta es un `<ui-form-generator>` de un solo campo `textarea`
`query` (RN-GEN: todo formulario nace de un schema). Al enviar llama
`reportService.generate(query)`; la página muestra spinner mientras carga, el
gráfico cuando hay respuesta, o un `empty-state`/error según el estado.
