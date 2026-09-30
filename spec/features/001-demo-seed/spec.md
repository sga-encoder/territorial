# 001 · Seed de demostración

**Estado:** en curso

## Qué hace

Un comando del backend deja la base de datos llena con datos de ejemplo coherentes, para que cada pantalla del frontend se vea poblada en una exhibición: territorio con barrios demarcados en el mapa, entidades con logo, funcionarios con posición GPS, ciudadanos, categorías con imagen, anotaciones con evidencias, interesados y votos.

Un segundo comando crea en Firebase Auth una cuenta de email/contraseña por cada funcionario y ciudadano sembrado, todas con la contraseña `Admin123*`, para poder entrar con cualquier rol.

## Por qué

El proyecto se presenta como exhibición. El seed actual (`scripts/seed.py`) solo crea un registro por tabla, así que tablas, mapa, tracking y reportes se ven vacíos.

## Criterios de aceptación

- [ ] `python scripts/seed_demo.py` recrea la base y termina sin errores, imprimiendo el conteo por tabla.
- [ ] Todas las tablas del modelo tienen datos: departamentos y ciudades (API Colombia, con fallback offline de Caldas), comunas, barrios, puntos, entidades, funcionarios, ciudadanos, categorías (padre + subcategorías), anotaciones, anotación-categoría, interesados, votos y evidencias.
- [ ] Los nombres de personas son inventados; los correos usan el dominio reservado `example.com`.
- [ ] Cada barrio sembrado tiene un polígono cerrado de ≥ 6 vértices (`point_type = 'vertex'`) sin solaparse con otros barrios.
- [ ] Cada anotación cae dentro del polígono de su barrio (RN-33) y tiene ≥ 1 categoría (RN-31).
- [ ] Se respetan las restricciones del backend: unicidad (RN-01, RN-06, RN-14, RN-15), un voto por ciudadano y anotación (RN-36), estrellas 1–5 (RN-35), punto con un solo dueño.
- [ ] Hay al menos un funcionario con `role = 'admin'` y varios funcionarios normales; parte con `gps_active = true` y parte desconectados (RN-27, RN-28).
- [ ] Logos, imágenes de categoría y evidencias existen como archivos en `UPLOAD_FOLDER` y se sirven en `/api/images/...` (sin imágenes rotas).
- [ ] El resultado es determinista (misma semilla aleatoria, mismos datos).
- [ ] `python scripts/seed_firebase_users.py` crea una cuenta Firebase por funcionario y ciudadano con contraseña `Admin123*`; si el correo ya existe, lo informa y sigue.
- [ ] Iniciar sesión con la cuenta admin sembrada muestra el rol admin y todas las listas pobladas.

## Fuera de alcance

- Cambios en el contrato de la API o en los modelos del backend.
- Reportes con IA: dependen de un servicio externo, no de la base.
- Borrar o cambiar la contraseña de cuentas Firebase existentes (requiere Admin SDK).
