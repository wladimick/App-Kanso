# Auditoría · Merge PR #2 y despliegue de producción

**Fecha:** 2026-08-15 17:36 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `main`  
**PR:** `#2`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar el cierre de la etapa que habilita posters reales de TMDB en la biblioteca de Kanso y confirmar el despliegue asociado en Vercel.

## 2. Estado previo

El PR #2 `Show persisted TMDB posters in Kanso library` tenía:

- CI exitoso;
- Preview de Vercel en estado Ready;
- `mergeable: true`;
- QA funcional con sesión real pendiente por no disponer de acceso directo a la cuenta Supabase Kanso desde ChatGPT.

## 3. Acciones realizadas

1. PR #2 marcado como `Ready for review`.
2. Squash merge ejecutado contra `main`.
3. GitHub confirmó merge exitoso.
4. Commit resultante del squash merge: `109e5da5efcef1215329b34feaf584f37c5f87dc`.
5. Se consultó el estado combinado del commit resultante.
6. El check `Vercel` devolvió estado `success`.

## 4. Resultado funcional esperado

Para registros de `library_items` con `poster_url`:

- `Mi biblioteca` muestra el poster real;
- `Viendo ahora` muestra el poster real;
- si la URL no existe o la imagen falla, se muestran iniciales como fallback;
- el estado de seguimiento sigue mostrándose sobre la carátula.

No se requirió ninguna migración SQL adicional porque `poster_url` ya formaba parte del esquema y ya se persistía al agregar elementos desde TMDB.

## 5. Persistencia de usuario

Durante esta etapa se mantiene Kanso como producto personal en experiencia y QA.

Sin embargo, los datos autenticados no se almacenan únicamente en la sesión del navegador. La biblioteca se persiste en Supabase y continúa asociada a `user_id`, protegida mediante RLS por usuario.

Esto permite habilitar varios usuarios más adelante sin reemplazar el modelo de datos actual.

## 6. Validaciones

### Automatizadas

- Kanso CI #95: success.
- Kanso CI #96 tras actualización documental: success.
- Vercel Preview PR #2: Ready.
- Vercel check sobre commit de merge `109e5da...`: success.

### Funcionales pendientes

Debe verificarse manualmente con la cuenta real de Kanso:

1. autenticación Supabase;
2. búsqueda TMDB;
3. agregar una película o serie;
4. comprobar poster en biblioteca;
5. recargar navegador y comprobar persistencia;
6. cambiar el título a estado `watching` cuando esa función esté disponible y verificar poster en `Viendo ahora`.

## 7. Estado final

**PR #2 integrado a `main` y despliegue Vercel asociado confirmado como exitoso. La funcionalidad de posters ya está en producción a nivel de código; queda QA funcional con la sesión real del usuario.**
