# Misión

## Qué construimos

Frontend Angular del **Sistema de Valoración Territorial**: plataforma para alcaldías colombianas que permite reconocer, caracterizar y cuidar el territorio. Consume una API REST Flask inmutable (`sga-encoder/territorial-backend`).

1. **Espacial** — jerarquía territorial (departamento › ciudad › comuna › barrio) y demarcación de barrios con polígonos en mapa.
2. **Social** — anotaciones geolocalizadas de ciudadanos, con categorías, evidencias e interesados.
3. **Comunitario** — votos/calificaciones ciudadanas y reportes inteligentes (gráficas + chat).

## Para quién

- **Administrador** — gestiona entidades, funcionarios, ciudadanos, catálogo y territorio.
- **Funcionario (Official)** — demarca barrios y se rastrea en tiempo real.
- **Ciudadano (Citizen)** — anota, vota y consulta su territorio.

## Principios

- **El backend manda** — su contrato (`spec.md` §3) es inmutable; el frontend se adapta con mappers DTO ↔ modelo.
- **Composición, no estilo suelto** — las features componen el UI Kit y los generadores (RN-GEN, RN-UI-02); nunca utilidades o CSS ad hoc.
- **Accesible por defecto** — AXE limpio y WCAG AA en todo.
- **Pragmatismo** — arquitectura híbrida: genérico donde el backend es uniforme, hexagonal ligero solo donde hay dominio real.

## Qué NO es

- No es el backend: no define reglas de persistencia ni modifica endpoints.
- No es una librería de componentes genérica: el kit es mínimo y cerrado (RN-UI-05).
- No es una app móvil nativa.
