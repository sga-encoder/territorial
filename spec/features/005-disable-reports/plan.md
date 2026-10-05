# 005 · Inhabilitar Reportes — Plan

1. `layout/sidebar/sidebar.ts`: poner `enabled: false` en los dos ítems del grupo `reports` (el sidebar ya los muestra deshabilitados).
2. `app.routes.ts`: reemplazar el `loadChildren` de `reports` por `redirectTo: ''`. Las líneas originales quedan en un comentario para reactivar la sección.

**Para reactivar:** revertir los dos pasos.
