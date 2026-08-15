# Auditoría · Merge PR #1 y posters en biblioteca

**Fecha:** 2026-08-15 17:31 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama base:** `main`  
**Rama de trabajo:** `feat/posters-biblioteca`  
**PR de posters:** `#2`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Cerrar el MVP inicial de Kanso mediante merge del PR #1 y comenzar una nueva etapa enfocada en mostrar los posters reales de películas y series guardadas desde TMDB.

## 2. Merge del PR #1

El PR #1 `Create initial Kanso React MVP` se encontraba en estado Draft.

Acciones realizadas:

1. intento inicial de squash merge rechazado por GitHub porque el PR seguía como Draft;
2. PR marcado como `Ready for review`;
3. GitHub confirmó `mergeable: true`;
4. squash merge ejecutado correctamente contra `main`;
5. commit resultante en `main`: `ef42949518a2b9466314eaa03cd5799487eebda1`.

El rechazo inicial por estado Draft se conserva en esta auditoría y no se clasifica como fallo de código.

## 3. Estado de posters antes del cambio

La integración ya almacenaba `poster_url` en `library_items` al agregar un título desde TMDB mediante `addLibraryItem`.

El problema estaba en la capa de presentación:

- `src/App.tsx` transformaba registros de Supabase a `LibraryItem` sin copiar `row.poster_url`;
- `LibraryItem` no declaraba `posterUrl`;
- las cards de `Viendo ahora` y `Mi biblioteca` mostraban únicamente iniciales.

Por lo tanto, **no fue necesaria una migración SQL nueva**.

## 4. Acciones realizadas

### `src/types.ts`

- agregado `posterUrl?: string` a `LibraryItem`.

### `src/App.tsx`

- mapeado `row.poster_url` a `posterUrl`;
- creado componente interno `CoverImage`;
- posters mostrados en `Viendo ahora`;
- posters mostrados en `Mi biblioteca`;
- fallback a iniciales cuando no existe poster;
- fallback a iniciales si la imagen devuelve error de carga.

### `src/styles.css`

- imagen de poster configurada para cubrir completamente la carátula mediante `object-fit: cover`;
- badge de estado mantiene prioridad visual por encima del poster;
- iniciales permanecen detrás de la imagen como fallback.

## 5. Persistencia y alcance de usuarios

Decisión de producto para esta etapa:

- la experiencia se probará y optimizará primero para el usuario propietario;
- no se construirá todavía UI administrativa o onboarding multiusuario;
- **no se eliminará la separación por usuario del modelo de datos**.

La arquitectura actual mantiene:

- autenticación Supabase;
- `user_id` en registros personales;
- RLS por `auth.uid()`.

Esto permite trabajar inicialmente como aplicación personal y posteriormente habilitar varios usuarios sin migrar a un modelo de datos completamente distinto.

Importante: el progreso no debe considerarse solamente una “sesión del navegador”. Cuando el usuario está autenticado, la biblioteca y el progreso persisten en Supabase asociados al usuario autenticado.

## 6. Archivos modificados

- `src/types.ts`
- `src/App.tsx`
- `src/styles.css`
- `docs/auditoria/2026-08-15-1731-merge-pr1-posters-biblioteca.md`

## 7. Validaciones ejecutadas

### GitHub Actions

Run: `31909793437` / Kanso CI #95.

Resultado:

- Setup Node.js 22: OK;
- `npm ci`: OK;
- `npm run typecheck`: OK;
- `npm run build`: OK;
- job completo: **success**.

### Vercel Preview

Vercel creó correctamente un Preview para el PR #2 y reportó estado **Ready**.

Preview:

`https://app-kanso-git-feat-posters-biblioteca-wladimick1.vercel.app`

La generación exitosa del Preview confirma que la rama fue aceptada por el pipeline de Vercel. La validación visual con una sesión autenticada y datos reales permanece como QA funcional del usuario.

## 8. QA funcional pendiente

No verificable directamente desde la conexión disponible de ChatGPT porque el proyecto Supabase de Kanso pertenece a otra cuenta.

Pendiente comprobar con la sesión real:

1. iniciar sesión con Supabase;
2. agregar un título con poster desde TMDB;
3. confirmar que `poster_url` persiste tras recargar;
4. confirmar poster en `Mi biblioteca`;
5. confirmar poster en `Viendo ahora` cuando el título esté en estado `watching`;
6. comprobar fallback para un título sin poster.

## 9. Siguiente etapa recomendada

Una vez validada la imagen real:

- completar flujo de detalle de título;
- permitir cambiar estado (`Pendiente`, `Viendo`, `Visto`, etc.);
- obtener temporadas/episodios reales desde TMDB;
- posteriormente integrar AniList para anime/manga.

## 10. Estado

**PR #1 integrado a `main`. PR #2 con posters implementado, CI exitoso y Vercel Preview Ready. Pendiente únicamente QA funcional con sesión real antes o después del merge, sin cambios de base de datos requeridos.**
