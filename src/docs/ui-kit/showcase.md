# Showcase — `/ui-kit` (Capa 6)

Página de demostración y **documentación viva** del design system: un solo
lugar donde se ve todo el sistema funcionando. Vive en
`src/app/pages/ui-components/` (ruta lazy `/ui-kit`, entrada "UI Kit" en el
sidebar) y es la pieza de sustentación del proyecto.

## Qué demuestra

- **Una sección por componente** (26 en total), organizada por capas, con
  todas sus variantes y estados en vivo: Button en 4 variantes × 3 tamaños +
  loading/disabled, Table con slot de celda + loading + vacío, controles CVA
  con estado disabled, etc.
- **Índice por capas** al inicio (card glass): botones ghost que saltan a
  cada sección con `scrollIntoView` — suave, salvo que el usuario tenga
  `prefers-reduced-motion`.
- **Toggle dark/light en vivo** (header): demuestra el theming por tokens —
  un solo cambio de `data-theme` repinta los 26 componentes.
- **FormGroup real** con validadores y la regla RN-UI-07 (errores solo tras
  enviar): pulsa Enviar vacío para verla.
- **Modal y Toast disparados con botones**: confirma/cancela/ESC en el modal
  (cada vía devuelve un resultado distinto) y ráfagas de toasts para ver el
  límite de 3 (RN-UI-08).

## Principio atómico

La página se construye EXCLUSIVAMENTE con componentes del kit; los únicos
elementos pelados son landmarks semánticos sin estilo (`header`, `nav`,
`section`, `form`, `footer`). Los ejemplos de código de uso **no** se
muestran en pantalla (RN-UI-05: se descartó el componente CodeBlock) — viven
en `src/docs/ui-kit/*.md`, un archivo por componente.

## Cómo extenderla

Al añadir un componente nuevo al kit (con aprobación, RN-UI-05):

1. Crear su `<section id="…">` con título, descripción y todas sus variantes.
2. Añadir la entrada en `sectionIndex` (ui-showcase.ts) bajo su capa.
3. Crear su doc en `src/docs/ui-kit/<componente>.md`.

## Pendientes

- `// TODO: a11y` — pasar AXE sobre la página completa (ambos temas) y mover
  el foco a la sección al navegar desde el índice.
- Migrar las features existentes (entities, layout) a componentes del kit
  para que el principio atómico cubra el 100% de la app.
