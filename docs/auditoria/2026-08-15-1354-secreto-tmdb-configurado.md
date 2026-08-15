# Auditoría · Secreto TMDB configurado en Supabase

**Fecha:** 2026-08-15 13:54 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar el cambio de estado externo informado por el usuario para la integración TMDB de Kanso.

## 2. Acción externa informada por el usuario

El usuario confirmó haber creado manualmente en el proyecto Supabase correcto de Kanso el secreto:

`TMDB_READ_ACCESS_TOKEN`

### Clasificación de auditoría

- nombre del secreto: confirmado por el usuario;
- valor del secreto: no se registra ni se replica en GitHub/documentación;
- proyecto objetivo: Kanso (`gfqudpbtxhquwsrtahnm`);
- verificación directa desde ChatGPT: no disponible porque la cuenta Supabase de Kanso no está conectada a esta sesión;
- WebOps TIBOX: no modificado.

## 3. Estado técnico actual

El código de la Edge Function ya está versionado en:

`supabase/functions/tmdb-search/index.ts`

La función:

- lee `TMDB_READ_ACCESS_TOKEN` desde `Deno.env`;
- no expone el token al frontend;
- usa CORS compatible con llamadas browser mediante `@supabase/supabase-js/cors`;
- consulta TMDB para películas y series;
- normaliza resultados para Kanso;
- está configurada con `verify_jwt = true` en `supabase/config.toml`.

## 4. Referencias técnicas verificadas

Se revisó la documentación actual de Supabase antes de continuar:

- las Edge Functions pueden desplegarse desde Dashboard o CLI;
- desde Dashboard se utiliza `Deploy function` / `Deploy updates`;
- desde CLI se puede ejecutar `supabase functions deploy tmdb-search`;
- las funciones desplegadas quedan disponibles bajo `https://<project-ref>.supabase.co/functions/v1/<function-name>`;
- para CORS, `@supabase/supabase-js` v2.95+ permite importar `corsHeaders` desde `/cors`.

## 5. Pendiente inmediato

Desplegar `tmdb-search` en el Supabase de Kanso.

### Opción Dashboard

1. Ir a **Edge Functions** en el proyecto Kanso.
2. Crear/desplegar una función llamada exactamente `tmdb-search`.
3. Usar como código fuente el archivo versionado `supabase/functions/tmdb-search/index.ts`.
4. Mantener verificación JWT habilitada.
5. Pulsar **Deploy function**.

### Opción CLI

```bash
supabase login
supabase link --project-ref gfqudpbtxhquwsrtahnm
supabase functions deploy tmdb-search --use-api
```

## 6. Validación posterior requerida

Después del deploy se debe comprobar:

1. existencia de `https://gfqudpbtxhquwsrtahnm.supabase.co/functions/v1/tmdb-search`;
2. rechazo de llamadas sin sesión válida;
3. búsqueda autenticada desde Kanso;
4. respuesta real de TMDB;
5. alta de un resultado en `library_items`;
6. no duplicación ni reseteo de progreso al volver a agregar el mismo título.

## 7. Estado

**Secreto TMDB informado como configurado. La integración queda a un paso de activarse end-to-end: desplegar `tmdb-search` en el Supabase correcto de Kanso.**
