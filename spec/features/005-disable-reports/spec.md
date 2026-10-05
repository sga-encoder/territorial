# 005 · Inhabilitar Reportes

**Estado:** implementado ✅

## Qué hace

La sección **Reportes** (Consulta visual y Chat IA) queda inhabilitada: en el sidebar sus ítems aparecen deshabilitados y la ruta `/reports` (y sus subrutas) redirige al inicio. El código de `pages/reports/` se conserva, así que la sección se puede reactivar.

## Por qué

Decisión del usuario para la exhibición: los reportes dependen de servicios de IA externos y no se van a mostrar.

## Criterios de aceptación

- [x] En el sidebar del admin, "Consulta visual" y "Chat IA" están deshabilitados (no navegan).
- [x] Entrar a `/reports` o `/reports/chat` redirige al inicio.
- [x] El chunk de reportes ya no se carga.
- [x] `npm run build` pasa.

## Fuera de alcance

- Borrar `pages/reports/` o `groq-chat.service.ts`.
