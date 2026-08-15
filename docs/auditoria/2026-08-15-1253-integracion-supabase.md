# Auditoría · Integración inicial Supabase

**Fecha de inicio:** 2026-08-15 12:53 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de ejecución:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Preparar Kanso para persistir biblioteca, progreso y colecciones en Supabase, incorporar autenticación passwordless, versionar un esquema seguro y establecer una bitácora de auditoría antes de conectar TMDB/AniList.

## 2. Estado inicial

- MVP React + Vite + TypeScript con datos de demostración.
- Variables de Supabase documentadas en `.env.example`.
- Sin cliente Supabase instalado.
- Sin esquema SQL versionado.
- Sin autenticación.
- Sin protocolo de auditoría en `docs/`.
- CI inexistente.
- Sin `package-lock.json` versionado.

## 3. Verificación previa de Supabase

Se consultó el conector Supabase disponible en la sesión.

Resultado:

- El conector tiene acceso al proyecto `WebOps Tibox` (`kgqnczgtmyjaalmbmrbs`).
- El proyecto Kanso indicado por su URL corresponde al ref `gfqudpbtxhquwsrtahnm`.
- Al intentar consultar `gfqudpbtxhquwsrtahnm`, Supabase respondió que la conexión actual no tiene permisos para esa acción.

**Decisión:** no ejecutar DDL ni consultas sobre otro proyecto. La migración queda preparada en GitHub pero no se marca como aplicada. El proyecto WebOps TIBOX no fue modificado.

## 4. Referencias técnicas verificadas

Antes de implementar se revisó documentación actual de Supabase y las versiones de las dependencias relevantes.

Criterios adoptados:

- React + Vite utiliza `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Las claves `sb_publishable_...` están diseñadas para uso en frontend y deben combinarse con RLS.
- `sb_secret_...` / `service_role` no deben exponerse en cliente.
- Magic Link se implementa mediante `signInWithOtp` y requiere Redirect URLs autorizadas.
- El proyecto se establece sobre Node.js 22+.
- `@supabase/supabase-js` se fijó a la versión `2.111.0`.

Fuentes consultadas:

- https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/changelog?types=deprecation
- https://www.npmjs.com/package/@supabase/supabase-js

## 5. Acciones realizadas

### 5.1 Variables de entorno

`.env.example` quedó configurado con:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_TMDB_ACCESS_TOKEN` preparado pero sin valor.

La publishable key entregada por el usuario se documentó como variable de frontend. No se agregó ninguna clave secreta o `service_role`.

### 5.2 Runtime y dependencias

`package.json` fue actualizado:

- versión de Kanso: `0.2.0`;
- Node.js: `>=22.0.0`;
- `@supabase/supabase-js`: `2.111.0` exacto;
- script `npm run typecheck`;
- build mantiene `tsc -b && vite build`.

Se creó `src/vite-env.d.ts` para tipar las variables Vite.

### 5.3 Cliente Supabase

Se creó `src/lib/supabase.ts`:

- instancia única del cliente browser;
- utiliza solamente URL + publishable key;
- `persistSession: true`;
- `autoRefreshToken: true`;
- `detectSessionInUrl: true`;
- expone `isSupabaseConfigured`;
- no impide compilar cuando las variables no existen;
- `requireSupabase()` evita usar servicios de datos si falta configuración.

### 5.4 Contrato TypeScript de base de datos

Se creó `src/lib/database.types.ts` con tipos iniciales para:

- `library_items`;
- `collections`;
- `collection_items`;
- `watch_events`.

Estos tipos son provisionales y deben regenerarse desde Supabase después de aplicar el esquema real.

### 5.5 Servicio de biblioteca

Se creó `src/services/library.ts` con operaciones iniciales:

- listar biblioteca del usuario;
- upsert por proveedor + ID externo;
- actualizar temporada/episodio/estado;
- registrar eventos de avance o finalización.

La intención es que TMDB/AniList sean proveedores de catálogo, mientras que Supabase sea la fuente de verdad del progreso personal.

### 5.6 Autenticación

Se crearon:

- `src/hooks/useAuth.ts`;
- `src/components/AuthPanel.tsx`;
- `src/components/AuthPanel.css`.

Funcionalidad implementada:

- recuperación de sesión browser;
- suscripción a cambios de autenticación;
- acceso passwordless mediante Magic Link;
- cierre de sesión;
- estado visual cuando Supabase no está configurado en runtime.

`src/App.tsx` fue actualizado para incorporar el panel de autenticación. Los títulos del dashboard continúan siendo datos demo de forma intencional hasta validar la base real.

### 5.7 Esquema y seguridad

Se creó:

`supabase/migrations/20260815125300_initial_kanso_schema.sql`

Tablas:

1. `library_items`
2. `collections`
3. `collection_items`
4. `watch_events`

Controles incluidos:

- claves foráneas a `auth.users`;
- borrado en cascada de datos del usuario;
- restricciones para proveedor, tipo de medio y estado;
- puntuación entre 0 y 10;
- claves únicas para impedir duplicados de catálogo por usuario;
- claves foráneas compuestas para impedir relaciones cruzadas entre usuarios;
- índices por usuario, estado, tipo y fecha;
- RLS habilitado en todas las tablas;
- permisos revocados a `anon`;
- CRUD otorgado a `authenticated`, condicionado por RLS;
- políticas `SELECT`, `INSERT`, `UPDATE` y `DELETE` con `(select auth.uid()) = user_id`;
- políticas UPDATE con `USING` y `WITH CHECK`.

La migración **no fue aplicada** por falta de autorización del conector al proyecto Supabase Kanso.

### 5.8 Documentación

Se creó `docs/auditoria/README.md` como protocolo obligatorio para los bloques de trabajo futuros.

Se actualizó `docs/architecture.md` con:

- separación catálogo/progreso;
- modelo de datos;
- autenticación;
- seguridad;
- runtime;
- estado real de las fases.

Se actualizó `README.md` con:

- requisitos;
- instalación local;
- variables de entorno;
- migración;
- advertencias de seguridad;
- comandos de calidad;
- protocolo de auditoría;
- estado actual del proyecto.

### 5.9 Pull Request

El PR `#1` se mantuvo como **draft** y su descripción fue actualizada para reflejar el alcance real de Supabase, RLS, autenticación, lockfile, CI, auditoría y pendientes de autorización del proyecto Kanso.

## 6. CI, incidencia detectada y corrección

Se creó `.github/workflows/ci.yml` para validar Kanso en GitHub Actions.

### Primer intento

Run: `31897031995`.

Resultado:

- Checkout: OK.
- Node.js 22: OK.
- Instalación de dependencias: OK.
- Typecheck: **FAIL**.
- Build: omitido por el fallo anterior.

Errores encontrados:

- `src/components/AuthPanel.tsx(27,51): TS18047: 'supabase' is possibly 'null'`.
- `src/components/AuthPanel.tsx(40,29): TS18047: 'supabase' is possibly 'null'`.

No se ocultó el fallo ni se desactivó TypeScript. Se corrigió el narrowing del cliente Supabase mediante una referencia local validada después del guard.

Commit de corrección:

`2ce09b2bff49c08e203a33bf6dc57c7e6f9db906` — `Fix Supabase client nullability in auth panel`.

### Actualización del runtime de GitHub Actions

Los logs también mostraron advertencias de runtime sobre acciones antiguas. El workflow fue actualizado a:

- `actions/checkout@v6`;
- `actions/setup-node@v6`;
- Node.js 22 para la aplicación.

Commit:

`e17fcae6531980b53996c56230743346852076b5` — `Update CI actions for Node 24 action runtime`.

### Validación posterior

Run de push #7: `31897100205`.

Resultado: **SUCCESS**.

Además, el run de PR #8 finalizó exitosamente.

## 7. Lockfile y reproducibilidad

La ejecución inicial no tenía `package-lock.json` versionado. Como GitHub Actions sí tenía acceso correcto a npm, se utilizó temporalmente el workflow validado para generar el lockfile después de instalar, typecheckear y construir la app.

Acciones:

1. Se otorgó temporalmente `contents: write` solo al workflow de generación.
2. Se generó `package-lock.json` mediante npm.
3. GitHub Actions creó el commit:
   - `041f71fced7281b640d56265c3c510692d5a5a36` — `Add npm dependency lockfile`.
4. Se verificó que el lockfile usa `lockfileVersion: 3` y contiene `@supabase/supabase-js: 2.111.0`.
5. Inmediatamente después, el workflow volvió a `permissions: contents: read`.
6. La instalación CI final se cambió de `npm install` a `npm ci` y se habilitó cache npm.

Run de push #12: `31897163477`.

Resultado:

- instalación: OK;
- typecheck: OK;
- build: OK;
- persistencia del lockfile: OK.

Commit de endurecimiento final:

`7c7e76871a12d059891f58a9b44b3d95367394b4` — `Harden CI with lockfile and read-only permissions`.

Run endurecido #14: `31897195835`.

Resultado final:

- `npm ci`: **SUCCESS**;
- `npm run typecheck`: **SUCCESS**;
- `npm run build`: **SUCCESS**;
- permisos del workflow: `contents: read`.

## 8. Validaciones completadas

- Dependencias instalables en Node.js 22: ✅
- `package-lock.json` reproducible y versionado: ✅
- TypeScript estricto: ✅
- Build Vite: ✅
- Cliente Supabase compila sin variables runtime: ✅
- Magic Link integrado a nivel de código: ✅
- Migración SQL versionada: ✅
- RLS definido en todas las tablas personales: ✅
- `anon` sin CRUD sobre tablas personales: ✅
- CI con permisos de solo lectura: ✅
- PR #1 actualizado con estado real: ✅

## 9. Limitaciones / no ejecutado

### Migración Supabase

**No aplicada.** El proyecto `gfqudpbtxhquwsrtahnm` no está autorizado en el conector Supabase disponible. No se tocó `WebOps Tibox`.

### Advisors Supabase

**No ejecutados** sobre Kanso por la misma falta de permisos. Deben ejecutarse después de aplicar la migración.

### Tipos generados desde base real

`database.types.ts` es un contrato inicial manual. Debe reemplazarse/regenerarse desde Supabase una vez que el esquema exista en el proyecto Kanso.

### Redirect URLs de Auth

El código de Magic Link está implementado, pero las Redirect URLs de desarrollo/producción no pueden cerrarse hasta conocer/autorizar los dominios finales en Supabase Auth.

### Datos demo

El dashboard continúa usando datos de demostración deliberadamente. No se cambia la fuente de verdad del UI antes de aplicar y validar la migración.

## 10. Archivos creados durante el bloque

- `.github/workflows/ci.yml`
- `package-lock.json`
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

## 11. Archivos modificados durante el bloque

- `.env.example`
- `package.json`
- `src/App.tsx`
- `docs/architecture.md`
- `README.md`
- `.github/workflows/ci.yml` fue ajustado sucesivamente hasta su versión final endurecida.

## 12. Commits relevantes

- `2ce09b2bff49c08e203a33bf6dc57c7e6f9db906` — fix nullabilidad Supabase.
- `e17fcae6531980b53996c56230743346852076b5` — Actions v6.
- `5fbfcb836aa03a7c12fcccc808bba9cf8b22441d` — preparación de generación de lockfile.
- `041f71fced7281b640d56265c3c510692d5a5a36` — lockfile generado por GitHub Actions.
- `9b4fb2ba3cfb359f071a2d051446909ed0023bed` — README y flujo documental.
- `7c7e76871a12d059891f58a9b44b3d95367394b4` — CI final con `npm ci` y permisos read-only.

## 13. Pendientes recomendados

1. Autorizar/conectar el proyecto Supabase Kanso `gfqudpbtxhquwsrtahnm`.
2. Aplicar `20260815125300_initial_kanso_schema.sql`.
3. Ejecutar consultas funcionales de verificación.
4. Ejecutar Supabase Security Advisors y Performance Advisors.
5. Corregir cualquier advisory antes de conectar el UI real.
6. Regenerar `database.types.ts` desde el esquema aplicado.
7. Configurar Redirect URLs de Supabase Auth.
8. Sustituir progresivamente los datos demo por `library_items` del usuario autenticado.
9. Integrar TMDB como próxima fuente de catálogo.
10. Integrar AniList después de estabilizar películas/series.

## 14. Estado de cierre del bloque

**Integración Supabase preparada en código, esquema seguro versionado, autenticación incorporada, dependencias bloqueadas y CI completamente verde. La única dependencia externa que impide activar persistencia real es la falta de acceso del conector al proyecto Supabase Kanso; por seguridad la migración permanece sin aplicar hasta contar con ese acceso.**
