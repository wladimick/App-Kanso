# Auditoría · Universos + búsqueda flotante

**Fecha:** 2026-08-17 17:03 (America/Santiago)
**Proyecto:** Kanso
**Rama:** `feat/universes-floating-search`

## Objetivo

Resolver la pantalla Marvel vacía cuando el usuario ya tiene películas/series relacionadas en su biblioteca, ampliar el concepto hacia sagas/universos y agregar un acceso rápido móvil a Descubrir.

## Estado inicial

- La vista Marvel dependía exclusivamente de la Edge Function `tmdb-marvel` para pintar contenido.
- Los títulos ya guardados por el usuario no participaban en la composición de la página.
- Marvel era el único universo destacado.
- Descubrir estaba disponible desde navegación, pero no como acceso flotante inmediato.

## Cambios ejecutados por ChatGPT

- Se crea `src/services/universes.ts` con definiciones curadas y matching normalizado.
- Primera tanda: Marvel, Caballeros del Zodiaco / Saint Seiya, Dragon Ball, Naruto, Star Wars y DC.
- La vista existente evoluciona a `Universos`, manteniendo compatibilidad con `view=marvel`.
- Cada universo muestra primero `En tu biblioteca`, detectando títulos ya guardados por nombre/título original.
- El catálogo externo usa la Edge Function `tmdb-search` ya existente a través de `searchTmdb`; deja de depender de `tmdb-marvel` para renderizar la página.
- Se agrega sección `Explorar` con deduplicación, filtro Todo/Películas/Series y `Mostrar más`.
- Menú móvil cambia `Marvel` por `Universos`.
- Se crea `FloatingSearchButton`, visible en teléfono, arriba a la izquierda, que navega directamente a `Descubrir`.
- Se rediseña `marvel.css` para soportar Universos, rail horizontal de biblioteca y grilla móvil de 3 columnas.

## Seguridad / arquitectura

- No se agregan secretos ni variables nuevas.
- No se crea una Edge Function nueva.
- El catálogo continúa pasando por `tmdb-search`, que ya requiere sesión autenticada y mantiene el token TMDB del lado servidor.
- No se modifica esquema Supabase ni RLS.

## QA agregado

`tests/universes-search.test.mjs` valida:

1. universos iniciales;
2. detección desde la biblioteca antes del catálogo externo;
3. uso del servicio TMDB protegido existente;
4. navegación de la lupa flotante;
5. montaje global y visibilidad solo móvil;
6. grilla de 3 columnas en teléfono.

## Limitaciones conscientes

- La pertenencia a un universo se detecta mediante un catálogo de palabras clave curado; es suficientemente útil para esta primera versión, pero no reemplaza metadata explícita de franquicia/colección/estudio.
- Agrupación por estudio de animación (MAPPA, Toei, Bones, Ufotable, etc.) queda como siguiente evolución, idealmente usando metadata de compañías de TMDB/AniList en vez de inferir solo por título.

## Pendiente de cierre

- Ejecutar CI completo.
- Validar Preview Vercel.
- QA visual en iPhone/iPad.
- Merge solo después de aprobación del usuario.
