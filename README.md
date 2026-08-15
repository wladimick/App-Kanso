# Kanso

Kanso es una aplicación personal para organizar y seguir películas, series y anime en un solo lugar.

## Objetivo

- Buscar títulos desde catálogos externos.
- Marcar contenido como pendiente, viendo, completado, pausado o abandonado.
- Registrar temporada y episodio actual.
- Crear colecciones personalizadas, por ejemplo Marvel/MCU.
- Mantener el progreso personal separado de los proveedores externos.

## Stack

- React + Vite + TypeScript
- Supabase para autenticación, progreso, listas y colecciones
- TMDB para películas y series
- AniList para anime y manga en una etapa posterior

## Requisitos

- Node.js 22 o superior
- npm

## Desarrollo local

```bash
npm ci
npm run dev
```

Validaciones:

```bash
npm run typecheck
npm run build
```

## Variables de entorno

Kanso utiliza variables Vite:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TMDB_ACCESS_TOKEN=
```

No guardar claves `service_role`, `sb_secret_...` ni otros secretos de backend en variables `VITE_`, porque estas se exponen al navegador.

## Supabase

El esquema inicial está versionado en:

```text
supabase/migrations/20260815125300_initial_kanso_schema.sql
```

El usuario confirmó el 15 de agosto de 2026 que esta migración fue aplicada manualmente en el proyecto Supabase correcto de Kanso, alojado en otra cuenta distinta de la conexión Supabase disponible en ChatGPT.

Estado de verificación:

- aplicación manual: confirmada por el usuario;
- validación directa desde ChatGPT: no disponible;
- frontend autenticado: preparado para leer `library_items`;
- modo sin sesión: utiliza datos demo separados;
- RLS: definido en la migración y debe permanecer habilitado.

## Autenticación

Kanso incorpora acceso passwordless mediante Magic Link de Supabase.

Para probarlo en un entorno real se deben autorizar en Supabase Auth las Redirect URLs correspondientes al dominio de desarrollo y al dominio de producción.

## CI

GitHub Actions ejecuta:

1. Node.js 22;
2. `npm ci`;
3. `npm run typecheck`;
4. `npm run build`.

La activación del dashboard conectado a Supabase fue validada exitosamente por CI en el run `31897892465`.

## Auditoría

Toda etapa relevante debe quedar documentada en `docs/auditoria/` con:

- fecha y zona horaria;
- objetivo;
- estado inicial;
- acciones realizadas;
- archivos modificados;
- decisiones técnicas;
- validaciones;
- errores y correcciones;
- pendientes;
- resultado final.

Registros actuales:

- `docs/auditoria/2026-08-15-1253-integracion-supabase.md`
- `docs/auditoria/2026-08-15-1315-activacion-biblioteca-supabase.md`

## Estado actual

- ✅ React + Vite + TypeScript
- ✅ Supabase JS integrado
- ✅ Magic Link implementado
- ✅ esquema inicial versionado
- ✅ migración informada como aplicada manualmente
- ✅ dashboard preparado para biblioteca real autenticada
- ✅ modo demo separado de datos reales
- ✅ `package-lock.json` versionado
- ✅ CI con typecheck y build
- ⏳ prueba funcional de Magic Link contra el proyecto real
- ⏳ prueba real de lectura/escritura en `library_items` y `watch_events`
- ⏳ TMDB
- ⏳ AniList
