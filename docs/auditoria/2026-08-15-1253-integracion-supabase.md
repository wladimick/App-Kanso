# Auditoría · Integración inicial Supabase

**Fecha:** 2026-08-15 12:53 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de ejecución:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Preparar Kanso para persistir biblioteca, progreso y colecciones en Supabase, incorporar autenticación passwordless y dejar una migración segura y versionada antes de conectar TMDB/AniList.

## 2. Estado inicial

- MVP React + Vite + TypeScript con datos de demostración.
- Variables de Supabase documentadas en `.env.example`.
- Sin cliente Supabase instalado.
- Sin esquema SQL versionado.
- Sin autenticación.
- Sin protocolo de auditoría en `docs/`.

## 3. Verificación previa de Supabase

Se consultó el conector Supabase disponible en la sesión.

Resultado:

- El conector tiene acceso al proyecto `WebOps Tibox` (`kgqnczgtmyjaalmbmrbs`).
- El proyecto Kanso indicado por su URL corresponde al ref `gfqudpbtxhquwsrtahnm`.
- Al intentar consultar `gfqudpbtxhquwsrtahnm`, Supabase respondió que la conexión actual no tiene permisos para esa acción.

**Decisión:** no ejecutar DDL ni consultas sobre otro proyecto. La migración queda preparada en GitHub pero no se marca como aplicada.

## 4. Referencias técnicas verificadas

Se revisó documentación actual de Supabase antes de implementar:

- React + Vite usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Las claves `sb_publishable_...` están diseñadas para frontend y deben combinarse con RLS.
- `sb_secret_...` / `service_role` no deben exponerse en cliente.
- Magic Link se implementa con `signInWithOtp` y requiere Redirect URLs autorizadas.
- Supabase JS retiró soporte para Node.js 20 en versiones actuales; el proyecto se fijó en Node.js 22+.
- Versión estable verificada de `@supabase/supabase-js`: `2.111.0`.

Fuentes oficiales/primarias consultadas:

- https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/changelog?types=deprecation
- https://www.npmjs.com/package/@supabase/supabase-js

## 5. Acciones realizadas

### Runtime y dependencias

- `package.json` actualizado a versión de app `0.2.0`.
- Se definió Node.js `>=22.0.0`.
- Se agregó `@supabase/supabase-js` fijado exactamente a `2.111.0`.
- Se agregó script `npm run typecheck`.
- Se tiparon variables Vite mediante `src/vite-env.d.ts`.

### Cliente Supabase

Se creó `src/lib/supabase.ts`:

- Inicializa un único cliente browser.
- Usa únicamente URL + publishable key.
- Persiste sesión y refresca tokens.
- Detecta sesiones después de redirects.
- No rompe el build si las variables no están definidas; expone estado `isSupabaseConfigured`.

### Contrato TypeScript de base de datos

Se creó `src/lib/database.types.ts` con tipos iniciales para:

- `library_items`
- `collections`
- `collection_items`
- `watch_events`

Los tipos serán regenerados desde Supabase cuando el proyecto Kanso quede accesible mediante el conector.

### Servicio de biblioteca

Se creó `src/services/library.ts` con operaciones iniciales:

- listar biblioteca del usuario;
- upsert por proveedor + ID externo;
- actualizar progreso de temporada/episodio;
- registrar eventos de avance/finalización.

### Autenticación

Se crearon:

- `src/hooks/useAuth.ts`
- `src/components/AuthPanel.tsx`
- `src/components/AuthPanel.css`

Funcionalidad:

- recuperación de sesión browser;
- escucha de cambios de autenticación;
- acceso por Magic Link;
- cierre de sesión;
- estado visual si Supabase aún no está configurado en runtime.

`src/App.tsx` fue actualizado para incorporar el panel de autenticación sin reemplazar todavía los datos demo por datos remotos.

### Esquema y seguridad

Se creó:

`supabase/migrations/20260815125300_initial_kanso_schema.sql`

Tablas:

1. `library_items`
2. `collections`
3. `collection_items`
4. `watch_events`

Controles incluidos:

- claves foráneas a `auth.users`;
- borrado en cascada de datos pertenecientes a usuarios eliminados;
- restricciones de tipos y estados;
- puntuación 0–10;
- claves únicas para impedir duplicados de catálogo;
- claves foráneas compuestas para impedir cruces entre usuarios en colecciones/eventos;
- índices por usuario, estado, tipo y fecha;
- RLS habilitado en todas las tablas;
- permisos revocados al rol `anon`;
- permisos CRUD otorgados a `authenticated` y restringidos mediante RLS;
- políticas `SELECT`, `INSERT`, `UPDATE` y `DELETE` basadas en `(select auth.uid()) = user_id`;
- políticas UPDATE incluyen `USING` y `WITH CHECK`.

## 6. Documentación

- Se creó `docs/auditoria/README.md` como protocolo obligatorio de auditoría futura.
- Se actualizó `docs/architecture.md` con arquitectura, modelo de datos, autenticación, seguridad y estado real por fases.

## 7. CI

Se creó `.github/workflows/ci.yml` para:

1. usar Node.js 22;
2. instalar dependencias;
3. ejecutar TypeScript (`npm run typecheck`);
4. ejecutar build (`npm run build`).

Al momento de crear este registro, el primer workflow `Kanso CI` fue aceptado por GitHub Actions y quedó inicialmente en estado `queued` bajo el run `31897031995`.

## 8. Limitaciones / no ejecutado

### Migración Supabase

**No aplicada.** El proyecto `gfqudpbtxhquwsrtahnm` no está autorizado en el conector Supabase disponible. No se tocó `WebOps Tibox`.

### Advisors Supabase

**No ejecutados** sobre Kanso por la misma falta de permisos. Deben ejecutarse después de aplicar la migración.

### Lockfile npm

No se generó `package-lock.json` desde el entorno de ejecución porque la salida de red directa hacia npm no respondió. La dependencia Supabase quedó fijada a versión exacta en `package.json`; el lockfile sigue pendiente y debe generarse/confirmarse en un entorno con acceso npm antes de cerrar la etapa.

### Datos demo

El dashboard sigue usando datos de demostración de forma intencional. La capa Supabase ya existe, pero no se cambia la fuente del UI hasta que la migración haya sido aplicada y validada.

## 9. Archivos creados

- `.github/workflows/ci.yml`
- `src/vite-env.d.ts`
- `src/lib/database.types.ts`
- `src/lib/supabase.ts`
- `src/services/library.ts`
- `src/hooks/useAuth.ts`
- `src/components/AuthPanel.tsx`
- `src/components/AuthPanel.css`
- `supabase/migrations/20260815125300_initial_kanso_schema.sql`
- `docs/auditoria/README.md`
- `docs/auditoria/2026-08-15-1253-integracion-supabase.md`

## 10. Archivos modificados

- `.env.example`
- `package.json`
- `src/App.tsx`
- `docs/architecture.md`

## 11. Pendientes recomendados

1. Dar acceso del proyecto Kanso al conector Supabase de esta sesión.
2. Aplicar `20260815125300_initial_kanso_schema.sql` como migración.
3. Ejecutar consultas de verificación y Supabase Security/Performance Advisors.
4. Regenerar `database.types.ts` desde el esquema real.
5. Generar y versionar `package-lock.json`.
6. Configurar Redirect URLs de Supabase Auth para desarrollo y producción.
7. Sustituir progresivamente los datos demo por `library_items` del usuario autenticado.
8. Conectar TMDB como siguiente fuente de catálogo.

## 12. Estado del bloque

**Código de integración preparado. Base de datos Kanso pendiente de autorización/aplicación. CI pendiente de resultado final al cierre inicial de este registro.**
