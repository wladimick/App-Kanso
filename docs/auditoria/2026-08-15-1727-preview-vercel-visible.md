# Auditoría · Preview Vercel visible

**Fecha:** 2026-08-15 17:27 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar el primer preview visible de Kanso en Vercel y diagnosticar el estado mostrado por la aplicación.

## 2. Evidencia informada por el usuario

El usuario compartió una captura donde Kanso carga correctamente desde un preview Vercel de la rama de trabajo.

URL visible en la captura:

`https://app-kanso-git-agent-initial-kanso-app-wladimick1.vercel.app`

La interfaz React/Vite renderiza correctamente el dashboard, datos demo, navegación y el bloque de descubrimiento TMDB.

## 3. Hallazgo

En la interfaz se muestra el estado:

`Supabase pendiente`

Se revisó `src/lib/supabase.ts` y se confirmó que `isSupabaseConfigured` solo es verdadero cuando existen ambas variables de build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Se revisó `src/components/AuthPanel.tsx` y se confirmó que el texto `Supabase pendiente` aparece cuando el cliente Supabase no está configurado.

### Diagnóstico

El preview actual fue construido sin una o ambas variables Vite disponibles para ese entorno, o bien las variables fueron creadas en Vercel después de construir el deployment y aún no se ha hecho redeploy.

## 4. Magic Link

`AuthPanel` utiliza:

`emailRedirectTo: window.location.origin`

Por lo tanto, para este preview el redirect esperado será:

`https://app-kanso-git-agent-initial-kanso-app-wladimick1.vercel.app`

Supabase Auth debe permitir esa URL o un patrón de previews compatible.

Según la documentación actual de Supabase, para previews de Vercel se puede agregar un redirect wildcard del tipo:

`https://*-<team-or-account-slug>.vercel.app/**`

Para la cuenta observada:

`https://*-wladimick1.vercel.app/**`

Para producción se recomienda posteriormente usar la URL exacta estable como Site URL y redirect exacto.

## 5. Acciones pendientes

1. En Vercel `app-kanso` agregar `VITE_SUPABASE_URL` al entorno Preview.
2. Agregar `VITE_SUPABASE_PUBLISHABLE_KEY` al entorno Preview.
3. Idealmente habilitarlas también para Production.
4. Redeploy del preview para que Vite incorpore las variables en el bundle.
5. Confirmar que `Supabase pendiente` desaparece y aparece el formulario Magic Link.
6. En Supabase Auth → URL Configuration agregar `https://*-wladimick1.vercel.app/**` para previews.
7. Cuando exista una URL de producción estable, configurarla como Site URL y agregarla como redirect exacto.
8. Probar Magic Link end-to-end.
9. Probar `tmdb-search` autenticado.
10. Agregar un resultado a `library_items` y verificar persistencia.

## 6. Seguridad

No se requiere ni debe agregarse `TMDB_READ_ACCESS_TOKEN` en Vercel. Ese secreto permanece únicamente en Supabase Edge Functions.

La publishable key de Supabase sí está diseñada para uso cliente; la protección de datos se mantiene mediante Auth y RLS.

## 7. Estado

**Preview Vercel: visible y funcional a nivel de frontend. Integración Supabase en ese deployment: pendiente de inyección de variables Vite/redeploy.**
