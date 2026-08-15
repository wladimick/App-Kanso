# Auditoría · Adaptación al template actual de Supabase Edge Functions

**Fecha:** 2026-08-15 14:06 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable:** ChatGPT · GPT-5.6 Sol

## 1. Contexto

El usuario abrió el editor actual de **Supabase Edge Functions → Create new edge function** en el proyecto Kanso y compartió una captura donde el template por defecto utiliza:

- `jsr:@supabase/functions-js/edge-runtime.d.ts`;
- `jsr:@supabase/server@^1`;
- `withSupabase(...)`;
- un modo de autenticación de ejemplo que acepta `publishable` y `secret`.

También se compartió una captura de **Account → Access Tokens**. Esa pantalla no corresponde a la configuración requerida por Kanso; los Access Tokens de cuenta se usan para autenticación de herramientas/API de administración y no son necesarios para desplegar `tmdb-search` desde el editor del Dashboard.

## 2. Verificación documental

Se revisó documentación actual de Supabase mediante su buscador oficial.

Hallazgos relevantes:

- para Edge Functions llamadas por usuarios autenticados, Supabase recomienda `@supabase/server` con `withSupabase({ auth: 'user' }, ...)`;
- las llamadas desde `supabase.functions.invoke(...)` envían el JWT de sesión del usuario en `Authorization`;
- para este caso debe mantenerse `verify_jwt = true`;
- las llamadas browser deben responder correctamente al preflight `OPTIONS` y devolver encabezados CORS;
- `@supabase/supabase-js` 2.95+ expone `corsHeaders` desde `/cors`.

## 3. Acción realizada

Se actualizó:

`supabase/functions/tmdb-search/index.ts`

Cambios:

1. se agregó el type definition oficial del Edge Runtime;
2. se migró la autenticación interna a `@supabase/server`;
3. la función quedó restringida a `auth: 'user'`;
4. se preservó `verify_jwt = true` en `supabase/config.toml`;
5. `OPTIONS` se resuelve antes del wrapper autenticado para permitir CORS preflight;
6. el resto del comportamiento TMDB se conserva: secreto por `Deno.env`, búsqueda de películas/TV, normalización, `es-CL`, exclusión de contenido adulto y respuestas sin exposición de credenciales.

Commit principal:

`6f8ba2e5f1ee256db78376bcd0f74524e5c7fd5f` — `Align TMDB edge function with current Supabase auth template`.

## 4. Instrucción de despliegue en Dashboard

En la pantalla **Create new edge function**:

1. reemplazar completamente el código template de `index.ts` por el archivo versionado `supabase/functions/tmdb-search/index.ts`;
2. cambiar **Function name** de `quick-worker` a `tmdb-search`;
3. pulsar **Deploy function**;
4. no crear ni utilizar un Account Access Token para este procedimiento;
5. el secreto `TMDB_READ_ACCESS_TOKEN` ya fue informado como configurado previamente por el usuario.

## 5. Seguridad

- el token TMDB no se replica en GitHub ni en documentación;
- la función no acepta el modo `secret` del template por defecto;
- la función solo está diseñada para usuarios Supabase autenticados;
- no se modificó el proyecto WebOps TIBOX.

## 6. Pendiente

- desplegar `tmdb-search` desde el Dashboard del proyecto Kanso;
- validar el type-check del editor de Supabase;
- probar una invocación autenticada;
- probar búsqueda real TMDB y alta a `library_items`.
