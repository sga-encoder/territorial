# 002 · Imágenes en Cloudinary — Plan

## Enfoque

Todo el cambio es del backend (`sga-encoder/territorial-backend`), dentro del único punto de subida: `app/utils/files.py::save_uploaded_file`. Si hay `CLOUDINARY_URL`, la función sube a Cloudinary y devuelve la URL absoluta; si no, guarda en disco como hasta ahora. Los controladores no cambian.

El frontend no necesita cambios: los mappers de entidad y categoría solo anteponen `baseUrl` cuando la ruta empieza por `/`, y el de evidencia usa la URL tal cual. Así, las URLs absolutas de Cloudinary pasan sin tocarse. De hecho, este cambio arregla las evidencias, que antes quedaban como rutas relativas sin host.

## Implementación

1. `requirements.txt`: añadir `cloudinary`.
2. `app/utils/files.py`: añadir `cloudinary_enabled()` y `upload_to_cloudinary(source, folder, public_id=None, format=None)`. `save_uploaded_file` usa Cloudinary cuando está habilitado.
3. `scripts/seed_demo.py`: `write_svg` sube el SVG convirtiéndolo a PNG (`format="png"`) con `public_id` fijo y `overwrite=True`. Las evidencias guardan `file_type = image/png` y el tamaño que devuelve Cloudinary. Sin Cloudinary, se mantiene el comportamiento local.
4. `.env.example`, `render.yaml` y `README.md`: documentar `CLOUDINARY_URL`.
5. Volver a ejecutar `seed_demo.py` contra Neon con Cloudinary configurado.

## Decisiones

- **`CLOUDINARY_URL` única** — es el formato nativo del SDK (`cloudinary://key:secret@cloud`), así que basta una sola variable. Se descartan tres variables separadas.
- **Fallback local** — el desarrollo sin cuenta de Cloudinary sigue funcionando.
- **SVG convertido a PNG al subir** — algunas cuentas restringen la entrega de SVG, y PNG se ve igual en todos los navegadores.

## Riesgos

- **Cuota del plan gratuito** — ~290 imágenes pequeñas del seed están muy por debajo del límite.
- **Seed más lento** — una subida HTTP por imagen. Es aceptable para un script que se corre de vez en cuando.
- **Secreto en `.env`** — ya está ignorado por git. En Render se configura como variable de entorno.
