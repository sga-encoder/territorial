# 002 · Imágenes en Cloudinary

**Estado:** en curso

## Qué hace

Los logos de entidades, las imágenes de categorías y las evidencias de anotaciones se guardan en Cloudinary en lugar del disco del servidor. La base guarda la URL pública (`https://res.cloudinary.com/...`) y el frontend la muestra tal cual.

## Por qué

El backend corre en Render, cuyo disco es efímero, y `app/uploads` está fuera de git. Hoy las imágenes subidas se pierden en cada despliegue y las del seed demo solo existen en la máquina local, así que en producción se ven rotas.

## Criterios de aceptación

- [ ] Con `CLOUDINARY_URL` definida, crear o editar una entidad, categoría o evidencia con archivo sube la imagen a Cloudinary (carpeta `territorial/<logos|categories|evidences>`) y guarda la `secure_url`.
- [ ] Sin `CLOUDINARY_URL`, el backend conserva el comportamiento actual (disco local + `/api/images/...`).
- [ ] Se mantiene la validación de extensiones (png, jpg, jpeg, webp).
- [ ] `seed_demo.py` sube sus imágenes a Cloudinary cuando está configurado. Las guarda como PNG con `public_id` fijo, así que al repetir el seed se sobrescriben y no se duplican.
- [ ] Neon queda con URLs de Cloudinary y el frontend muestra logos, categorías y evidencias sin imágenes rotas, en local y en producción.
- [ ] `CLOUDINARY_URL` está documentada en `.env.example`, en `render.yaml` (`sync: false`) y en el README.
- [ ] El contrato de la API no cambia: los campos `*_url` siguen siendo strings.

## Fuera de alcance

- Borrar de Cloudinary la imagen anterior al editar o eliminar un registro.
- Transformaciones o miniaturas por tamaño en el frontend.
- Migrar imágenes subidas antes de este cambio (no hay en producción).
