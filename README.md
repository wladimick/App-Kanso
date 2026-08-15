# Kanso

Kanso es una aplicación personal para organizar y seguir películas, series, anime y posteriormente manga en un solo lugar.

## Objetivo

- Buscar títulos desde catálogos externos.
- Marcar contenido como pendiente, viendo, completado, pausado o abandonado.
- Registrar temporada y episodio actual.
- Mantener historial de avances y revisualizaciones.
- Crear colecciones personalizadas, por ejemplo Marvel/MCU.
- Mantener el progreso personal separado de los proveedores externos.

## Stack

- React + Vite + TypeScript
- Supabase Auth + Postgres para identidad y progreso personal
- TMDB para películas y series
- AniList para anime y manga
- GitHub Actions para typecheck y build

## Requisitos

- Node.js 22+
- npm
- Proyecto Supabase

## Inicio local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables disponibles:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TMDB_ACCESS_TOKEN=
```

Nunca se debe colocar una clave `sb_secret_...` ni `service_role` en variables `VITE_*`.

## Supabase

La migración inicial se encuentra en:

`supabase/migrations/20260815125300_initial_kanso_schema.sql`

Incluye:

- `library_items`
- `collections`
- `collection_items`
- `watch_events`
- índices
- Row Level Security
- políticas por propietario

La autenticación inicial usa Magic Link por correo. Los dominios de desarrollo y producción deben agregarse a las Redirect URLs permitidas de Supabase Auth.

## Calidad

```bash
npm run typecheck
npm run build
```

GitHub Actions ejecuta ambas validaciones sobre `main`, ramas `agent/**` y pull requests hacia `main`.

## Auditoría del proyecto

Toda acción relevante debe quedar registrada en `docs/auditoria/`.

El protocolo está definido en:

`docs/auditoria/README.md`

Los registros deben indicar fecha/hora, objetivo, acciones ejecutadas, archivos afectados, decisiones técnicas, validaciones, limitaciones, pendientes, rama/PR y commits relevantes.

## Estado actual

- ✅ MVP visual.
- ✅ Cliente Supabase preparado.
- ✅ Magic Link preparado.
- ✅ Esquema SQL + RLS versionado.
- ✅ CI de typecheck/build.
- 🟡 Aplicación de migración en el proyecto Supabase Kanso pendiente de acceso del conector.
- ⬜ Integración TMDB.
- ⬜ Integración AniList.
- ⬜ Reemplazo de datos demo por biblioteca persistida.
