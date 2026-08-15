# Auditoría · Activación de biblioteca Supabase

**Fecha de inicio:** 2026-08-15 13:15 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `agent/initial-kanso-app`  
**PR:** `#1`  
**Responsable de ejecución:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar la aplicación manual del esquema inicial en el proyecto Supabase correcto de Kanso y activar en el frontend la lectura de la biblioteca real para usuarios autenticados, manteniendo datos de demostración únicamente para sesiones no autenticadas.

## 2. Cambio de estado informado por el usuario

El usuario confirmó que trabaja con un proyecto Supabase alojado en otra cuenta distinta de la conexión Supabase disponible en esta sesión de ChatGPT.

El usuario informó haber aplicado manualmente en ese proyecto el contenido de:

`supabase/migrations/20260815125300_initial_kanso_schema.sql`

### Clasificación de auditoría

- **Aplicación de migración:** informada como realizada manualmente por el usuario.
- **Proyecto objetivo:** Kanso, ref conocido `gfqudpbtxhquwsrtahnm`.
- **Verificación directa desde ChatGPT:** no disponible porque la conexión Supabase de esta sesión pertenece a otra cuenta/proyecto.
- **WebOps TIBOX:** no fue modificado.

La auditoría anterior `2026-08-15-1253-integracion-supabase.md` se conserva sin reescribir como evidencia histórica del estado que existía al cierre de ese bloque. Este documento registra el cambio de estado posterior.

## 3. Decisión de arquitectura

A partir de este bloque el frontend distingue explícitamente dos modos:

### Usuario sin sesión

- utiliza únicamente datos de demostración;
- los avances `+1` son locales y no persisten;
- se informa visualmente que Kanso está en modo demostración.

### Usuario autenticado

- deja de mostrar los datos demo;
- consulta exclusivamente `library_items` pertenecientes al usuario autenticado;
- los avances de episodio utilizan el servicio Supabase existente;
- el backend registra tanto el progreso actual como un evento en `watch_events`;
- una biblioteca vacía se representa como estado vacío real y no se rellena artificialmente con contenido demo.

Esta separación evita mezclar información ficticia con información personal persistida.

## 4. Acciones realizadas

### 4.1 Hook de biblioteca remota

Se creó:

`src/hooks/useLibrary.ts`

Responsabilidades:

- cargar `library_items` con `listLibrary(userId)`;
- limpiar estado al cerrar sesión;
- exponer estado de carga y error;
- refrescar la biblioteca;
- avanzar episodios mediante `updateProgress`;
- actualizar el estado React con la fila devuelta por Supabase.

Commit inicial asociado:

`3ffba31543f4640c77a4f5577282ee317f200dff` — `Connect authenticated library state to Supabase`.

### 4.2 Dashboard conectado a sesión

Se modificó:

`src/App.tsx`

Cambios:

- consume `useAuth()` para conocer la sesión actual;
- consume `useLibrary(session?.user.id)`;
- transforma filas `library_items` al modelo visual actual de Kanso;
- excluye temporalmente `manga` de la vista hasta implementar su UI específica;
- mantiene los datos demo solamente si no existe sesión;
- muestra datos Supabase exclusivamente cuando existe sesión;
- el botón `+1` escribe en Supabase para usuarios autenticados;
- mantiene actualización local para modo demo;
- agrega indicador visual de fuente de datos;
- agrega mensaje de error de sincronización;
- agrega estados vacíos para biblioteca/progreso reales.

Commit asociado:

`9cc80de4021d50b71e2423b2d41c2a9a17b1a2e5` — `Use Supabase library for authenticated sessions`.

### 4.3 Estados visuales de sincronización

Se creó:

`src/data-state.css`

Incluye estilos para:

- modo de datos;
- sincronización Supabase;
- errores de backend;
- biblioteca vacía;
- progreso vacío.

Commit asociado:

`f4fe0d14aa6ead764f6605c26bb75164b238c642` — `Add data synchronization states`.

### 4.4 Carga de estilos

Se modificó `src/main.tsx` para importar `src/data-state.css`.

Commit asociado:

`d28bd82d7f962a3480d60a978621f93f79051459` — `Load Supabase data state styles`.

## 5. Seguridad

No se modificaron las políticas de base de datos en este bloque.

Se mantiene el modelo definido en la migración inicial:

- autenticación requerida para datos personales;
- RLS por `auth.uid()`;
- sin CRUD anónimo sobre las tablas personales;
- frontend con publishable key, nunca con `service_role`/secret key.

El frontend continúa enviando `user_id`, pero la autorización efectiva debe seguir siendo responsabilidad de RLS en la base de datos.

## 6. Validación CI

La versión de código que activó la biblioteca remota fue validada por GitHub Actions en el run de PR `#25` (`31897892465`).

Resultado:

- Setup Node.js 22: **SUCCESS**;
- `npm ci`: **SUCCESS**;
- `npm run typecheck`: **SUCCESS**;
- `npm run build`: **SUCCESS**;
- cleanup del workflow: **SUCCESS**.

No se detectaron errores TypeScript ni fallos de build en este bloque.

## 7. Validación funcional pendiente

Aunque el código compila y el esquema fue informado como aplicado, ChatGPT no puede verificar directamente la base del proyecto Kanso desde la conexión Supabase actual.

Por tanto queda pendiente una prueba funcional con una sesión real contra la cuenta correcta:

1. iniciar sesión mediante Magic Link;
2. confirmar que una sesión autenticada obtiene biblioteca vacía sin errores;
3. insertar/agregar un título real;
4. confirmar lectura desde `library_items`;
5. avanzar un episodio con `+1`;
6. confirmar actualización de `library_items`;
7. confirmar creación del evento correspondiente en `watch_events`;
8. cerrar sesión y confirmar regreso al modo demo;
9. validar Redirect URLs de Supabase Auth;
10. ejecutar Security/Performance Advisors desde la cuenta correcta de Supabase.

## 8. Siguiente etapa propuesta

Con la persistencia del dashboard preparada, la siguiente etapa técnica será integrar **TMDB** como catálogo de películas y series para poder buscar un título y agregarlo a `library_items` sin cargar fichas manualmente.

AniList se incorporará después para enriquecer anime y posteriormente manga.

## 9. Estado de cierre

**Migración informada como aplicada manualmente por el usuario en el proyecto correcto. Frontend conectado a `library_items` para sesiones autenticadas. Modo demo separado de datos reales. TypeScript y build verificados exitosamente en CI. La validación funcional contra la cuenta Supabase real queda pendiente hasta ejecutar Kanso con autenticación sobre ese proyecto.**
