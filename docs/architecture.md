# Arquitectura de Kanso

## Principio

Kanso separa el **catálogo externo** del **estado personal del usuario**.

### Catálogo externo

- TMDB: películas, series, temporadas, episodios, imágenes y metadatos generales.
- AniList: anime y, en una fase posterior, manga.
- Los proveedores externos no son la fuente de verdad del progreso personal.

### Persistencia propia · Supabase

Supabase almacena el estado personal y referencias a proveedores externos:

- usuario autenticado
- proveedor (`tmdb` / `anilist` / `manual`)
- ID externo
- tipo (`movie` / `series` / `anime` / `manga`)
- estado (`planned`, `watching`, `completed`, `paused`, `dropped`)
- temporada / episodio actual
- totales conocidos de temporadas / episodios
- puntuación personal
- favorito
- notas
- fechas de inicio y finalización
- pertenencia a colecciones
- historial de eventos de visualización

## Modelo de datos inicial

### `library_items`

Fuente de verdad de la biblioteca personal de cada usuario.

### `collections`

Colecciones personalizadas, por ejemplo `Marvel`, `X-Men`, `Christopher Nolan` o listas creadas por el usuario.

### `collection_items`

Relación entre títulos y colecciones. Incluye `user_id` y claves foráneas compuestas para impedir relaciones cruzadas entre usuarios.

### `watch_events`

Historial cronológico de avances, finalizaciones, revisualizaciones y puntuaciones.

## Autenticación

- Supabase Auth.
- Primera implementación: Magic Link por correo mediante `signInWithOtp`.
- La sesión se persiste y refresca mediante `@supabase/supabase-js`.
- Los dominios de desarrollo/producción deben estar autorizados como Redirect URLs en Supabase Auth.

## Seguridad

- El frontend usa únicamente `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Nunca se debe introducir una `sb_secret_...`, `service_role` o credencial equivalente en código cliente.
- Todas las tablas propias expuestas usan Row Level Security.
- Las políticas verifican `(select auth.uid()) = user_id` para lectura y escritura.
- El rol `anon` no recibe permisos sobre las tablas personales.
- Las operaciones `UPDATE` incluyen `USING` y `WITH CHECK`.
- La migración inicial está versionada en `supabase/migrations/`.

## Runtime

- React + Vite + TypeScript.
- Node.js 22 o superior.
- `@supabase/supabase-js` fijado a una versión exacta en `package.json`.

## Fases

1. ✅ MVP local navegable con datos de demostración.
2. 🟡 Persistencia Supabase y autenticación: código y migración preparados; falta aplicar/validar la migración en el proyecto Kanso.
3. ⬜ Búsqueda real mediante TMDB.
4. ⬜ Integración AniList para anime.
5. ⬜ Sustituir datos demo por biblioteca persistida.
6. ⬜ Colecciones inteligentes (Marvel, sagas, franquicias).
7. ⬜ Próximos estrenos y recordatorios opcionales.

## Auditoría

Todo cambio relevante debe registrarse en `docs/auditoria/` siguiendo el protocolo definido en `docs/auditoria/README.md`.
