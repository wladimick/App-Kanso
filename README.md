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
- Supabase para autenticación, progreso, listas, colecciones y funciones de servidor
- TMDB para películas y series
- Vercel para hosting del frontend
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

## Variables de entorno del frontend

Kanso expone al navegador únicamente variables públicas de Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

No guardar claves `service_role`, `sb_secret_...`, tokens TMDB ni otros secretos de backend en variables `VITE_`, porque Vite las incorpora al JavaScript del navegador.

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

## TMDB

La credencial de TMDB **no vive en React**. Kanso utiliza esta ruta:

```text
React/Vite
   ↓ usuario autenticado
Supabase Edge Function · tmdb-search
   ↓ Bearer token privado
TMDB API
```

Archivos:

- `supabase/functions/tmdb-search/index.ts`
- `supabase/config.toml`
- `supabase/functions/.env.example`
- `src/services/tmdb.ts`
- `src/hooks/useTmdbSearch.ts`
- `src/components/DiscoverPanel.tsx`

### Secreto

En el proyecto Supabase de Kanso se utiliza:

```text
TMDB_READ_ACCESS_TOKEN
```

El usuario confirmó el 15 de agosto de 2026 que este secreto fue creado manualmente en el proyecto correcto de Kanso. El valor real nunca se guarda en GitHub ni en la documentación.

### Edge Function

El usuario confirmó el 15 de agosto de 2026 que `tmdb-search` fue desplegada manualmente desde Supabase Dashboard utilizando el código versionado en el repositorio.

La versión actual usa `@supabase/server` con `auth: 'user'` y mantiene `verify_jwt = true`, por lo que el buscador está diseñado para utilizarse únicamente con una sesión Supabase autenticada.

Estado de validación:

- deploy manual: confirmado por el usuario;
- código fuente: versionado;
- CI del código adaptado al runtime actual: exitoso;
- invocación end-to-end contra el proyecto real: pendiente por falta de acceso de esta sesión a la cuenta Supabase Kanso.

El API Key v3 de TMDB no es necesario en el flujo actual: se utiliza el API Read Access Token como Bearer token.

## Vercel

El usuario confirmó el 15 de agosto de 2026 la creación del proyecto `app-kanso` en una nueva cuenta Vercel (`wladimick1`).

La conexión Vercel disponible actualmente en ChatGPT corresponde a otro equipo y no ve ese proyecto. Por seguridad no se creó otro proyecto ni se modificó una cuenta distinta.

Variables requeridas en Vercel:

```env
VITE_SUPABASE_URL=https://gfqudpbtxhquwsrtahnm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key de Kanso>
```

No configurar `TMDB_READ_ACCESS_TOKEN` en Vercel: ese secreto permanece únicamente en Supabase Edge Functions.

Una vez obtenida la URL pública de Vercel, debe agregarse a Supabase Auth como Redirect URL para probar Magic Link desde el deployment real.

## Autenticación

Kanso incorpora acceso passwordless mediante Magic Link de Supabase.

Para probarlo en un entorno real se deben autorizar en Supabase Auth las Redirect URLs correspondientes al dominio de desarrollo y al dominio de producción.

## CI

GitHub Actions ejecuta:

1. Node.js 22;
2. `npm ci`;
3. `npm run typecheck`;
4. `npm run build`.

Validación del código actual de Edge Function/frontend:

- run `31900240625` / Kanso CI #83;
- `npm ci`: OK;
- typecheck: OK;
- build: OK.

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
- `docs/auditoria/2026-08-15-1342-integracion-tmdb-segura.md`
- `docs/auditoria/2026-08-15-1350-cierre-tmdb-ci.md`
- `docs/auditoria/2026-08-15-1354-secreto-tmdb-configurado.md`
- `docs/auditoria/2026-08-15-1408-deploy-tmdb-search.md`
- `docs/auditoria/2026-08-15-1722-vercel-proyecto-creado.md`

## Estado actual

- ✅ React + Vite + TypeScript
- ✅ Supabase JS integrado
- ✅ Magic Link implementado
- ✅ esquema inicial versionado
- ✅ migración informada como aplicada manualmente
- ✅ dashboard preparado para biblioteca real autenticada
- ✅ modo demo separado de datos reales
- ✅ proxy TMDB versionado como Supabase Edge Function
- ✅ buscador TMDB y acción `Agregar a Kanso` implementados en frontend
- ✅ credenciales TMDB fuera de variables `VITE_*`
- ✅ secreto `TMDB_READ_ACCESS_TOKEN` informado como creado en Supabase Kanso
- ✅ `tmdb-search` informada como desplegada manualmente
- ✅ proyecto Vercel `app-kanso` informado como creado por el usuario
- ✅ `package-lock.json` versionado
- ✅ CI con typecheck y build
- ⏳ conectar/configurar el deployment Vercel `app-kanso`
- ⏳ agregar variables públicas de Supabase en Vercel
- ⏳ obtener URL pública y autorizarla en Supabase Auth
- ⏳ prueba funcional de Magic Link contra el deployment real
- ⏳ prueba end-to-end de búsqueda TMDB y alta en `library_items`
- ⏳ logo TMDB aprobado en créditos antes de publicación pública
- ⏳ AniList
