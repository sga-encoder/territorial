# 003 · Backend desplegado con datos demo

**Estado:** implementado ✅

## Qué hace

La API Flask queda desplegada de forma estable en Render (`https://territorial-backend.onrender.com`), con la base demo de Neon y las imágenes en Cloudinary. El frontend, tanto en producción como en desarrollo, la consume sin tener que levantar un backend local.

## Por qué

El despliegue fallaba con `ModuleNotFoundError: No module named 'psycopg'`. SQLAlchemy 2.1 cambió el driver por defecto de `postgresql://` a psycopg 3, y el proyecto trae psycopg2. Además, el frontend de producción apuntaba a `127.0.0.1:5000`, así que no tenía backend real.

## Criterios de aceptación

- [x] `requirements.txt` fija `SQLAlchemy>=2.0,<2.1` y el arreglo está en `main` del backend, que es lo que despliega Render.
- [x] `GET /health` en Render responde `200`.
- [x] La API desplegada devuelve los datos demo completos: 33 departamentos, 1123 ciudades, 13 comunas, 50 barrios, 353 puntos, 8 entidades, 22 funcionarios, 46 ciudadanos, 24 categorías, 170 anotaciones, 211 anotación-categoría, 169 interesados, 460 votos y 256 evidencias.
- [x] `GET /api/officials/search?email=admin@example.com` devuelve el admin con `role = 'admin'`, de modo que el login resuelve el rol.
- [x] Las URLs de imagen apuntan a `res.cloudinary.com` y responden `200`.
- [x] CORS devuelve `Access-Control-Allow-Origin` para orígenes externos.
- [x] `environment.ts` y `environment.development.ts` usan la URL de Render.
- [ ] Login con `admin@example.com` / `Admin123*` contra el backend desplegado; listas, mapa e imágenes visibles en el navegador.

## Fuera de alcance

- Desplegar el frontend: si se publica en un dominio propio, ese dominio hay que agregarlo a *Authorized domains* de Firebase Auth.
- Evitar el arranque en frío del plan gratuito de Render: la primera petición tras ~15 min sin uso tarda ~50 s.
- Vulnerabilidades de dependencias npm (feature aparte).
