# Arquitectura inicial de Kanso

## Principio

Kanso separa el **catálogo externo** del **estado personal del usuario**.

### Catálogo

- TMDB: películas, series, temporadas, episodios, imágenes y metadatos generales.
- AniList: anime y, en una fase posterior, manga.

### Datos propios

Supabase almacena información personal y referencias a proveedores externos:

- usuario;
- proveedor (`tmdb` / `anilist` / `manual`);
- ID externo;
- tipo (`movie` / `series` / `anime` / `manga`);
- estado (`planned`, `watching`, `completed`, `paused`, `dropped`);
- temporada / episodio actual;
- puntuación personal;
- favorito;
- fechas de inicio y finalización;
- pertenencia a colecciones;
- eventos históricos de avance, finalización y puntuación.

## Flujo actual del frontend

### Sin sesión

Kanso funciona en **modo demostración**:

- muestra datos demo locales;
- permite probar filtros y progreso;
- ningún cambio se persiste en Supabase.

### Con sesión autenticada

Kanso cambia a **modo Supabase**:

1. `useAuth()` obtiene la sesión activa.
2. `useLibrary(userId)` consulta `library_items`.
3. El dashboard deja de mostrar títulos demo.
4. Una biblioteca vacía se muestra como estado vacío real.
5. El botón de avance de episodio ejecuta `updateProgress()`.
6. `updateProgress()` actualiza `library_items` y crea un registro en `watch_events`.

Esta separación evita contaminar datos personales con contenido de demostración.

## Modelo inicial de datos

### `library_items`

Fuente de verdad del estado actual de cada título agregado por el usuario.

### `watch_events`

Historial de eventos asociados a un título, pensado para conservar avance y actividad en el tiempo.

### `collections`

Colecciones creadas por el usuario, por ejemplo Marvel/MCU.

### `collection_items`

Relación entre una colección y los títulos guardados en la biblioteca.

## Autenticación

Kanso utiliza Supabase Auth con acceso passwordless mediante Magic Link.

El cliente browser:

- persiste sesión;
- refresca tokens;
- detecta sesión después del redirect.

Los dominios reales de desarrollo y producción deben agregarse a las Redirect URLs autorizadas de Supabase Auth antes de validar el flujo completo.

## Seguridad

La migración inicial define:

- RLS en todas las tablas personales;
- políticas por `(select auth.uid()) = user_id`;
- `USING` + `WITH CHECK` en UPDATE;
- CRUD revocado a `anon`;
- acceso de `authenticated` condicionado por RLS;
- claves foráneas compuestas para impedir asociaciones entre registros pertenecientes a usuarios distintos.

El frontend utiliza únicamente una publishable key. Nunca debe contener `service_role`, `sb_secret_...` u otra credencial privilegiada.

## Estado de la migración

Archivo versionado:

`supabase/migrations/20260815125300_initial_kanso_schema.sql`

El usuario confirmó el 2026-08-15 que aplicó manualmente esta migración en el proyecto Supabase correcto de Kanso, ubicado en otra cuenta distinta a la conexión Supabase visible desde esta sesión de ChatGPT.

Por ello:

- la aplicación manual se considera informada/confirmada por el usuario;
- la validación directa del esquema y los datos desde ChatGPT permanece pendiente;
- WebOps TIBOX no fue modificado.

## Runtime y calidad

- Node.js 22+
- React + Vite + TypeScript
- `@supabase/supabase-js` fijado a `2.111.0`
- `package-lock.json` versionado
- GitHub Actions con `npm ci`, typecheck y build

La activación del dashboard autenticado fue validada correctamente por CI.

## Fases

1. ✅ MVP local navegable con datos de demostración.
2. ✅ Cliente Supabase y autenticación preparados.
3. ✅ Esquema inicial versionado; aplicación manual confirmada por el usuario.
4. ✅ Dashboard conectado a `library_items` para sesiones autenticadas.
5. ⏳ Prueba funcional real de Auth + lectura/escritura contra el proyecto Kanso.
6. ⏳ Búsqueda real mediante TMDB.
7. ⏳ Integración AniList para anime/manga.
8. ⏳ Colecciones inteligentes (Marvel, sagas, franquicias).
9. ⏳ Próximos estrenos y recordatorios opcionales.
