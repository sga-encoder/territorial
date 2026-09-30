# 001 · Seed de demostración — Plan

## Enfoque

El seed vive en el backend (`territorial_backend_flask/scripts/`), porque la base es suya y el ORM permite sembrar sin autenticación y en una sola transacción. El contrato de la API no cambia, así que el frontend sigue respetando la regla de "backend inmutable" de `spec.md`.

Los datos se generan con `random.Random(42)` a partir de catálogos escritos a mano (nombres inventados, barrios, categorías, textos de anotaciones), así que el resultado es verosímil y reproducible.

## Implementación

1. `scripts/seed_demo.py`: `drop_all` + `create_all`, y luego siembra en orden de dependencias:
   - Departamentos y ciudades: API Colombia (como `seed.py`), con fallback offline de Caldas si no hay red.
   - Manizales: 11 comunas con 4 barrios cada una. Villamaría: 2 comunas con 3 barrios cada una.
   - Polígonos: centros de barrio en una rejilla alrededor de la ciudad, con un polígono irregular convexo de 6–8 vértices y radio menor que la mitad de la separación (no se solapan).
   - Entidades (8), funcionarios (~20, 2 admin), ciudadanos (~45), categorías (6 padres × 3 subcategorías).
   - Anotaciones (~160) dentro del polígono de su barrio, con 1–2 categorías, 0–2 interesados, 0–6 votos únicos y 1–2 evidencias.
   - Imágenes: SVG generados por el script (sin dependencias) en `UPLOAD_FOLDER/{logos,categories,evidences}`, guardados como `/api/images/<carpeta>/<archivo>` (mismo formato que `app/utils/files.py`).
2. `scripts/seed_firebase_users.py`: lee los correos de funcionarios y ciudadanos en la base y llama a `accounts:signUp` de Identity Toolkit con `FIREBASE_API_KEY` (la web API key pública del frontend) y la contraseña `Admin123*`. Trata `EMAIL_EXISTS` como omitido.

## Decisiones

- **ORM en lugar de sembrar vía REST** — es más rápido y atómico, y no necesita token. Descartado: script Node contra la API (lento, y dependería de que la auth del backend lo permita).
- **SVG generados** — no hace falta Pillow ni red. El `<img>` los muestra y `send_from_directory` los sirve con `image/svg+xml`.
- **Dominio `example.com`** — reservado (RFC 2606), así que nunca llega correo a terceros.
- **Script aparte para Firebase** — es una acción externa y lenta. Se ejecuta a propósito, no en cada reset de la base.

## Riesgos

- **`drop_all` borra la base local** — por eso es un script separado de `seed.py`, y el README lo avisa.
- **Proveedor email/password deshabilitado en Firebase** — el script muestra el error `OPERATION_NOT_ALLOWED` y termina.
- **Cuota de alta por IP en Firebase** (~100 por hora) — son ~65 cuentas, con una pausa corta entre llamadas.
- **Cuentas preexistentes con otra contraseña** — se informan. Cambiarlas requiere Admin SDK (fuera de alcance).
