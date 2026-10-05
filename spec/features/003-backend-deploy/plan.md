# 003 · Backend desplegado con datos demo — Plan

## Enfoque

Arreglar con el mínimo de cambios: fijar la versión de SQLAlchemy en lugar de cambiar de driver o reescribir la configuración, reutilizar Neon tal como ya está sembrado (001) con imágenes en Cloudinary (002), y apuntar el frontend a Render.

## Pasos

1. **Backend: driver de Postgres.** Añadir `SQLAlchemy>=2.0,<2.1` a `requirements.txt` para que `postgresql://` siga usando psycopg2 (commit `0dca8f2`).
2. **Backend: llevarlo a `main`.** Unir `feat/demo-seed` en `main` (merge `10ca660`). Render vuelve a desplegar solo al cambiar `main`.
3. **Render: variables de entorno.** `DATABASE_URL` (Neon), `CLOUDINARY_URL` y `SECRET_KEY`, configuradas en el panel de Render.
4. **Datos.** Neon ya tiene el seed demo con imágenes en Cloudinary (`scripts/seed_demo.py`), y las cuentas Firebase están creadas (`scripts/seed_firebase_users.py`). No hace falta volver a sembrar.
5. **Frontend.** `baseUrl` de los dos environments apunta a `https://territorial-backend.onrender.com`.
6. **Verificación.** Comprobar con `curl` `/health`, el conteo de cada recurso, la búsqueda del admin por email, una imagen de Cloudinary y las cabeceras CORS. Después, login en el navegador.

## Decisiones

- **Fijar SQLAlchemy en lugar de instalar psycopg 3** — es un cambio de una línea y no toca código. Se descartó migrar a psycopg 3 y cambiar el prefijo de `DATABASE_URL`.
- **Desarrollo también contra Render** — no hay que instalar Python ni levantar Flask para trabajar en el frontend. Contra: los cambios hechos en desarrollo modifican los datos demo, pero se restauran con `seed_demo.py`.

## Riesgos

- **Arranque en frío de Render (plan gratuito)** — la primera petición tarda. Hay que abrir la app un minuto antes de la exhibición.
- **Volver a sembrar borra los cambios hechos a mano** — `seed_demo.py` hace `drop_all`. Se corre solo cuando se quiere restaurar la demo.
