# Auditoría · Actualidad v2 · Estrenos + Top actual

**Fecha:** 2026-08-16
**Proyecto:** Kanso
**Rama:** `feat/releases-v2-top-actual`

## Objetivo

Corregir definitivamente la composición UI/UX de Estrenos en teléfono/tablet, permitir carga progresiva real y agregar una vista de tendencias actuales.

## Cambios

- `ReleasesRoute` ahora se renderiza dentro del contenedor principal `.content` mediante portal, en vez de competir con el layout exterior del sidebar.
- Se crea `actuality.css` como capa visual específica cargada después de Mobile UX v3.
- Estrenos usa cards compactas centradas en poster, fecha, título, TMDB y acción rápida de agregar.
- Responsive: 5 columnas desktop, 4/3 en tablet, 3 en teléfono normal y 2 bajo 360 px.
- Se añade selector principal `Estrenos / Top actual`.
- `Top actual` usa TMDB Trending diario y permite Todo / Películas / Series.
- Se agrega paginación a `tmdb-releases` mediante `page` + `hasMore`.
- La UI revela contenido en bloques de 12; cuando agota el lote local solicita la siguiente página a TMDB.
- Se conserva `fetchUpcomingReleases` para Home y notificaciones existentes.
- Se evita duplicar resultados al concatenar páginas.

## Backend

`tmdb-releases` admite ahora:

```json
{
  "mode": "upcoming | trending",
  "filter": "all | movie | series",
  "page": 1
}
```

El token TMDB permanece exclusivamente en `TMDB_READ_ACCESS_TOKEN` del entorno de Supabase.

## Validación prevista

- Regression tests completos.
- TypeScript.
- Build Vite.
- Vercel Preview.
- QA visual teléfono/tablet previo a merge.

## Dependencia manual

La nueva versión de `supabase/functions/tmdb-releases/index.ts` debe desplegarse en el proyecto Supabase de Kanso para habilitar paginación y Top actual en producción.
