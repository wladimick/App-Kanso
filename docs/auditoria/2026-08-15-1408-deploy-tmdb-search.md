# Auditoría · Deploy de `tmdb-search`

**Fecha:** 2026-08-15 14:08 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar el despliegue manual de la Edge Function `tmdb-search` en el proyecto Supabase correcto de Kanso y dejar evidencia del estado de validación disponible desde esta sesión.

## 2. Acción externa informada por el usuario

El usuario confirmó haber desplegado manualmente desde Supabase Dashboard una Edge Function llamada exactamente:

`tmdb-search`

El despliegue se realizó después de actualizar el código versionado a la API actual de Supabase Edge Functions basada en `@supabase/server`.

### Clasificación

- deploy de la función: confirmado por el usuario;
- proyecto objetivo: Kanso (`gfqudpbtxhquwsrtahnm`);
- secreto `TMDB_READ_ACCESS_TOKEN`: confirmado previamente por el usuario;
- valor del secreto: no almacenado en GitHub ni documentación;
- WebOps TIBOX: no modificado.

## 3. Código desplegado

Fuente versionada:

`supabase/functions/tmdb-search/index.ts`

Características relevantes:

- usa `@supabase/server`;
- exige `auth: 'user'`;
- mantiene `verify_jwt = true` en `supabase/config.toml`;
- maneja CORS para invocación desde navegador;
- obtiene `TMDB_READ_ACCESS_TOKEN` desde variables seguras del runtime;
- consulta películas y series de TMDB;
- normaliza resultados para Kanso;
- no expone ni registra el token.

## 4. Validación de código

La revisión que contiene la adaptación al runtime actual quedó validada por GitHub Actions.

Workflow:

- nombre: `Kanso CI`;
- run: `31900240625`;
- run number: `#83`;
- resultado: **SUCCESS**.

Pasos exitosos:

- Checkout: ✅
- Node.js 22: ✅
- instalación de dependencias: ✅
- TypeScript / typecheck: ✅
- build Vite: ✅
- cierre del job: ✅

## 5. Intento de verificación externa

Se intentó comprobar desde el entorno de ChatGPT el endpoint esperado:

`https://gfqudpbtxhquwsrtahnm.supabase.co/functions/v1/tmdb-search`

La verificación no pudo completarse porque el entorno de ejecución de esta sesión no pudo resolver por DNS el dominio del proyecto Supabase.

### Interpretación

Este resultado **no se clasifica como error de la Edge Function**. Es una limitación de conectividad/verificación de esta sesión.

Además, la conexión Supabase disponible para ChatGPT pertenece a otra cuenta, por lo que no se usó para inspeccionar o modificar Kanso.

## 6. Estado actual

Completado:

- esquema inicial aplicado manualmente;
- secreto TMDB creado manualmente;
- Edge Function `tmdb-search` desplegada manualmente;
- código fuente versionado;
- CI del código exitoso.

Pendiente de validación end-to-end:

1. tener una sesión real de Supabase Auth en Kanso;
2. invocar `tmdb-search` desde el frontend autenticado;
3. buscar un título real, por ejemplo `Avengers`;
4. confirmar resultados y posters de TMDB;
5. agregar un título a `library_items`;
6. confirmar RLS y persistencia;
7. volver a agregar el mismo título y confirmar que no se duplica ni resetea progreso.

## 7. Siguiente paso recomendado

Configurar/probar el flujo de autenticación Magic Link y una URL real de ejecución de Kanso. Con una sesión autenticada podremos ejecutar la primera prueba completa:

`Kanso → tmdb-search → TMDB → Agregar a Kanso → library_items`.
