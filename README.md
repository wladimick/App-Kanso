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

### Secreto necesario

En el proyecto Supabase de Kanso se utiliza:

```text
TMDB_READ_ACCESS_TOKEN
```

El usuario confirmó el 15 de agosto de 2026 que este secreto fue creado manualmente en el proyecto correcto de Kanso. El valor real nunca se guarda en GitHub ni en la documentación.

### Despliegue de la función

La función aún debe desplegarse en el proyecto Kanso. Desde CLI:

```bash
supabase login
supabase link --project-ref gfqudpbtxhquwsrtahnm
supabase functions deploy tmdb-search --use-api
```

También puede desplegarse desde **Supabase Dashboard → Edge Functions**, creando una función llamada exactamente `tmdb-search` y usando el código versionado en `supabase/functions/tmdb-search/index.ts`.

`tmdb-search` mantiene `verify_jwt = true`, por lo que el buscador se utiliza solamente con una sesión Supabase autenticada.

El API Key v3 de TMDB no es necesario en el flujo actual: se utiliza el API Read Access Token como Bearer token.

## Autenticación

Kanso incorpora acceso passwordless mediante Magic Link de Supabase.

Para probarlo en un entorno real se deben autorizar en Supabase Auth las Redirect URLs correspondientes al dominio de desarrollo y al dominio de producción.

## CI

GitHub Actions ejecuta:

1. Node.js 22;
2. `npm ci`;
3. `npm run typecheck`;
4. `npm run build`.

Última validación de código del bloque TMDB:

- run `31899408056` / Kanso CI #70;
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
- ✅ `package-lock.json` versionado
- ✅ CI con typecheck y build
- ⏳ desplegar `tmdb-search` en el Supabase real de Kanso
- ⏳ prueba funcional de Magic Link contra el proyecto real
- ⏳ prueba end-to-end de búsqueda TMDB y alta en `library_items`
- ⏳ logo TMDB aprobado en créditos antes de publicación pública
- ⏳ AniList
