# 004 · Selección en cascada en Demarcación

**Estado:** en curso

## Qué hace

En **Territorio → Demarcación**, el barrio a demarcar se elige siguiendo la jerarquía territorial (RN-13): primero el **departamento**, luego la **ciudad** de ese departamento, luego la **comuna** (solo si la ciudad tiene comunas) y por último el **barrio**. Cada nivel muestra solo las opciones del nivel anterior.

## Por qué

Hoy la página ofrece un selector de ciudad con las 1123 ciudades del país, mezcladas, y un selector de barrio. Encontrar la ciudad es incómodo, y la comuna no participa aunque es el padre directo del barrio.

## Criterios de aceptación

- [ ] El primer selector es **Departamento**, con búsqueda y orden alfabético.
- [ ] **Ciudad** aparece al elegir departamento y lista solo las ciudades de ese departamento, con búsqueda y orden alfabético.
- [ ] Si la ciudad tiene comunas, aparece **Comuna** con solo las comunas de esa ciudad. Si no tiene, se informa que no tiene comunas ni barrios para demarcar y no se muestran más selectores.
- [ ] **Barrio** lista los barrios de la comuna elegida, o los de toda la ciudad mientras no se elija comuna.
- [ ] Cambiar un nivel limpia los niveles inferiores y el polígono cargado.
- [ ] El mapa muestra el resumen de polígonos de la ciudad o de la comuna seleccionada, y el polígono del barrio al elegirlo (comportamiento actual).
- [ ] Cambiar de barrio con cambios sin guardar sigue pidiendo confirmación (comportamiento actual).
- [ ] Solo se usan componentes del UI Kit (`ui-select`), sin estilos nuevos.
- [ ] `npm run build` pasa.

## Fuera de alcance

- Barrios sin comuna: el backend exige `id_commune`, así que no existen.
- Cambios en la edición del polígono o en el backend.
