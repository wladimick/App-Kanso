# Auditoría · Integración segura de TMDB

**Fecha de inicio:** 2026-08-15 13:42 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de ejecución:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Integrar TMDB como catálogo de películas y series sin exponer credenciales en el bundle React/Vite, permitir búsqueda autenticada y agregar resultados a la biblioteca persistida de Kanso.

## 2. Credenciales recibidas

El usuario entregó:

- API Read Access Token de TMDB;
- API Key v3 de TMDB.

**Medida de seguridad:** los valores reales no se copian a este documento, a GitHub ni a ningún archivo `VITE_*`.

TMDB permite autenticar llamadas de aplicación mediante el API Read Access Token como `Authorization: Bearer <token>`. Para el flujo actual no se requiere además la API Key v3.

## 3. Hallazgo de arquitectura

El proyecto tenía preparada la variable:

`VITE_TMDB_ACCESS_TOKEN`

Esto no es apropiado para una credencial que se desea mantener privada, porque las variables `VITE_*` se incorporan al JavaScript que recibe el navegador.

### Decisión

Se reemplaza el diseño directo:

```text
React → TMDB
```

por:

```text
React/Vite
   ↓ sesión Supabase
Supabase Edge Function · tmdb-search
   ↓ TMDB_READ_ACCESS_TOKEN
TMDB API
```

Con esta decisión **Vercel no es requisito** para proteger el token de TMDB.

## 4. Referencias técnicas revisadas

Se verificó documentación primaria actual antes de implementar.

### TMDB

- El API Read Access Token se envía como Bearer token en `Authorization`.
- El mismo mecanismo puede utilizarse con endpoints v3 y v4.
- Se utilizaron los endpoints v3 de búsqueda de películas y TV.
- TMDB exige atribución para uso de datos/imágenes; antes de producción pública se debe incorporar además uno de sus logos aprobados en una sección de créditos/acerca de.

### Supabase

- Edge Functions pueden almacenar secretos de proyecto y leerlos con `Deno.env.get(...)`.
- Los secretos no deben guardarse en Git.
- Las funciones requieren JWT válido por defecto (`verify_jwt = true`).
- `supabase.functions.invoke(...)` es el mecanismo cliente para llamar una Edge Function.
- Para llamadas browser se debe resolver CORS; con `supabase-js >= 2.95` se recomienda importar `corsHeaders` desde el SDK.

## 5. Acciones realizadas

### 5.1 Eliminación del token TMDB del entorno Vite

Se modificó `.env.example`:

- se eliminó `VITE_TMDB_ACCESS_TOKEN`;
- se mantuvieron únicamente las variables públicas de Supabase;
- se documentó que TMDB debe configurarse como secreto de Edge Functions.

Se modificó también `src/vite-env.d.ts` para eliminar `VITE_TMDB_ACCESS_TOKEN` del contrato TypeScript del frontend.

### 5.2 Secreto de servidor documentado

Se creó:

`supabase/functions/.env.example`

Variable documentada:

```text
TMDB_READ_ACCESS_TOKEN=
```

El valor real no fue escrito.

### 5.3 Configuración de función

Se creó:

`supabase/config.toml`

Configuración:

```toml
[functions.tmdb-search]
verify_jwt = true
```

La búsqueda queda reservada a usuarios con sesión Supabase válida.

### 5.4 Edge Function `tmdb-search`

Se creó:

`supabase/functions/tmdb-search/index.ts`

Responsabilidades:

- manejar CORS;
- aceptar únicamente POST;
- validar longitud de búsqueda;
- leer `TMDB_READ_ACCESS_TOKEN` desde secretos del runtime;
- consultar en paralelo `/3/search/movie` y `/3/search/tv`;
- usar `language=es-CL`;
- excluir contenido adulto;
- normalizar películas y series a un contrato común;
- generar URLs de poster;
- ordenar resultados por popularidad;
- devolver hasta 20 resultados;
- no registrar ni devolver el token.

### 5.5 Servicio cliente TMDB

Se creó:

`src/services/tmdb.ts`

El frontend llama:

```text
supabase.functions.invoke('tmdb-search')
```

No realiza llamadas directas a `api.themoviedb.org` y no conoce el Bearer token.

### 5.6 Hook de búsqueda

Se creó:

`src/hooks/useTmdbSearch.ts`

Incluye:

- resultados;
- loading;
- error;
- última búsqueda;
- bloqueo explícito si no existe sesión autenticada.

### 5.7 Alta segura en biblioteca

Se modificó:

`src/services/library.ts`

Se reemplazó el enfoque de upsert que podía resetear progreso al volver a agregar un título por un flujo:

1. buscar coincidencia existente por usuario + fuente + ID externo + tipo;
2. devolver la fila existente si ya está guardada;
3. insertar solamente si no existe;
4. conservar la restricción única como protección contra concurrencia;
5. ante `23505`, recuperar la fila existente.

Esto evita perder episodio, estado o progreso por una segunda acción `Agregar a Kanso`.

Se modificó:

`src/hooks/useLibrary.ts`

Se agregó `addItem()` para actualizar el estado React después de persistir un título.

### 5.8 UI de descubrimiento

Se creó:

`src/components/DiscoverPanel.tsx`

Funcionalidad:

- buscador de películas y series;
- resultados con poster, año, rating, título original y sinopsis;
- botón `+ Agregar a Kanso`;
- detección de títulos ya existentes;
- estado de agregando;
- errores visibles;
- estado sin resultados;
- búsqueda habilitada únicamente con sesión;
- aviso textual obligatorio de atribución TMDB.

Se creó:

`src/discover.css`

Se modificó `src/App.tsx` para:

- integrar `DiscoverPanel`;
- calcular claves de títulos existentes;
- guardar resultados TMDB como `source=tmdb`;
- guardar películas como `movie` y TV como `series`;
- iniciar altas nuevas con estado `planned`;
- cambiar el buscador superior para indicar que filtra la biblioteca propia.

Se modificó `src/main.tsx` para cargar los estilos de descubrimiento.

## 6. Archivos creados

- `supabase/functions/tmdb-search/index.ts`
- `supabase/config.toml`
- `supabase/functions/.env.example`
- `src/services/tmdb.ts`
- `src/hooks/useTmdbSearch.ts`
- `src/components/DiscoverPanel.tsx`
- `src/discover.css`
- `docs/auditoria/2026-08-15-1342-integracion-tmdb-segura.md`

## 7. Archivos modificados

- `.env.example`
- `src/vite-env.d.ts`
- `src/services/library.ts`
- `src/hooks/useLibrary.ts`
- `src/App.tsx`
- `src/main.tsx`
- `README.md`

## 8. Acciones externas no realizadas

Por diseño y por separación de cuentas, ChatGPT no tiene acceso al proyecto Supabase Kanso donde el usuario aplicó manualmente la migración.

Por tanto **no se realizaron** desde esta sesión:

- creación del secreto real `TMDB_READ_ACCESS_TOKEN`;
- despliegue de `tmdb-search`;
- invocación end-to-end contra el TMDB real;
- prueba real de INSERT posterior a una búsqueda;
- Security/Performance Advisors en el Supabase Kanso.

No se tocó WebOps TIBOX.

## 9. Pasos manuales requeridos en Supabase Kanso

### Secreto

Crear en **Edge Functions → Secrets**:

```text
TMDB_READ_ACCESS_TOKEN=<API Read Access Token>
```

Alternativa CLI:

```bash
supabase secrets set TMDB_READ_ACCESS_TOKEN="<TOKEN>"
```

### Deploy

```bash
supabase link --project-ref gfqudpbtxhquwsrtahnm
supabase functions deploy tmdb-search
```

La función debe conservar `verify_jwt = true`.

## 10. Validación de CI

Se ejecutó GitHub Actions sobre el último cambio de código del bloque.

Run de push:

`31899335495` — Kanso CI run #64.

Resultado:

- Setup Node.js 22: ✅
- `npm ci`: ✅
- `npm run typecheck`: ✅
- `npm run build`: ✅
- Job final: **SUCCESS**.

El workflow valida el frontend TypeScript/Vite. La Edge Function queda versionada pero su ejecución real solo puede verificarse después del deploy en el Supabase Kanso correcto.

## 11. Pendientes

1. Crear el secreto `TMDB_READ_ACCESS_TOKEN` en el Supabase de Kanso.
2. Desplegar `tmdb-search`.
3. Probar Magic Link / sesión real.
4. Buscar un título desde Kanso.
5. Confirmar respuesta de `tmdb-search` y posters.
6. Agregar un título y confirmar fila en `library_items`.
7. Intentar agregarlo nuevamente y confirmar que no se resetea progreso.
8. Incorporar un logo TMDB aprobado en `Acerca de/Créditos` antes de publicación pública.
9. Ejecutar Security y Performance Advisors en el proyecto correcto.
10. Integrar AniList en un bloque posterior.

## 12. Estado del bloque

**Integración TMDB implementada y validada a nivel de frontend/CI con credenciales aisladas del navegador. El API Read Access Token y la API Key recibidos no fueron escritos en el repositorio. Para activar datos reales falta configurar el secreto y desplegar la Edge Function en el Supabase Kanso correcto, seguido de validación end-to-end.**
