# 003 · Backend desplegado con datos demo — Tareas

- [x] Fijar `SQLAlchemy>=2.0,<2.1` en `requirements.txt` del backend.
- [x] Unir `feat/demo-seed` en `main` del backend y hacer push (Render redepliega).
- [x] Variables en Render: `DATABASE_URL`, `CLOUDINARY_URL`, `SECRET_KEY`.
- [x] Verificar `/health`, el conteo de cada recurso, el admin por email, las imágenes de Cloudinary y CORS en Render.
- [x] Apuntar `environment.ts` y `environment.development.ts` a Render.
- [ ] Login `admin@example.com` / `Admin123*` en el navegador contra Render; revisar listas, mapa e imágenes.
- [ ] Mover 001, 002 y 003 a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Antes de una exhibición: abrir la app ~1 min antes (arranque en frío de Render).
- [ ] Para restaurar la demo: `cd ~/Code/territorial-backend && .venv/bin/python scripts/seed_demo.py` (borra y recrea todo).
