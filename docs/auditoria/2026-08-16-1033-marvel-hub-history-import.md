# Auditoría · Marvel Hub + preparación de import histórico

**Fecha:** 2026-08-16 10:33 CLT  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/marvel-hub-history-import`  
**Responsable:** ChatGPT · GPT-5.6 Sol

## Objetivo

1. Crear una sección independiente de Marvel dentro de Kanso.
2. Preparar una carga inicial segura del historial conocido del usuario sin perder integración TMDB.

## Marvel Hub

Se agregó:

- `src/components/MarvelHubRoute.tsx`;
- `src/services/marvel.ts`;
- `src/marvel.css`;
- `supabase/functions/tmdb-marvel/index.ts`.

### Comportamiento

- nueva navegación `Marvel` en menú móvil;
- entrada Marvel en sidebar desktop mediante portal React;
- pestañas Todo / Películas / Series;
- tarjetas en 3 columnas en móvil, fallback a 2 columnas <=340px;
- rating TMDB visible;
- descripción en desktop/tablet;
- botón Agregar a Kanso;
- detección de títulos ya guardados;
- paginación `Cargar más`.

### Fuente del catálogo

La Edge Function:

1. busca compañías que contienen `Marvel` en TMDB;
2. conserva explícitamente Marvel Studios, company ID 420, como ancla estable;
3. consulta `/discover/movie` y `/discover/tv` usando `with_companies`;
4. combina y deduplica resultados;
5. ordena por fecha de estreno descendente y luego popularidad;
6. requiere usuario autenticado y mantiene `TMDB_READ_ACCESS_TOKEN` en servidor.

No se modifica SQL ni RLS.

## Import histórico

Se crea `docs/import/2026-08-16-historial-conocido.md` con títulos y estados que pueden inferirse con alta confianza a partir del historial conversacional.

Se evita generar todavía un INSERT masivo con `source='manual'`, ya que eso degradaría las nuevas fichas ricas de Kanso. La estrategia recomendada es resolver primero cada título contra TMDB y luego insertar con `source='tmdb'` + `external_id` real.

Títulos ambiguos como Dragon Ball, Digimon, Fullmetal Alchemist y Saint Seiya requieren selección de la serie exacta antes de un import definitivo.

## QA agregado

`tests/marvel-hub.test.mjs` cubre:

1. destino Marvel en menú móvil;
2. Edge Function autenticada;
3. uso de `/discover/movie`, `/discover/tv` y `with_companies`;
4. inclusión estable de company 420;
5. inserción de resultados como TMDB en biblioteca;
6. filtros Películas/Series y paginación;
7. grilla móvil de 3 columnas;
8. montaje global de ruta + CSS.

## Pendiente operativo

- ejecutar CI, TypeScript y build;
- validar Vercel Preview;
- desplegar `tmdb-marvel` en el Supabase de Kanso para activar el catálogo real;
- preparar import TMDB definitivo del historial una vez resueltos los títulos ambiguos.
