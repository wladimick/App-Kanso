# Auditoría · Proyecto Vercel creado

**Fecha:** 2026-08-15 17:22 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar la creación del proyecto de despliegue de Kanso en Vercel y verificar qué parte puede administrarse desde la conexión Vercel disponible en esta sesión.

## 2. Acción externa informada por el usuario

El usuario confirmó haber creado un proyecto Vercel para Kanso en su nueva cuenta, con nombre visible `app-kanso`.

URL de gestión informada por el usuario:

`https://vercel.com/wladimick1/app-kanso/...`

## 3. Verificación desde la conexión disponible

La conexión Vercel disponible para ChatGPT en esta sesión corresponde al equipo:

- nombre: `Wladimick's projects`;
- slug: `tibox-app`;
- team id: `team_zu4cdfMZcq7xk6sv00I3qjb7`.

Al listar proyectos en ese equipo, no aparece `app-kanso`.

### Conclusión

El proyecto Vercel de Kanso existe según confirmación del usuario, pero **la cuenta/equipo `wladimick1` no está conectada a esta sesión de ChatGPT**. Por seguridad no se creó otro proyecto ni se modificó ninguna cuenta diferente.

## 4. Estado actual esperado de despliegue

Arquitectura objetivo:

```text
GitHub · wladimick/App-Kanso
          ↓
Vercel · app-kanso
          ↓
React/Vite
          ↓
Supabase Kanso
   ├── Auth
   ├── library_items
   ├── watch_events
   └── Edge Function tmdb-search
          ↓
TMDB
```

## 5. Variables públicas requeridas en Vercel

El frontend necesita únicamente:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

No se debe crear en Vercel ninguna variable `VITE_TMDB_*`, ni copiar el `TMDB_READ_ACCESS_TOKEN`, porque TMDB queda encapsulado en Supabase Edge Functions.

## 6. Pendientes

1. Conectar/importar `wladimick/App-Kanso` en el proyecto Vercel `app-kanso` si aún no está vinculado.
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en Vercel.
3. Confirmar framework Vite y build `npm run build` con output `dist` si Vercel no lo detecta automáticamente.
4. Desplegar una Preview de `agent/initial-kanso-app` o producción cuando corresponda.
5. Obtener la URL pública de Vercel.
6. Agregar esa URL en Supabase Auth → Redirect URLs para Magic Link.
7. Probar login, búsqueda TMDB y alta a `library_items` desde el deployment real.
8. Conectar la cuenta/equipo Vercel `wladimick1` a ChatGPT si se desea administración directa desde esta sesión.

## 7. Estado

**Proyecto Vercel creado por el usuario. Pendiente conectar/autorizar la cuenta correcta en ChatGPT o completar la configuración desde el Dashboard para poder validar y administrar el deployment sin tocar otra cuenta.**
