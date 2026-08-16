# Auditoría · Kanso Mobile UX v3 · Estrenos & Notificaciones

**Fecha:** 2026-08-16 13:03 CLT  
**Autor:** ChatGPT · GPT-5.6 Sol  
**Rama:** `feat/mobile-ux-v3-releases-notifications`

## Objetivo

Evolucionar Kanso desde un tracker pasivo hacia una app móvil que ayude a anticipar qué ver y qué viene próximamente.

## Acciones realizadas

- Se crea página independiente **Estrenos**.
- La navegación móvil primaria pasa a `Inicio · Biblioteca · Agregar · Estrenos · Buscar`.
- Marvel permanece disponible desde el menú completo y su hub existente.
- Se agrega centro de **notificaciones in-app** con contador de no leídas.
- Las notificaciones priorizan estrenos cercanos y títulos pendientes de la biblioteca.
- Preferencias de avisos y estado leído se persisten por `user_id` en almacenamiento local.
- Se agrega iconografía compacta de estado en posters: `✓` visto, `▶` viendo, `♡` pendiente, `Ⅱ` pausado y `×` abandonado.
- Se crea Edge Function `tmdb-releases` protegida por usuario para consultar próximos 90 días de películas y series desde TMDB.
- El token TMDB permanece exclusivamente en el servidor mediante `TMDB_READ_ACCESS_TOKEN`.
- Se mantiene compatibilidad con UX v2 y con safe areas de iPhone.

## Seguridad

- `tmdb-releases` usa `withSupabase({ auth: "user" })`.
- No se expone el token TMDB al frontend.
- Preferencias/notificaciones locales se namespacen por UUID del usuario autenticado.
- No se modifica RLS ni el esquema de tablas existente.

## Dependencia de despliegue

Para que la página Estrenos y las notificaciones basadas en calendario funcionen con datos reales, debe existir en el Supabase de Kanso la Edge Function:

`tmdb-releases`

El código versionado está en `supabase/functions/tmdb-releases/index.ts` y reutiliza el secreto existente `TMDB_READ_ACCESS_TOKEN`.

## QA agregado

`tests/mobile-ux-v3.test.mjs` cubre:

- navegación móvil a Estrenos;
- aislamiento por URL;
- persistencia por usuario;
- contador no leído y marcar todo;
- cruce con lista de deseos;
- iconos de estado accesibles;
- autenticación y secreto server-side de la Edge Function;
- ventana futura de películas/series;
- grilla móvil de 3 columnas;
- orden de cascade v2 → v3 y montaje de componentes.

## Riesgo residual

Las notificaciones son **in-app**, no push del sistema operativo. Push/PWA queda para una etapa posterior una vez validemos utilidad y frecuencia de los avisos internos.
