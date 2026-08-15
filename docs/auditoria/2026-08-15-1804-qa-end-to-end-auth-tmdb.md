# Auditoría · QA end-to-end Auth + TMDB

**Fecha:** 2026-08-15 18:04 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama documental:** `docs/qa-end-to-end-auth-tmdb`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar la primera validación funcional end-to-end realizada sobre Kanso desplegado en Vercel, con autenticación Supabase, consulta del catálogo TMDB y persistencia de títulos en la biblioteca personal.

## 2. Evidencia informada por el usuario

El usuario aportó una captura de la aplicación en ejecución donde se observa:

- sesión Supabase activa mediante Magic Link;
- estado `Biblioteca sincronizada con Supabase`;
- buscador TMDB habilitado y devolviendo resultados reales para `naruto`;
- posters reales entregados por TMDB;
- dos títulos ya persistidos en `Mi biblioteca`: `Naruto Shippuden` y `Naruto`;
- ambos títulos visibles después de agregarlos, con poster y estado `Pendiente`;
- contador `Por ver` igual a `2`;
- contador `Viendo ahora` igual a `0`;
- contador `Completados` igual a `0`.

Esta evidencia confirma que el bloqueo anterior de Magic Link hacia localhost fue resuelto mediante la configuración de Auth del proyecto Supabase correcto.

## 3. Flujo validado

```text
Vercel / Kanso
  ↓
Supabase Auth / Magic Link
  ↓
sesión autenticada
  ↓
Supabase Edge Function tmdb-search
  ↓
TMDB
  ↓
Agregar a Kanso
  ↓
library_items
  ↓
Mi biblioteca
```

## 4. Resultados

### Autenticación

**Resultado:** OK.

El usuario ya puede iniciar sesión en el deployment de Vercel sin ser redirigido a localhost.

### TMDB

**Resultado:** OK.

El buscador devuelve metadata real, posters, títulos, años, puntuación y sinopsis.

### Persistencia

**Resultado:** funcional según evidencia visual.

Los títulos agregados aparecen en la biblioteca personal asociada a la sesión autenticada. El modelo continúa separando datos por `user_id` y RLS aunque el MVP se optimizará primero para un único usuario.

### Posters

**Resultado:** OK.

Los posters persisten y se visualizan correctamente en `Mi biblioteca`.

## 5. Hallazgo funcional pendiente

TMDB clasifica `Naruto` y `Naruto Shippuden` como contenido TV. En la interfaz actual Kanso los presenta como `Serie`, no como `Anime`.

Esto no es un fallo del guardado ni de TMDB: Kanso todavía no tiene una capa de clasificación específica de anime.

Opciones para una etapa posterior:

1. integrar AniList como fuente especializada para anime/manga;
2. crear una regla de clasificación adicional para resultados TMDB (por ejemplo, origen/genres) con revisión manual;
3. permitir al usuario cambiar manualmente el tipo de un título guardado.

La opción recomendada a medio plazo sigue siendo AniList para anime/manga, manteniendo TMDB para películas y series.

## 6. Siguientes pruebas recomendadas

1. recargar la aplicación y confirmar que `Naruto` y `Naruto Shippuden` continúan en la biblioteca;
2. permitir cambiar un título de `Pendiente` a `Viendo`;
3. obtener temporadas y episodios reales desde TMDB para series;
4. guardar `current_season` y `current_episode`;
5. verificar `+1 episodio` y registro en `watch_events`;
6. permitir marcar una película como `Vista`;
7. agregar puntuación personal;
8. resolver clasificación de anime;
9. integrar AniList en una etapa posterior.

## 7. Estado final

**Primer QA end-to-end de producción exitoso para autenticación, búsqueda TMDB, alta en biblioteca y visualización de posters. Kanso ya funciona como biblioteca personal básica para el usuario propietario.**
