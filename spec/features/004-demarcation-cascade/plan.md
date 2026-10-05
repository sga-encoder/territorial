# 004 · Selección en cascada en Demarcación — Plan

## Enfoque

El cambio queda dentro de la página contenedora `pages/neighborhoods/polygon-editor/polygon-editor.ts` (+ `.html`). Los selectores siguen siendo `ui-select` con `FormControl`, como hoy. Las opciones de cada nivel son `computed` sobre los servicios ya existentes (`DepartmentService`, `CityService`, `CommuneService`, `NeighborhoodService`), que se cargan una vez al entrar.

## Implementación

1. Añadir `departmentControl` y `communeControl`, y sus `toSignal`.
2. `departmentOptions`; `cityOptions` filtrado por departamento; `communeOptions` filtrado por ciudad; `cityHasCommunes`; `neighborhoodOptions` filtrado por comuna o, si no hay comuna, por ciudad.
3. Suscripciones en cascada: cada cambio limpia los niveles inferiores (`emitEvent: false`), resetea el estado del editor y recalcula el resumen del mapa.
4. Generalizar `loadCityOverview` a `loadOverview()`, que toma el alcance actual (comuna si hay; si no, ciudad).
5. Plantilla: revelado progresivo con `@if` (Ciudad tras Departamento, Comuna/Barrio tras Ciudad) y un aviso `ui-text` cuando la ciudad no tiene comunas.
6. Actualizar `src/docs/neighborhood-polygon-editor.md` (flujo de selección).

## Decisiones

- **Revelado progresivo en lugar de selectores deshabilitados** — evita habilitar y deshabilitar `FormControl` a mano y muestra solo lo accionable.
- **Barrio filtrable sin comuna** — si el usuario conoce el barrio, no lo obligamos a elegir antes la comuna.

## Riesgos

- **Cargar todos los barrios y comunas** — son pocos (decenas); las ciudades (1123) solo se filtran en memoria.
